import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, Check, Copy, HardDriveDownload, TerminalSquare, Trash2 } from "lucide-react";
import { SolidCircularLoader } from "../../../../../../components/core/common/SolidLoaders/SolidCircularLoader";
import { useClearModulePackageRuntimeMutation } from "../../../../../../redux/api/moduleApi";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { SolidButton } from "../../../../../shad-cn-ui";

type RuntimeCommand = {
  key: string;
  label: string;
  command: string;
  help: string;
};

const ClearModulePackageRuntimeHeaderAction = () => {
  const dispatch = useDispatch();
  const [clearModulePackageRuntime] = useClearModulePackageRuntimeMutation();
  const [isClearing, setIsClearing] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [copiedCommandKey, setCopiedCommandKey] = useState<string | null>(null);

  const commands = useMemo<RuntimeCommand[]>(
    () => [
      {
        key: "build-api",
        label: "Build API and shared artifacts",
        command: "npx -y @solidxai/solidctl@latest build",
        help: "Run from the consuming project root after the imported files are in place.",
      },
      {
        key: "build-ui",
        label: "Build UI bundle",
        command: "npx -y @solidxai/solidctl@latest build --ui-only",
        help: "Use this when the imported package introduced or changed `solid-ui` files.",
      },
      {
        key: "seed-module",
        label: "Seed one imported module",
        command: "npx -y @solidxai/solidctl@latest seed --modules-to-seed <module-name>",
        help: "Replace `<module-name>` with the imported module if metadata files were already placed locally.",
      },
    ],
    []
  );

  const handleCopy = async (command: RuntimeCommand) => {
    try {
      await navigator.clipboard.writeText(command.command);
      setCopiedCommandKey(command.key);
      window.setTimeout(() => {
        setCopiedCommandKey((current) => (current === command.key ? null : current));
      }, 1800);
    } catch (error) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Copy failed",
          detail: "Unable to copy the recovery command to the clipboard.",
        })
      );
    }
  };

  const handleClear = async () => {
    try {
      setIsClearing(true);
      setErrorState(null);

      const response = await clearModulePackageRuntime({}).unwrap();
      const removedImports = Number(response?.removedImportTransactions ?? 0);
      const removedExports = Number(response?.removedExportTransactions ?? 0);

      dispatch(
        showToast({
          severity: "success",
          summary: "Package runtime cleared",
          detail: `Removed ${removedImports} import run(s) and ${removedExports} export run(s) from local module package runtime storage.`,
        })
      );
      dispatch(closePopup());
    } catch (error: any) {
      const detail = error?.data?.message || error?.message || "Unable to clear package runtime.";
      setErrorState(String(detail));
      dispatch(showToast({ severity: "error", summary: "Cleanup failed", detail: String(detail) }));
    } finally {
      setIsClearing(false);
    }
  };

  if (isClearing) {
    return (
      <div className="solid-generate-code-popup">
        <div className="solid-filter-dialog-head solid-generate-code-popup__head">
          <div>
            <h3 className="solid-filter-dialog-title">Clear Package Runtime</h3>
            <p className="solid-filter-dialog-subtitle m-0">Removing past import and export working files from local runtime storage.</p>
          </div>
        </div>
        <div className="solid-filter-dialog-sep" />
        <div className="solid-filter-dialog-body solid-generate-code-popup__body solid-generate-code-popup__body--loading">
          <SolidCircularLoader />
          <p className="solid-generate-code-popup__loading-title">Clearing runtime storage...</p>
          <p className="solid-generate-code-popup__loading-copy">Deleting past `.sldx` imports, exports, extracted previews, and resumable transaction markers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="solid-generate-code-popup">
      <div className="solid-filter-dialog-head solid-generate-code-popup__head">
        <div>
          <h3 className="solid-filter-dialog-title">Clear Package Runtime</h3>
          <p className="solid-filter-dialog-subtitle m-0">
            Remove all past module package import and export temp storage from the local SolidX runtime.
          </p>
        </div>
      </div>
      <div className="solid-filter-dialog-sep" />
      <div className="solid-filter-dialog-body solid-generate-code-popup__body">
        <p className="solid-generate-code-popup__intro">
          This clears all incomplete and completed package import or export runs, including previews, extracted archives,
          resumable transaction state, and generated `.sldx` export artifacts.
        </p>

        <div className="solid-generate-code-popup__panel">
          <div className="solid-generate-code-popup__panel-title">
            <HardDriveDownload size={15} />
            <span>What gets removed</span>
          </div>
          <ul className="solid-generate-code-popup__list">
            <li>Uploaded `.sldx` files and extracted import working folders</li>
            <li>Import preview metadata, status files, and resumable pointers</li>
            <li>Generated export staging folders and downloaded archive temp files</li>
            <li>Any stale package runtime state kept under `.solidx-runtime`</li>
          </ul>
        </div>

        <div className="solid-generate-code-popup__notice is-warning">
          <AlertTriangle size={16} />
          <span>
            If a package was already imported and files were placed into `solid-api` or `solid-ui`, this cleanup does not
            roll those files back. If build and seed were not run yet, the developer must do that manually afterward.
          </span>
        </div>

        <div className="solid-generate-code-popup__panel">
          <div className="solid-generate-code-popup__panel-title">
            <TerminalSquare size={15} />
            <span>Manual recovery commands</span>
          </div>
          <div className="solid-generate-code-popup__command-grid">
            {commands.map((command) => {
              const copied = copiedCommandKey === command.key;
              return (
                <div key={command.key} className="solid-generate-code-popup__command-item">
                  <div className="solid-generate-code-popup__command-meta">
                    <div className="solid-generate-code-popup__command-label">{command.label}</div>
                    <pre className="solid-generate-code-popup__command-code">{command.command}</pre>
                    <div className="solid-generate-code-popup__command-help">{command.help}</div>
                  </div>
                  <SolidButton
                    size="small"
                    variant="outline"
                    className="solid-generate-code-popup__command-copy"
                    leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
                    onClick={() => handleCopy(command)}
                  >
                    {copied ? "Copied" : "Copy"}
                  </SolidButton>
                </div>
              );
            })}
          </div>
        </div>

        {errorState ? (
          <div className="solid-generate-code-popup__notice is-warning">
            <AlertTriangle size={16} />
            <span>{errorState}</span>
          </div>
        ) : null}

        <div className="solid-generate-code-popup__actions">
          <SolidButton
            size="small"
            autoFocus
            severity="danger"
            leftIcon={<Trash2 size={14} />}
            onClick={handleClear}
          >
            Clear Package Runtime
          </SolidButton>
          <SolidButton size="small" variant="outline" onClick={() => dispatch(closePopup())}>
            Cancel
          </SolidButton>
        </div>
      </div>
    </div>
  );
};

export { ClearModulePackageRuntimeHeaderAction };
