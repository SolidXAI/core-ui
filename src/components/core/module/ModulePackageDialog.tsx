import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowRight, FileArchive, FolderTree, RefreshCw, RotateCcw, Sparkles, UploadCloud, X } from "lucide-react";
import {
  useConfirmModulePackageImportMutation,
  useDismissModulePackageImportMutation,
  useLazyGetModulePackageImportStatusQuery,
  useRestoreModulePackageImportMutation,
  useRunModulePackageBuildMutation,
  useRunModulePackageSeedMutation,
  useValidateModulePackageImportMutation,
} from "../../../redux/api/moduleApi";
import { showToast } from "../../../redux/features/toastSlice";
import { useDispatch } from "react-redux";
import {
  SolidButton,
  SolidCheckbox,
  SolidDialog,
  SolidDialogBody,
  SolidDialogDescription,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidIcon,
  SolidSpinner,
} from "../../shad-cn-ui";
import "./ModulePackageDialog.css";

type ModulePackageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
};

type ModulePackageImportContentProps = {
  onClose: () => void;
  onImported?: () => void;
  initialTransactionKey?: string | null;
  autoResume?: boolean;
  // Update this installed module: the uploaded package must be for it.
  targetModuleName?: string | null;
};

type PackageMode = "install" | "update";

type StepStatus = "pending" | "running" | "success" | "warning" | "error";
type StepKey = "preview" | "import" | "build" | "seed";

type StepState = {
  title: string;
  description: string;
  status: StepStatus;
  output?: string;
};

type StepMap = Record<StepKey, StepState>;

const STEP_ORDER: StepKey[] = ["preview", "import", "build", "seed"];

const VERSION_COMPARISONS: Record<string, { label: string; tone: "neutral" | "warning" | "danger" }> = {
  new: { label: "New install", tone: "neutral" },
  upgrade: { label: "Upgrade", tone: "neutral" },
  first_version: { label: "First versioned release", tone: "neutral" },
  same: { label: "Reinstall", tone: "warning" },
  downgrade: { label: "Downgrade", tone: "danger" },
  legacy_package: { label: "Unversioned package", tone: "danger" },
};

function formatVersionLabel(version?: string | null) {
  return version ? `v${version}` : "unversioned";
}

function getPackageMode(transaction: any, fallbackMode: PackageMode = "install"): PackageMode {
  return transaction?.mode ?? transaction?.preview?.mode ?? fallbackMode;
}

function getWorkflowLabels(transaction: any, fallbackMode: PackageMode = "install") {
  if (transaction?.restoredFromBackup) return { noun: "restore", past: "restored" };
  return getPackageMode(transaction, fallbackMode) === "update"
    ? { noun: "update", past: "updated" }
    : { noun: "import", past: "imported" };
}

function createInitialSteps(mode: PackageMode = "install"): StepMap {
  const isUpdate = mode === "update";
  return {
    preview: {
      title: "Preview",
      description: isUpdate
        ? "Upload a `.sldx` archive of the new version to compare it with the installed module."
        : "Upload a `.sldx` archive to validate it and preview its contents automatically.",
      status: "pending",
    },
    import: {
      title: isUpdate ? "Update" : "Import",
      description: isUpdate
        ? "Replace the module folders with the new version. The current folders are backed up first. This may restart the UI and API, dismiss the popup, and require a page refresh before you continue."
        : "Import the files locally. This may restart the UI and API, dismiss the popup, and require a page refresh before you continue.",
      status: "pending",
    },
    build: {
      title: "Build",
      description: "After the services restart and you refresh this module list page, continue with the build step.",
      status: "pending",
    },
    seed: {
      title: "Seed",
      description: isUpdate
        ? "Seed the updated module after the build step completes."
        : "Seed the imported module after the build step completes.",
      status: "pending",
    },
  };
}

function getErrorMessage(error: any): string {
  const responseData = error?.data;
  if (typeof responseData?.message === "string") return responseData.message;
  if (Array.isArray(responseData?.message)) return responseData.message.join(", ");
  if (typeof responseData?.error === "string") return responseData.error;
  if (typeof error?.error === "string") return error.error;
  if (typeof error?.message === "string") return error.message;
  return "Something went wrong while processing the module package.";
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
}

function isResumableModulePackageStatus(status?: string | null) {
  return [
    "import_running",
    "awaiting_restart",
    "build_running",
    "build_failed",
    "build_succeeded",
    "seed_running",
    "seed_failed",
    "restore_running",
  ].includes(String(status ?? ""));
}

function getBuildStepStatusFromTransaction(transaction: any): StepStatus {
  if (transaction?.status === "build_running") return "warning";
  if (transaction?.outputs?.build) {
    return String(transaction.outputs.build).includes("[failed]") ? "warning" : "success";
  }
  return "pending";
}

function hydrateStepsFromTransaction(transaction: any, fallbackMode: PackageMode = "install"): StepMap {
  const mode = getPackageMode(transaction, fallbackMode);
  const nextSteps = createInitialSteps(mode);
  const status = String(transaction?.status ?? "");
  const { noun } = getWorkflowLabels(transaction, fallbackMode);

  if (transaction?.preview || transaction?.validation) {
    nextSteps.preview = {
      ...nextSteps.preview,
      status: transaction?.validation?.valid ? "success" : "warning",
      description: transaction?.validation?.valid
        ? "Archive validated and ready for import."
        : "Archive preview loaded, but the package has validation issues to fix first.",
    };
  }

  if (
    status !== "restore_running" &&
    (transaction?.outputs?.import ||
      ["awaiting_restart", "build_running", "build_failed", "build_succeeded", "seed_running", "seed_failed", "completed"].includes(status))
  ) {
    nextSteps.import = {
      ...nextSteps.import,
      status: "success",
      description: transaction?.restoredFromBackup
        ? "Previous version restored. Wait for the UI and API to finish restarting, then refresh this page to continue."
        : "Archive extracted. Wait for the UI and API to finish restarting, then refresh this page to continue.",
      output: [transaction?.outputs?.import, transaction?.outputs?.restore].filter(Boolean).join("\n\n") || undefined,
    };
  } else if (status === "restore_running") {
    nextSteps.import = {
      ...nextSteps.import,
      status: "warning",
      description: "Restoring the previous version did not finish. Use Restore again to complete it.",
      output: transaction?.outputs?.import ?? undefined,
    };
  }

  const buildStatus = getBuildStepStatusFromTransaction(transaction);
  if (buildStatus !== "pending") {
    nextSteps.build = {
      ...nextSteps.build,
      status: buildStatus,
      description:
        status === "build_running"
          ? "Build was previously started. Use Build Now to run it again once you are ready."
          : buildStatus === "warning"
            ? transaction?.errorMessage || "The build step completed with warnings."
            : "Both build targets completed successfully.",
      output: transaction?.outputs?.build ?? undefined,
    };
  } else if (status === "awaiting_restart") {
    nextSteps.build = {
      ...nextSteps.build,
      status: "pending",
      description: `${noun.charAt(0).toUpperCase()}${noun.slice(1)} completed. Once the UI and API are back, refresh this module list page and continue with Build Now.`,
    };
  }

  if (status === "seed_running") {
    nextSteps.seed = {
      ...nextSteps.seed,
      status: "warning",
      description: "Seed was previously started. Use Seed to run it again once you are ready.",
      output: transaction?.outputs?.seed ?? undefined,
    };
  } else if (status === "seed_failed") {
    nextSteps.seed = {
      ...nextSteps.seed,
      status: "warning",
      description: transaction?.errorMessage || "The seed step finished with warnings.",
      output: transaction?.outputs?.seed ?? undefined,
    };
  } else if (status === "completed") {
    nextSteps.seed = {
      ...nextSteps.seed,
      status: "success",
      description: "Module metadata seeding completed successfully.",
      output: transaction?.outputs?.seed ?? undefined,
    };
  }

  return nextSteps;
}

function getSuggestedStepFromSteps(steps: StepMap, hasPreview: boolean, isArchiveValid: boolean): StepKey {
  if (!hasPreview || !isArchiveValid) return "preview";
  if (steps.import.status !== "success") return "import";
  if (steps.build.status !== "success" && steps.build.status !== "warning") return "build";
  if (steps.seed.status !== "success" && steps.seed.status !== "warning") return "seed";
  return "seed";
}

function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === "running") {
    return <SolidSpinner size={16} />;
  }

  if (status === "success") {
    return <SolidIcon name="si-check-circle" />;
  }

  if (status === "warning" || status === "error") {
    return <SolidIcon name="si-exclamation-triangle" />;
  }

  return <span className="solid-module-package-step-dot" aria-hidden="true" />;
}

export function ModulePackageDialog({ open, onOpenChange, onImported }: ModulePackageDialogProps) {
  return (
    <SolidDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onOpenChange(false);
        }
      }}
      className="solid-module-package-dialog"
      dismissible={false}
      showHeader={false}
    >
      {open ? <ModulePackageImportContent onClose={() => onOpenChange(false)} onImported={onImported} /> : null}
    </SolidDialog>
  );
}

export function ModulePackageImportContent({
  onClose,
  onImported,
  initialTransactionKey = null,
  autoResume = false,
  targetModuleName = null,
}: ModulePackageImportContentProps) {
  const dispatch = useDispatch();
  const fallbackMode: PackageMode = targetModuleName ? "update" : "install";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResponse, setPreviewResponse] = useState<any | null>(null);
  const [transactionKey, setTransactionKey] = useState<string | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [acknowledgeVersionChange, setAcknowledgeVersionChange] = useState(false);
  const [pruneOnSeed, setPruneOnSeed] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [isRestoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [steps, setSteps] = useState<StepMap>(() => createInitialSteps(fallbackMode));
  const [selectedStep, setSelectedStep] = useState<StepKey>("preview");
  const [finalSummary, setFinalSummary] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [validateModulePackageImport] = useValidateModulePackageImportMutation();
  const [confirmModulePackageImport] = useConfirmModulePackageImportMutation();
  const [dismissModulePackageImport] = useDismissModulePackageImportMutation();
  const [fetchModulePackageImportStatus] = useLazyGetModulePackageImportStatusQuery();
  const [runModulePackageBuild] = useRunModulePackageBuildMutation();
  const [runModulePackageSeed] = useRunModulePackageSeedMutation();
  const [restoreModulePackageImport] = useRestoreModulePackageImportMutation();

  const hasResumedTransactionRef = useRef(false);
  const lastAutoPreviewFileRef = useRef<string | null>(null);

  const updateStep = useCallback((key: StepKey, nextState: Partial<StepState>) => {
    setSteps((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...nextState,
      },
    }));
  }, []);

  const { getRootProps, getInputProps, open: openFilePicker, isDragActive } = useDropzone({
    accept: {
      "application/octet-stream": [".sldx"],
      "application/x-zip-compressed": [".sldx"],
      "application/zip": [".sldx"],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });

  const isArchiveValid = Boolean(previewResponse?.validation?.valid);
  const hasConflicts = (previewResponse?.conflicts?.length ?? 0) > 0;
  const suggestedStep = getSuggestedStepFromSteps(steps, Boolean(previewResponse), isArchiveValid);

  const packageMode = getPackageMode(previewResponse, fallbackMode);
  const isUpdate = packageMode === "update";
  const workflowLabels = getWorkflowLabels(previewResponse, fallbackMode);
  const packageModuleName = previewResponse?.preview?.module?.name || previewResponse?.moduleName || targetModuleName || "this module";
  const installedVersion = previewResponse?.installedVersion ?? previewResponse?.preview?.installedVersion ?? null;
  const incomingVersion = previewResponse?.incomingVersion ?? previewResponse?.preview?.incomingVersion ?? null;
  const versionComparison = previewResponse?.versionComparison ?? previewResponse?.preview?.versionComparison ?? null;
  const requiresVersionAcknowledgement = Boolean(previewResponse?.preview?.requiresVersionAcknowledgement);
  // Clicking the Update button approves the shown version; risky updates also need an explicit acknowledgement.
  const isUpdateApproved = !isUpdate || !requiresVersionAcknowledgement || acknowledgeVersionChange;
  const backup = previewResponse?.backup ?? null;

  const canImport = steps.preview.status !== "pending" && isArchiveValid && isUpdateApproved && steps.import.status !== "success" && !isProcessing && !isPreviewing;
  const canRestore = Boolean(backup && transactionKey) && steps.import.status !== "pending" && !isProcessing;
  const isRestoreInterrupted = previewResponse?.status === "restore_running";
  const canRunBuild = steps.import.status === "success" && !isProcessing;
  const canRunSeed = (steps.build.status === "success" || steps.build.status === "warning") && !isProcessing;
  const canContinueFromPreview = Boolean(previewResponse) && isArchiveValid && !isPreviewing;

  const activeStep = useMemo<StepKey>(() => {
    if (selectedStep === "seed" && !(steps.build.status === "success" || steps.build.status === "warning" || steps.seed.status !== "pending")) {
      return suggestedStep;
    }

    if (selectedStep === "build" && !(steps.import.status === "success" || steps.build.status !== "pending")) {
      return suggestedStep;
    }

    if (selectedStep === "import" && !(isArchiveValid || steps.import.status !== "pending")) {
      return suggestedStep;
    }

    return selectedStep;
  }, [
    previewResponse,
    selectedStep,
    steps.build.status,
    steps.import.status,
    steps.seed.status,
    suggestedStep,
  ]);

  const completedSteps = STEP_ORDER.filter((stepKey) => steps[stepKey].status === "success").length;
  const maxUnlockedStepIndex = useMemo(() => {
    if (!previewResponse || !isArchiveValid) return 0;
    if (steps.import.status !== "success") return 1;
    if (steps.build.status !== "success" && steps.build.status !== "warning") return 2;
    return 3;
  }, [isArchiveValid, previewResponse, steps.build.status, steps.import.status]);

  const handlePreviewArchive = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append("modulePackage", selectedFile);
    if (targetModuleName) {
      formData.append("expectedModuleName", targetModuleName);
    }

    try {
      setIsPreviewing(true);
      const response = await validateModulePackageImport(formData).unwrap();
      setPreviewResponse(response);
      setTransactionKey(response?.transactionKey ?? null);
      setOverwriteExisting(false);
      setAcknowledgeVersionChange(false);
      setShowAllFiles(false);
      setFinalSummary(null);
      setSteps(hydrateStepsFromTransaction(response, fallbackMode));
      setSelectedStep("preview");
      dispatch(
        showToast({
          severity: response?.validation?.valid ? "success" : "warn",
          summary: response?.validation?.valid ? "Archive validated" : "Archive needs attention",
          detail: response?.validation?.valid
            ? `Review the preview and continue with the ${getWorkflowLabels(response, fallbackMode).noun} when you are ready.`
            : "The uploaded archive has validation issues. Review them below.",
        }),
      );
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: "Preview failed", detail: getErrorMessage(error) }));
    } finally {
      setIsPreviewing(false);
    }
  }, [dispatch, fallbackMode, selectedFile, targetModuleName, validateModulePackageImport]);

  useEffect(() => {
    if (!selectedFile) {
      lastAutoPreviewFileRef.current = null;
      return;
    }

    const fileSignature = `${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`;
    if (lastAutoPreviewFileRef.current === fileSignature) {
      return;
    }

    lastAutoPreviewFileRef.current = fileSignature;
    void handlePreviewArchive();
  }, [handlePreviewArchive, selectedFile]);

  const executeBuildStep = useCallback(async (activeTransactionKey: string) => {
    updateStep("build", {
      status: "running",
      description: "Running `solidctl build` followed by `solidctl build --ui-only`.",
    });

    const buildResponse = await runModulePackageBuild({
      transactionKey: activeTransactionKey,
      buildSolidApi: true,
      buildSolidUi: true,
    }).unwrap();

    const buildFailed = buildResponse?.status === "build_failed";
    updateStep("build", {
      status: buildFailed ? "warning" : "success",
      description: buildFailed
        ? buildResponse?.errorMessage || "The module was imported, but one or more build targets failed."
        : "Both build targets completed successfully.",
      output: buildResponse?.outputs?.build,
    });

    return buildResponse;
  }, [runModulePackageBuild, updateStep]);

  const executeSeedStep = useCallback(async (activeTransactionKey: string) => {
    updateStep("seed", {
      status: "running",
      description: `Running \`solidctl seed --modules-to-seed${pruneOnSeed ? " --prune" : ""}\` for the ${workflowLabels.past} module.`,
    });

    const seedResponse = await runModulePackageSeed({
      transactionKey: activeTransactionKey,
      seedGlobalMetadata: false,
      prune: pruneOnSeed,
    }).unwrap();

    const seedFailed = seedResponse?.status === "seed_failed";
    updateStep("seed", {
      status: seedFailed ? "warning" : "success",
      description: seedFailed
        ? seedResponse?.errorMessage || "The seed step finished with warnings."
        : "Module metadata seeding completed successfully.",
      output: seedResponse?.outputs?.seed,
    });

    return seedResponse;
  }, [pruneOnSeed, runModulePackageSeed, updateStep, workflowLabels.past]);

  const handleRunBuild = useCallback(async () => {
    if (!transactionKey) {
      dispatch(showToast({ severity: "error", summary: "Missing transaction", detail: "Import the module before running the build step." }));
      return;
    }

    try {
      setIsProcessing(true);
      setFinalSummary(null);
      const buildResponse = await executeBuildStep(transactionKey);
      setPreviewResponse(buildResponse);
      setSelectedStep("seed");
      setIsProcessing(false);
    } catch (error: any) {
      updateStep("build", {
        status: "error",
        description: getErrorMessage(error),
      });
      setFinalSummary("The build step needs attention before you continue.");
      setIsProcessing(false);
    }
  }, [dispatch, executeBuildStep, transactionKey, updateStep]);

  const handleRunSeed = useCallback(async () => {
    if (!transactionKey) {
      dispatch(showToast({ severity: "error", summary: "Missing transaction", detail: "Import the module before running the seed step." }));
      return;
    }

    try {
      setIsProcessing(true);
      setFinalSummary(null);
      const seedResponse = await executeSeedStep(transactionKey);
      setPreviewResponse(seedResponse);
      setSelectedStep("seed");
      setIsProcessing(false);

      const buildFailed = steps.build.status === "warning" || String(previewResponse?.outputs?.build ?? "").includes("[failed]");
      const seedFailed = seedResponse?.status === "seed_failed";

      if (!seedFailed) {
        onImported?.();
      }

      if (buildFailed && !seedFailed) {
        setFinalSummary(`Module ${workflowLabels.past} and seeded successfully, but the build step reported errors.`);
        return;
      }

      if (seedFailed) {
        setFinalSummary(`Module ${workflowLabels.past}, but the seed step needs attention.`);
        return;
      }

      setFinalSummary(`Module ${workflowLabels.noun} completed successfully.`);
    } catch (error: any) {
      updateStep("seed", {
        status: "error",
        description: getErrorMessage(error),
      });
      setFinalSummary("The seed step needs attention before the workflow can be closed.");
      setIsProcessing(false);
    }
  }, [dispatch, executeSeedStep, onImported, previewResponse?.outputs?.build, steps.build.status, transactionKey, updateStep, workflowLabels.noun, workflowLabels.past]);

  useEffect(() => {
    if (!initialTransactionKey || hasResumedTransactionRef.current) {
      return;
    }

    hasResumedTransactionRef.current = true;

    const loadTransaction = async () => {
      try {
        const transaction = await fetchModulePackageImportStatus({ transactionKey: initialTransactionKey }).unwrap();
        const hydratedSteps = hydrateStepsFromTransaction(transaction, fallbackMode);
        const labels = getWorkflowLabels(transaction, fallbackMode);
        setPreviewResponse(transaction);
        setTransactionKey(transaction?.transactionKey ?? null);
        setSteps(hydratedSteps);
        setPruneOnSeed(Boolean(transaction?.restoredFromBackup));
        setSelectedStep(getSuggestedStepFromSteps(hydratedSteps, Boolean(transaction?.preview || transaction?.validation), Boolean(transaction?.validation?.valid)));

        if (transaction?.status === "completed") {
          setFinalSummary(`Module ${labels.noun} completed successfully.`);
          return;
        }

        if (transaction?.status === "seed_failed") {
          setFinalSummary(`Module ${labels.past}, but the seed step needs attention.`);
          return;
        }

        if (!autoResume || !isResumableModulePackageStatus(transaction?.status)) {
          return;
        }
      } catch (error: any) {
        dispatch(showToast({ severity: "error", summary: "Unable to resume import", detail: getErrorMessage(error) }));
      }
    };

    void loadTransaction();
  }, [autoResume, dispatch, fallbackMode, fetchModulePackageImportStatus, initialTransactionKey]);

  const handleStartImport = async () => {
    if (!transactionKey) {
      dispatch(showToast({ severity: "error", summary: "Missing preview", detail: "Upload an archive and wait for preview to finish first." }));
      return;
    }

    try {
      setIsProcessing(true);
      setFinalSummary(null);
      updateStep("import", {
        status: "running",
        description: isUpdate
          ? "Backing up the current module folders and placing the new version into `solid-api` and `solid-ui`."
          : "Extracting the archive and placing files into `solid-api` and `solid-ui`.",
      });

      const response = await confirmModulePackageImport(
        isUpdate
          ? { transactionKey, confirmedVersion: incomingVersion, acknowledgeVersionChange }
          : { transactionKey, overwriteExisting },
      ).unwrap();

      updateStep("import", {
        status: "success",
        description: "Archive extracted. The local UI/API may restart now, so refresh this page once both services are back.",
        output: response?.outputs?.import,
      });
      setPreviewResponse(response);
      setIsProcessing(false);
      dispatch(
        showToast({
          severity: "success",
          summary: isUpdate ? "Module updated" : "Module imported",
          detail: isUpdate
            ? `${packageModuleName} was updated to ${formatVersionLabel(incomingVersion)}. Wait for the UI and API to restart, then refresh this module list page to continue with build and seed.`
            : "The module files were placed locally. Wait for the UI and API to restart, then refresh this module list page to continue with build and seed.",
        }),
      );
      onClose();
    } catch (error: any) {
      updateStep("import", {
        status: "error",
        description: getErrorMessage(error),
      });
      setFinalSummary(`The module ${workflowLabels.noun} could not be completed.`);
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!transactionKey || !backup) {
      return;
    }

    try {
      setIsProcessing(true);
      setFinalSummary(null);
      const response = await restoreModulePackageImport({ transactionKey }).unwrap();
      setPreviewResponse(response);
      setSteps(hydrateStepsFromTransaction(response, fallbackMode));
      setPruneOnSeed(true);
      setRestoreConfirmOpen(false);
      setIsProcessing(false);
      dispatch(
        showToast({
          severity: "success",
          summary: "Previous version restored",
          detail: `${packageModuleName} ${formatVersionLabel(backup.version)} was put back. Wait for the UI and API to restart, then refresh this module list page to continue with build and seed.`,
        }),
      );
      onClose();
    } catch (error: any) {
      setIsProcessing(false);
      dispatch(showToast({ severity: "error", summary: "Restore failed", detail: getErrorMessage(error) }));
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    if (finalSummary && transactionKey) {
      void dismissModulePackageImport({ transactionKey });
    }
    onClose();
  };

  const renderVersionApproval = () => {
    const comparison = VERSION_COMPARISONS[versionComparison ?? ""] ?? { label: "Update", tone: "neutral" };
    const identicalContent = Boolean(previewResponse?.preview?.identicalContent);
    const acknowledgementLabel = identicalContent
      ? "Reinstall anyway, even though the content is identical"
      : versionComparison === "same"
        ? `I understand this reinstalls ${formatVersionLabel(installedVersion)}`
        : versionComparison === "downgrade"
          ? `I understand this downgrades ${packageModuleName} to ${formatVersionLabel(incomingVersion)}`
          : "I understand this package has no version";

    return (
      <div className={`solid-module-package-notice${comparison.tone === "danger" ? " is-danger" : comparison.tone === "warning" ? " is-warning" : ""}`}>
        <div className="solid-module-package-notice__title">Version change</div>
        <div className="solid-module-package-version">
          <span className="solid-module-package-version__value">{formatVersionLabel(installedVersion)}</span>
          <ArrowRight size={14} aria-label="to" />
          <span className="solid-module-package-version__value">{formatVersionLabel(incomingVersion)}</span>
          <span className={`solid-module-package-version__badge is-${comparison.tone}`}>{comparison.label}</span>
        </div>
        {isArchiveValid && requiresVersionAcknowledgement ? (
          <SolidCheckbox
            checked={acknowledgeVersionChange}
            onChange={(event) => setAcknowledgeVersionChange(event.currentTarget.checked)}
            label={acknowledgementLabel}
          />
        ) : null}
      </div>
    );
  };

  const renderChangeSummary = () => {
    const changeSet = previewResponse?.preview?.changeSet;
    if (!changeSet) return null;

    const sides: Array<[string, any]> = [["solid-api", changeSet.solidApi], ["solid-ui", changeSet.solidUi]];
    return (
      <div className="solid-module-package-checklist__section">
        <div className="solid-module-package-checklist__title">Files that will change</div>
        {previewResponse?.preview?.identicalContent ? (
          <p className="solid-module-package-diff__empty">No file changes. The package content matches the installed module.</p>
        ) : null}
        {sides.map(([label, diff]) => {
          const added: string[] = diff?.added ?? [];
          const modified: string[] = diff?.modified ?? [];
          const removed: string[] = diff?.removed ?? [];
          const hasChanges = added.length + modified.length + removed.length > 0;
          return (
            <details key={label} className="solid-module-package-diff">
              <summary>
                <span className="solid-module-package-diff__side">{label}</span>
                <span className="is-added">+{added.length}</span>
                <span className="is-modified">~{modified.length}</span>
                <span className="is-removed">−{removed.length}</span>
                <span className="solid-module-package-diff__unchanged">{diff?.unchangedCount ?? 0} unchanged</span>
              </summary>
              <ul className="solid-module-package-diff__list">
                {added.map((file) => <li key={`a:${file}`} className="is-added">+ {file}</li>)}
                {modified.map((file) => <li key={`m:${file}`} className="is-modified">~ {file}</li>)}
                {removed.map((file) => <li key={`r:${file}`} className="is-removed">− {file}</li>)}
                {!hasChanges ? <li>No changes</li> : null}
              </ul>
            </details>
          );
        })}
      </div>
    );
  };

  const renderPreviewContent = () => {
    return (
      <div className="solid-module-package-preview">
        {!selectedFile ? (
          <div
            {...getRootProps({
              className: `solid-module-package-dropzone${isDragActive ? " is-active" : ""}`,
            })}
          >
            <input {...getInputProps()} />
            <div className="solid-module-package-dropzone__icon">
              <UploadCloud size={22} />
            </div>
            <div className="solid-module-package-dropzone__copy">
              <div className="solid-module-package-dropzone__title">Upload `.sldx` archive</div>
              <p>Choose a packaged SolidX module archive from the local file system. Preview starts automatically after upload.</p>
            </div>
            <div className="solid-module-package-dropzone__actions">
              <SolidButton
                type="button"
                size="small"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
              >
                Browse archive
              </SolidButton>
            </div>
          </div>
        ) : (
          <div className="solid-module-package-file-card">
            <div className="solid-module-package-file-card__main">
              <div className="solid-module-package-file-card__icon">
                <FileArchive size={18} />
              </div>
              <div>
                <div className="solid-module-package-file-card__name">{selectedFile.name}</div>
                <div className="solid-module-package-file-card__meta">
                  {formatBytes(selectedFile.size)}
                  {isPreviewing ? " • Previewing archive..." : ""}
                </div>
              </div>
            </div>
            <SolidButton
              type="button"
              size="small"
              variant="ghost"
              onClick={() => {
                setSelectedFile(null);
                setPreviewResponse(null);
                setTransactionKey(null);
                setOverwriteExisting(false);
                setAcknowledgeVersionChange(false);
                setFinalSummary(null);
                setSelectedStep("preview");
                setSteps(createInitialSteps(fallbackMode));
              }}
              disabled={isProcessing}
            >
              Remove
            </SolidButton>
          </div>
        )}

        {!previewResponse ? (
          <div className="solid-module-package-empty">
            {isPreviewing ? <SolidSpinner size={18} /> : <FolderTree size={18} />}
            <p>
              {isPreviewing
                ? "Reading the archive and validating the SolidX markers."
                : "Upload an archive to start the automatic preview and validation flow."}
            </p>
          </div>
        ) : (
          <>
            <div className="solid-module-package-metrics">
              <div className="solid-module-package-metric">
                <span className="solid-module-package-metric__label">Module</span>
                <span className="solid-module-package-metric__value">{previewResponse?.preview?.module?.name || "Unknown"}</span>
              </div>
              <div className="solid-module-package-metric">
                <span className="solid-module-package-metric__label">solid-api files</span>
                <span className="solid-module-package-metric__value">{previewResponse?.preview?.contentsSummary?.solidApiEntries ?? 0}</span>
              </div>
              <div className="solid-module-package-metric">
                <span className="solid-module-package-metric__label">solid-ui files</span>
                <span className="solid-module-package-metric__value">{previewResponse?.preview?.contentsSummary?.solidUiEntries ?? 0}</span>
              </div>
            </div>

            <div className="solid-module-package-checklist">
              {isUpdate ? renderVersionApproval() : null}
              {isUpdate ? renderChangeSummary() : null}

              <div className="solid-module-package-checklist__section">
                <div className="solid-module-package-checklist__title">Required markers</div>
                <ul className="solid-module-package-inline-list">
                  <li>{previewResponse?.preview?.requiredPaths?.metadataPath}</li>
                  <li>{previewResponse?.preview?.requiredPaths?.apiModulePath}</li>
                  <li>{previewResponse?.preview?.requiredPaths?.uiModulePath}</li>
                </ul>
              </div>

              {(previewResponse?.validation?.warnings?.length ?? 0) > 0 ? (
                <div className="solid-module-package-notice is-warning">
                  <div className="solid-module-package-notice__title">Warnings</div>
                  <ul className="solid-module-package-inline-list">
                    {previewResponse.validation.warnings.map((warning: string) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(previewResponse?.validation?.errors?.length ?? 0) > 0 ? (
                <div className="solid-module-package-notice is-danger">
                  <div className="solid-module-package-notice__title">Validation issues</div>
                  <ul className="solid-module-package-inline-list">
                    {previewResponse.validation.errors.map((error: string) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasConflicts && !isUpdate ? (
                <div className="solid-module-package-notice is-warning">
                  <div className="solid-module-package-notice__title">Existing files detected</div>
                  <ul className="solid-module-package-inline-list">
                    {previewResponse.conflicts.map((conflict: string) => (
                      <li key={conflict}>{conflict}</li>
                    ))}
                  </ul>
                  <SolidCheckbox
                    checked={overwriteExisting}
                    onChange={(event) => setOverwriteExisting(event.currentTarget.checked)}
                    label="Overwrite the existing module folders during import"
                  />
                </div>
              ) : null}
            </div>

            {isUpdate ? (
              <div>
                <SolidButton type="button" size="small" variant="ghost" onClick={() => setShowAllFiles((current) => !current)}>
                  {showAllFiles ? "Hide package files" : `Show all package files (${previewResponse?.preview?.fileTree?.length ?? 0})`}
                </SolidButton>
              </div>
            ) : null}

            {!isUpdate || showAllFiles ? (
              <div className="solid-module-package-tree">
                {(previewResponse?.preview?.fileTree ?? []).map((entry: string) => (
                  <div key={entry} className="solid-module-package-tree__row">
                    {entry}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  };

  const renderActiveStepCta = () => {
    if (activeStep === "preview") {
      return (
        <SolidButton
          type="button"
          size="small"
          onClick={() => setSelectedStep("import")}
          disabled={!canContinueFromPreview || !isUpdateApproved}
          rightIcon={<Sparkles size={14} />}
        >
          {isUpdate ? "Continue to update" : "Continue to import"}
        </SolidButton>
      );
    }

    const restoreButton = backup && !isRestoreConfirmOpen ? (
      <SolidButton
        type="button"
        size="small"
        variant="ghost"
        onClick={() => setRestoreConfirmOpen(true)}
        disabled={!canRestore}
        leftIcon={<RotateCcw size={14} />}
      >
        Restore {formatVersionLabel(backup.version)}
      </SolidButton>
    ) : null;

    if (activeStep === "import" && isRestoreInterrupted) {
      return restoreButton;
    }

    if (activeStep === "import") {
      return (
        <SolidButton
          type="button"
          size="small"
          onClick={handleStartImport}
          disabled={!canImport}
          loading={isProcessing && steps.import.status === "running"}
          leftIcon={<Sparkles size={14} />}
        >
          {isUpdate ? `Update to ${formatVersionLabel(incomingVersion)}` : "Import Module"}
        </SolidButton>
      );
    }

    if (activeStep === "build") {
      return (
        <>
          {restoreButton}
          <SolidButton
            type="button"
            size="small"
            variant="outline"
            onClick={handleRunBuild}
            disabled={!canRunBuild}
            loading={isProcessing && steps.build.status === "running"}
          >
            {steps.build.status === "success" || steps.build.status === "warning" ? "Build Again" : "Build Now"}
          </SolidButton>
        </>
      );
    }

    if (activeStep === "seed") {
      return (
        <>
          {restoreButton}
          <SolidButton
            type="button"
            size="small"
            variant="outline"
            onClick={handleRunSeed}
            disabled={!canRunSeed}
            loading={isProcessing && steps.seed.status === "running"}
          >
            {steps.seed.status === "success" || steps.seed.status === "warning" ? "Seed Again" : "Seed"}
          </SolidButton>
        </>
      );
    }

    return null;
  };

  const renderActiveStepContent = () => {
    if (activeStep === "preview") {
      return renderPreviewContent();
    }

    const restoreConfirm = isRestoreConfirmOpen && backup ? (
      <div className="solid-module-package-notice is-danger">
        <div className="solid-module-package-notice__title">Restore {formatVersionLabel(backup.version)}?</div>
        <ul className="solid-module-package-inline-list">
          <li>This puts back the {packageModuleName} folders from before this update ({formatVersionLabel(backup.version)}).</li>
          <li>When the API restarts, the database schema is synced to that code: columns added by the newer version are dropped along with their data, and tables it added are left in place.</li>
          <li>Back up the database first if this module has data you care about.</li>
          <li>After the restart, refresh this page and run build and seed again. Prune is turned on for that seed.</li>
        </ul>
        <div className="solid-module-package-notice__actions">
          <SolidButton type="button" size="small" variant="ghost" onClick={() => setRestoreConfirmOpen(false)} disabled={isProcessing}>
            Cancel
          </SolidButton>
          <SolidButton
            type="button"
            size="small"
            variant="destructive"
            onClick={handleRestore}
            disabled={!canRestore}
            loading={isProcessing}
            leftIcon={<RotateCcw size={14} />}
          >
            Restore {formatVersionLabel(backup.version)}
          </SolidButton>
        </div>
      </div>
    ) : null;

    if (activeStep === "import") {
      return (
        <div className="solid-module-package-step-stack">
          <div className="solid-module-package-notice is-warning">
            <div className="solid-module-package-notice__title">{isUpdate ? "What happens during the update" : "What happens after import"}</div>
            <ul className="solid-module-package-inline-list">
              {isUpdate ? (
                <>
                  <li>The current {packageModuleName} folders in solid-api and solid-ui are backed up, then replaced with {formatVersionLabel(incomingVersion)}. Files the new version no longer has are removed.</li>
                  <li>Local changes made inside these folders are kept only in the backup.</li>
                </>
              ) : null}
              <li>Depending on the files in this archive, both the UI and API services may restart immediately.</li>
              <li>This popup may get dismissed as part of that restart.</li>
              <li>Wait for both services to come back, then refresh this module list page to continue with build and seed.</li>
            </ul>
          </div>
          {restoreConfirm}
          {steps.import.output ? <pre className="solid-module-package-step__output">{steps.import.output}</pre> : null}
        </div>
      );
    }

    if (activeStep === "build") {
      if (!restoreConfirm && !steps.build.output) return null;
      return (
        <div className="solid-module-package-step-stack">
          {restoreConfirm}
          {steps.build.output ? <pre className="solid-module-package-step__output">{steps.build.output}</pre> : null}
        </div>
      );
    }

    if (activeStep === "seed") {
      return (
        <div className="solid-module-package-step-stack">
          {restoreConfirm}
          {isUpdate ? (
            <SolidCheckbox
              checked={pruneOnSeed}
              onChange={(event) => setPruneOnSeed(event.currentTarget.checked)}
              disabled={isProcessing}
              label="Remove metadata this module no longer defines (prune). This also removes permissions for endpoints that no longer exist."
            />
          ) : null}
          {steps.seed.output ? <pre className="solid-module-package-step__output">{steps.seed.output}</pre> : null}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <SolidDialogHeader className="solid-filter-dialog-head solid-module-package-dialog__header">
        <div>
          <SolidDialogTitle className="solid-filter-dialog-title m-0">
            {isUpdate ? `Update ${targetModuleName || packageModuleName}` : "Import Module Package"}
          </SolidDialogTitle>
          <SolidDialogDescription className="solid-filter-dialog-subtitle m-0">
            {isUpdate
              ? "Upload a `.sldx` archive of the new version, review the version change and the files that will change, then move through update, build, and seed."
              : "Upload a `.sldx` archive, let SolidX preview it automatically, then move through import, build, and seed."}
          </SolidDialogDescription>
        </div>
        {!isProcessing ? (
          <button type="button" className="solid-filter-dialog-close solid-radix-dialog-close" aria-label="Close" onClick={handleClose}>
            <X size={16} />
          </button>
        ) : null}
      </SolidDialogHeader>

      <SolidDialogSeparator className="solid-filter-dialog-sep" />

      <SolidDialogBody className="solid-filter-dialog-body solid-module-package-dialog__body">
        <section className="solid-module-package-shell">
          <div className="solid-module-package-panel solid-module-package-panel--wizard">
            <div className="solid-module-package-stepper">
              {STEP_ORDER.map((stepKey, index) => {
                const step = steps[stepKey];
                const isCurrent = activeStep === stepKey;
                const isDone = step.status === "success";
                const isWarning = step.status === "warning" || step.status === "error";
                const isUnlocked = index <= maxUnlockedStepIndex;

                return (
                  <div
                    key={stepKey}
                    className={`solid-module-package-stepper__item${isCurrent ? " is-current" : ""}${isDone ? " is-done" : ""}${isWarning ? " is-warning" : ""}${isUnlocked ? " is-clickable" : ""}`}
                  >
                    <div className="solid-module-package-stepper__track" />
                    <button
                      type="button"
                      className="solid-module-package-stepper__button"
                      onClick={() => setSelectedStep(stepKey)}
                      disabled={!isUnlocked}
                    >
                      <div className="solid-module-package-stepper__node">
                        {isDone ? <SolidIcon name="si-check" /> : <span>{index + 1}</span>}
                      </div>
                      <div className="solid-module-package-stepper__label">{step.title}</div>
                      <div className="solid-module-package-stepper__caption">{step.description}</div>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="solid-module-package-stage">
              <div className="solid-module-package-stage__meta">
                <span>Step {STEP_ORDER.indexOf(activeStep) + 1} of {STEP_ORDER.length}</span>
                <span>{completedSteps} completed</span>
              </div>
              <div className="solid-module-package-stage__header">
                <p>{steps[activeStep].description}</p>
                <div className={`solid-module-package-stage__status is-${steps[activeStep].status}`}>
                  <StepStatusIcon status={steps[activeStep].status} />
                </div>
              </div>

              {renderActiveStepContent()}

              <div className="solid-module-package-stage__cta">{renderActiveStepCta()}</div>
            </div>

            {finalSummary ? (
              <div className="solid-module-package-summary">
                <span className="solid-module-package-summary__copy">{finalSummary}</span>
                <SolidButton
                  type="button"
                  size="small"
                  variant="outline"
                  leftIcon={<RefreshCw size={14} />}
                  onClick={() => window.location.reload()}
                >
                  Reload
                </SolidButton>
              </div>
            ) : null}
          </div>
        </section>
      </SolidDialogBody>
    </>
  );
}
