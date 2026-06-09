import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileArchive, FolderTree, Sparkles, UploadCloud, X } from "lucide-react";
import { env } from "../../../adapters/env";
import {
  useConfirmModulePackageImportMutation,
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
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidIcon,
  SolidProgressBar,
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
};

type StepState = {
  title: string;
  description: string;
  status: "pending" | "running" | "success" | "warning" | "error";
  output?: string;
};

type StepMap = {
  upload: StepState;
  restart: StepState;
  build: StepState;
  seed: StepState;
};

function createInitialSteps(): StepMap {
  return {
    upload: {
      title: "Upload and place files",
      description: "Awaiting archive confirmation.",
      status: "pending",
    },
    restart: {
      title: "Wait for service restart",
      description: "We will poll the backend ping endpoint after import.",
      status: "pending",
    },
    build: {
      title: "Build solid-api and solid-ui",
      description: "Build runs after the backend is reachable again.",
      status: "pending",
    },
    seed: {
      title: "Seed module metadata",
      description: "Metadata seeding runs after the build step finishes.",
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

async function pingBackendWithRetry(retries = 40, delay = 1500) {
  for (let index = 0; index < retries; index += 1) {
    try {
      const response = await fetch(`${env("NEXT_PUBLIC_BACKEND_API_URL")}/api/ping`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // keep polling until the timeout window completes
    }

    await new Promise((resolve) => window.setTimeout(resolve, delay));
  }

  return false;
}

function StepStatusIcon({ status }: { status: StepState["status"] }) {
  if (status === "running") {
    return <SolidSpinner size={14} />;
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

export function ModulePackageImportContent({ onClose, onImported }: ModulePackageImportContentProps) {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResponse, setPreviewResponse] = useState<any | null>(null);
  const [transactionKey, setTransactionKey] = useState<string | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [steps, setSteps] = useState<StepMap>(() => createInitialSteps());
  const [finalSummary, setFinalSummary] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [validateModulePackageImport] = useValidateModulePackageImportMutation();
  const [confirmModulePackageImport] = useConfirmModulePackageImportMutation();
  const [runModulePackageBuild] = useRunModulePackageBuildMutation();
  const [runModulePackageSeed] = useRunModulePackageSeedMutation();

  const updateStep = useCallback((key: keyof StepMap, nextState: Partial<StepState>) => {
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
  const stepList = useMemo(() => Object.entries(steps) as Array<[keyof StepMap, StepState]>, [steps]);
  const completedStepCount = stepList.filter(([, step]) => ["success", "warning", "error"].includes(step.status)).length;
  const progressValue = Math.round((completedStepCount / stepList.length) * 100);

  const handlePreviewArchive = async () => {
    if (!selectedFile) {
      dispatch(showToast({ severity: "error", summary: "Missing archive", detail: "Upload a .sldx archive to continue." }));
      return;
    }

    const formData = new FormData();
    formData.append("modulePackage", selectedFile);

    try {
      setIsPreviewing(true);
      const response = await validateModulePackageImport(formData).unwrap();
      setPreviewResponse(response);
      setTransactionKey(response?.transactionKey ?? null);
      setFinalSummary(null);
      setSteps(createInitialSteps());
      dispatch(
        showToast({
          severity: response?.validation?.valid ? "success" : "warn",
          summary: response?.validation?.valid ? "Archive validated" : "Archive needs attention",
          detail: response?.validation?.valid
            ? "Review the preview and start the import when you are ready."
            : "The uploaded archive is missing one or more required SolidX validation markers.",
        })
      );
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: "Preview failed", detail: getErrorMessage(error) }));
    } finally {
      setIsPreviewing(false);
    }
  };

  const runRestartBuildAndSeedFlow = useCallback(async () => {
    if (!transactionKey) return;

    let activeStep: keyof StepMap = "restart";

    try {
      updateStep("restart", {
        status: "running",
        description: "Polling /api/ping until the backend is back online.",
      });

      const backendAlive = await pingBackendWithRetry();
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
        description: "The backend responded to ping and is ready for the next steps.",
      });

      activeStep = "build";
      updateStep("build", {
        status: "running",
        description: "Building solid-api and solid-ui now.",
      });

      const buildResponse = await runModulePackageBuild({
        transactionKey,
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

      activeStep = "seed";
      updateStep("seed", {
        status: "running",
        description: "Seeding module metadata from the imported archive.",
      });

      const seedResponse = await runModulePackageSeed({
        transactionKey,
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

      setIsProcessing(false);

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
      updateStep(activeStep, {
        status: "error",
        description: getErrorMessage(error),
      });
      setFinalSummary("The module import finished partially and needs manual follow-up.");
      setIsProcessing(false);
    }
  }, [onImported, runModulePackageBuild, runModulePackageSeed, transactionKey, updateStep]);

  const handleStartImport = async () => {
    if (!transactionKey) {
      dispatch(showToast({ severity: "error", summary: "Missing preview", detail: "Preview the archive before importing it." }));
      return;
    }

    try {
      setIsProcessing(true);
      setFinalSummary(null);
      updateStep("upload", {
        status: "running",
        description: "Extracting the archive and placing files into solid-api and solid-ui.",
      });

      const response = await confirmModulePackageImport({
        transactionKey,
        overwriteExisting,
      }).unwrap();

      updateStep("upload", {
        status: "success",
        description: "Archive extracted and files were placed in the target module folders.",
        output: response?.outputs?.import,
      });

      await runRestartBuildAndSeedFlow();
    } catch (error: any) {
      updateStep("upload", {
        status: "error",
        description: getErrorMessage(error),
      });
      setFinalSummary("The module import could not be completed.");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  return (
    <>
      <SolidDialogHeader className="solid-filter-dialog-head solid-module-package-dialog__header">
        <div>
          <SolidDialogTitle className="solid-filter-dialog-title m-0">Import Module Package</SolidDialogTitle>
          <SolidDialogDescription className="solid-filter-dialog-subtitle m-0">
            Upload a `.sldx` archive, review its SolidX manifest, then import, restart-check, build, and seed in one guided flow.
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
        <section className="solid-module-package-hero">
          <div className="solid-module-package-hero__copy">
            <span className="solid-module-package-eyebrow">Custom SolidX module workflow</span>
            <h4>{previewResponse?.moduleDisplayName || previewResponse?.moduleName || "Module package import"}</h4>
            <p>
              The archive must contain a root `manifest.json`, the Nest module file, the UI module file, and the module metadata JSON under
              `solid-api/src/&lt;module&gt;/metadata`.
            </p>
          </div>
          <div className="solid-module-package-hero__status">
            <span className={`solid-module-package-badge ${isArchiveValid ? "is-success" : previewResponse ? "is-warning" : "is-neutral"}`}>
              {isArchiveValid ? "Ready to import" : previewResponse ? "Validation issues" : "Awaiting archive"}
            </span>
          </div>
        </section>

        <section className="solid-module-package-shell">
          <div className="solid-module-package-panel solid-module-package-panel--upload">
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
                <p>Choose a packaged SolidX module archive from the local file system to preview its contents before the import runs.</p>
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
                <SolidButton type="button" size="small" onClick={handlePreviewArchive} loading={isPreviewing} disabled={!selectedFile || isProcessing}>
                  Preview archive
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
                    <div className="solid-module-package-file-card__meta">{formatBytes(selectedFile.size)}</div>
                  </div>
                </div>
                <SolidButton type="button" size="small" variant="ghost" onClick={() => setSelectedFile(null)} disabled={isProcessing}>
                  Remove
                </SolidButton>
              </div>
            ) : null}
          </div>

          <div className="solid-module-package-grid">
            <div className="solid-module-package-panel">
              <div className="solid-module-package-panel__header">
                <div>
                  <h5>Archive preview</h5>
                  <p>Review validation markers, detected conflicts, and the file tree before confirming the import.</p>
                </div>
                <div className="solid-module-package-panel__metric">
                  <FolderTree size={14} />
                  <span>{previewResponse?.preview?.contentsSummary?.totalEntries ?? 0} entries</span>
                </div>
              </div>

              {previewResponse ? (
                <div className="solid-module-package-preview">
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
                </div>
              ) : (
                <div className="solid-module-package-empty">
                  <SolidSpinner size={18} />
                  <p>Select an archive and load the preview to inspect its manifest and files.</p>
                </div>
              )}
            </div>

            <div className="solid-module-package-panel">
              <div className="solid-module-package-panel__header">
                <div>
                  <h5>Import progress</h5>
                  <p>The import runs through placement, restart check, build, and seed with live step output.</p>
                </div>
                <span className="solid-module-package-progress-label">{progressValue}%</span>
              </div>

              <SolidProgressBar value={progressValue} showValue={false} className="solid-module-package-progress" />

              <div className="solid-module-package-steps">
                {stepList.map(([key, step]) => (
                  <div key={key} className={`solid-module-package-step is-${step.status}`}>
                    <div className="solid-module-package-step__icon">
                      <StepStatusIcon status={step.status} />
                    </div>
                    <div className="solid-module-package-step__copy">
                      <div className="solid-module-package-step__title">{step.title}</div>
                      <div className="solid-module-package-step__description">{step.description}</div>
                      {step.output ? <pre className="solid-module-package-step__output">{step.output}</pre> : null}
                    </div>
                  </div>
                ))}
              </div>

              {finalSummary ? <div className="solid-module-package-summary">{finalSummary}</div> : null}
            </div>
          </div>
        </section>
      </SolidDialogBody>

      <SolidDialogSeparator className="solid-filter-dialog-sep" />

      <SolidDialogFooter className="solid-module-package-dialog__footer">
        <SolidButton type="button" size="small" variant="outline" onClick={handleClose} disabled={isProcessing}>
          {finalSummary ? "Close" : "Cancel"}
        </SolidButton>

        {steps.restart.status === "error" ? (
          <SolidButton type="button" size="small" onClick={() => {
            setFinalSummary(null);
            setIsProcessing(true);
            runRestartBuildAndSeedFlow().catch((error) => {
              setIsProcessing(false);
              dispatch(showToast({ severity: "error", summary: "Restart check failed", detail: getErrorMessage(error) }));
            });
          }}>
            Retry restart check
          </SolidButton>
        ) : null}

        {!finalSummary ? (
          <SolidButton
            type="button"
            size="small"
            onClick={handleStartImport}
            disabled={!previewResponse || !isArchiveValid || isProcessing || isPreviewing}
            loading={isProcessing}
            leftIcon={<Sparkles size={14} />}
          >
            Import module
          </SolidButton>
        ) : null}
      </SolidDialogFooter>
    </>
  );
}
