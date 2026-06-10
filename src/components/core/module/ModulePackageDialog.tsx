import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileArchive, FolderTree, Sparkles, UploadCloud, X } from "lucide-react";
import {
  useConfirmModulePackageImportMutation,
  useDismissModulePackageImportMutation,
  useLazyGetModulePackageImportStatusQuery,
  useRunModulePackageBuildMutation,
  useRunModulePackageSeedMutation,
  useValidateModulePackageImportMutation,
} from "../../../redux/api/moduleApi";
import { showToast } from "../../../redux/features/toastSlice";
import { useDispatch } from "react-redux";
import { waitForBackendAvailability } from "../../../helpers/waitForBackendAvailability";
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
};

type StepStatus = "pending" | "running" | "success" | "warning" | "error";
type StepKey = "preview" | "import" | "restart" | "build" | "seed";

type StepState = {
  title: string;
  description: string;
  status: StepStatus;
  output?: string;
};

type StepMap = Record<StepKey, StepState>;

const STEP_ORDER: StepKey[] = ["preview", "import", "restart", "build", "seed"];

function createInitialSteps(): StepMap {
  return {
    preview: {
      title: "Preview",
      description: "Upload a `.sldx` archive to validate it and preview its contents automatically.",
      status: "pending",
    },
    import: {
      title: "Import",
      description: "Place the module files into the local `solid-api` and `solid-ui` folders.",
      status: "pending",
    },
    restart: {
      title: "Wait for backend",
      description: "Check when the backend is available again after the import reboot.",
      status: "pending",
    },
    build: {
      title: "Build",
      description: "Run `solidctl build` and `solidctl build --ui-only` after the backend is back up.",
      status: "pending",
    },
    seed: {
      title: "Seed",
      description: "Seed the imported module after the build step completes.",
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
  ].includes(String(status ?? ""));
}

function getBuildStepStatusFromTransaction(transaction: any): StepStatus {
  if (transaction?.status === "build_running") return "warning";
  if (transaction?.outputs?.build) {
    return String(transaction.outputs.build).includes("[failed]") ? "warning" : "success";
  }
  return "pending";
}

function hydrateStepsFromTransaction(transaction: any): StepMap {
  const nextSteps = createInitialSteps();
  const status = String(transaction?.status ?? "");

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
    transaction?.outputs?.import ||
    ["awaiting_restart", "build_running", "build_failed", "build_succeeded", "seed_running", "seed_failed", "completed"].includes(status)
  ) {
    nextSteps.import = {
      ...nextSteps.import,
      status: "success",
      description: "Archive extracted and files were placed in the target module folders.",
      output: transaction?.outputs?.import ?? undefined,
    };
  }

  if (["build_running", "build_failed", "build_succeeded", "seed_running", "seed_failed", "completed"].includes(status)) {
    nextSteps.restart = {
      ...nextSteps.restart,
      status: "success",
      description: "The backend is available again and the workflow moved beyond restart verification.",
    };
  } else if (status === "awaiting_restart") {
    nextSteps.restart = {
      ...nextSteps.restart,
      status: "pending",
      description: "The services are rebooting. Click Refresh when you want to check backend availability.",
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
  if (steps.restart.status !== "success") return "restart";
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

export function ModulePackageImportContent({ onClose, onImported, initialTransactionKey = null, autoResume = false }: ModulePackageImportContentProps) {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResponse, setPreviewResponse] = useState<any | null>(null);
  const [transactionKey, setTransactionKey] = useState<string | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [steps, setSteps] = useState<StepMap>(() => createInitialSteps());
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

  const canImport = steps.preview.status !== "pending" && isArchiveValid && steps.import.status !== "success" && !isProcessing && !isPreviewing;
  const canCheckBackendAvailability = steps.import.status === "success" && !isProcessing;
  const canRunBuild = steps.restart.status === "success" && !isProcessing;
  const canRunSeed = (steps.build.status === "success" || steps.build.status === "warning") && !isProcessing;
  const canContinueFromPreview = Boolean(previewResponse) && isArchiveValid && !isPreviewing;

  const activeStep = useMemo<StepKey>(() => {
    if (selectedStep === "seed" && !(steps.build.status === "success" || steps.build.status === "warning" || steps.seed.status !== "pending")) {
      return suggestedStep;
    }

    if (selectedStep === "build" && !(steps.restart.status === "success" || steps.build.status !== "pending")) {
      return suggestedStep;
    }

    if (selectedStep === "restart" && !(steps.import.status === "success" || steps.restart.status !== "pending")) {
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
    steps.restart.status,
    steps.seed.status,
    suggestedStep,
  ]);

  const completedSteps = STEP_ORDER.filter((stepKey) => steps[stepKey].status === "success").length;
  const maxUnlockedStepIndex = useMemo(() => {
    if (!previewResponse || !isArchiveValid) return 0;
    if (steps.import.status !== "success") return 1;
    if (steps.restart.status !== "success") return 2;
    if (steps.build.status !== "success" && steps.build.status !== "warning") return 3;
    return 4;
  }, [isArchiveValid, previewResponse, steps.build.status, steps.import.status, steps.restart.status]);

  const handlePreviewArchive = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append("modulePackage", selectedFile);

    try {
      setIsPreviewing(true);
      const response = await validateModulePackageImport(formData).unwrap();
      setPreviewResponse(response);
      setTransactionKey(response?.transactionKey ?? null);
      setOverwriteExisting(false);
      setFinalSummary(null);
      setSteps(hydrateStepsFromTransaction(response));
      setSelectedStep("preview");
      dispatch(
        showToast({
          severity: response?.validation?.valid ? "success" : "warn",
          summary: response?.validation?.valid ? "Archive validated" : "Archive needs attention",
          detail: response?.validation?.valid
            ? "Review the preview and continue with the import when you are ready."
            : "The uploaded archive is missing one or more required SolidX validation markers.",
        }),
      );
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: "Preview failed", detail: getErrorMessage(error) }));
    } finally {
      setIsPreviewing(false);
    }
  }, [dispatch, selectedFile, validateModulePackageImport]);

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
      description: "Running `solidctl seed --modules-to-seed` for the imported module.",
    });

    const seedResponse = await runModulePackageSeed({
      transactionKey: activeTransactionKey,
      seedGlobalMetadata: false,
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
  }, [runModulePackageSeed, updateStep]);

  const handleCheckBackendAvailability = useCallback(async () => {
    setIsProcessing(true);
    setFinalSummary(null);
    updateStep("restart", {
      status: "running",
      description: "Polling /api/ping until the backend is back online.",
    });

    const backendAlive = await waitForBackendAvailability({
      retries: 80,
      delayMs: 1500,
    });

    if (!backendAlive) {
      updateStep("restart", {
        status: "error",
        description: "The backend did not come back within the retry window.",
      });
      setFinalSummary("Module files were imported, but the backend restart check timed out.");
      setIsProcessing(false);
      return;
    }

    updateStep("restart", {
      status: "success",
      description: "The backend responded to ping and is ready for the build step.",
    });
    setSelectedStep("build");
    setIsProcessing(false);
  }, [updateStep]);

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
        setFinalSummary("Module imported and seeded successfully, but the build step reported errors.");
        return;
      }

      if (seedFailed) {
        setFinalSummary("Module imported, but the seed step needs attention.");
        return;
      }

      setFinalSummary("Module import completed successfully.");
    } catch (error: any) {
      updateStep("seed", {
        status: "error",
        description: getErrorMessage(error),
      });
      setFinalSummary("The seed step needs attention before the workflow can be closed.");
      setIsProcessing(false);
    }
  }, [dispatch, executeSeedStep, onImported, previewResponse?.outputs?.build, steps.build.status, transactionKey, updateStep]);

  useEffect(() => {
    if (!initialTransactionKey || hasResumedTransactionRef.current) {
      return;
    }

    hasResumedTransactionRef.current = true;

    const loadTransaction = async () => {
      try {
        const transaction = await fetchModulePackageImportStatus({ transactionKey: initialTransactionKey }).unwrap();
        const hydratedSteps = hydrateStepsFromTransaction(transaction);
        setPreviewResponse(transaction);
        setTransactionKey(transaction?.transactionKey ?? null);
        setSteps(hydratedSteps);
        setSelectedStep(getSuggestedStepFromSteps(hydratedSteps, Boolean(transaction?.preview || transaction?.validation), Boolean(transaction?.validation?.valid)));

        if (transaction?.status === "completed") {
          setFinalSummary("Module import completed successfully.");
          return;
        }

        if (transaction?.status === "seed_failed") {
          setFinalSummary("Module imported, but the seed step needs attention.");
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
  }, [autoResume, dispatch, fetchModulePackageImportStatus, initialTransactionKey]);

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
        description: "Extracting the archive and placing files into `solid-api` and `solid-ui`.",
      });

      const response = await confirmModulePackageImport({
        transactionKey,
        overwriteExisting,
      }).unwrap();

      updateStep("import", {
        status: "success",
        description: "Archive extracted and files were placed in the target module folders.",
        output: response?.outputs?.import,
      });
      updateStep("restart", {
        status: "pending",
        description: "The services are rebooting. Click Refresh when you want to check backend availability.",
      });
      setPreviewResponse(response);
      setSelectedStep("restart");
      setIsProcessing(false);
    } catch (error: any) {
      updateStep("import", {
        status: "error",
        description: getErrorMessage(error),
      });
      setFinalSummary("The module import could not be completed.");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    if (finalSummary && transactionKey) {
      void dismissModulePackageImport({ transactionKey });
    }
    onClose();
  };

  const renderPreviewContent = () => {
    return (
      <div className="solid-module-package-preview">
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

        {selectedFile ? (
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
                setFinalSummary(null);
                setSelectedStep("preview");
                setSteps(createInitialSteps());
              }}
              disabled={isProcessing}
            >
              Remove
            </SolidButton>
          </div>
        ) : null}

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

              {hasConflicts ? (
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

            <div className="solid-module-package-tree">
              {(previewResponse?.preview?.fileTree ?? []).map((entry: string) => (
                <div key={entry} className="solid-module-package-tree__row">
                  {entry}
                </div>
              ))}
            </div>
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
          disabled={!canContinueFromPreview}
          rightIcon={<Sparkles size={14} />}
        >
          Continue to import
        </SolidButton>
      );
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
          Import Module
        </SolidButton>
      );
    }

    if (activeStep === "restart") {
      return (
        <SolidButton
          type="button"
          size="small"
          variant="outline"
          onClick={handleCheckBackendAvailability}
          disabled={!canCheckBackendAvailability}
          loading={isProcessing && steps.restart.status === "running"}
        >
          {steps.restart.status === "success" ? "Refresh Again" : "Refresh"}
        </SolidButton>
      );
    }

    if (activeStep === "build") {
      return (
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
      );
    }

    if (activeStep === "seed") {
      return (
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
      );
    }

    return null;
  };

  const renderActiveStepContent = () => {
    if (activeStep === "preview") {
      return renderPreviewContent();
    }

    if (activeStep === "import" && steps.import.output) {
      return <pre className="solid-module-package-step__output">{steps.import.output}</pre>;
    }

    if (activeStep === "build" && steps.build.output) {
      return <pre className="solid-module-package-step__output">{steps.build.output}</pre>;
    }

    if (activeStep === "seed" && steps.seed.output) {
      return <pre className="solid-module-package-step__output">{steps.seed.output}</pre>;
    }

    return null;
  };

  return (
    <>
      <SolidDialogHeader className="solid-filter-dialog-head solid-module-package-dialog__header">
        <div>
          <SolidDialogTitle className="solid-filter-dialog-title m-0">Import Module Package</SolidDialogTitle>
          <SolidDialogDescription className="solid-filter-dialog-subtitle m-0">
            Upload a `.sldx` archive, let SolidX preview it automatically, then move through import, restart verification, build, and seed.
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

            {finalSummary ? <div className="solid-module-package-summary">{finalSummary}</div> : null}
          </div>
        </section>
      </SolidDialogBody>
    </>
  );
}
