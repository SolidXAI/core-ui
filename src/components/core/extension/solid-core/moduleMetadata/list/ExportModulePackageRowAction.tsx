import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Download, FileArchive, Files, ShieldCheck, Tag } from "lucide-react";
import { SolidCircularLoader } from "../../../../../../components/core/common/SolidLoaders/SolidCircularLoader";
import { useExportModulePackageMutation } from "../../../../../../redux/api/moduleApi";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { SolidButton, SolidInput, SolidSegmentedControl } from "../../../../../shad-cn-ui";

type VersionBump = "none" | "patch" | "minor" | "major";

const VERSION_BUMP_OPTIONS: Array<{ label: string; value: VersionBump }> = [
  { label: "Keep", value: "none" },
  { label: "Patch", value: "patch" },
  { label: "Minor", value: "minor" },
  { label: "Major", value: "major" },
];

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

// Preview only, mirroring semver.inc; the API computes the version that is actually written.
function previewBumpedVersion(version: string, bump: VersionBump) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(-[^+]*)?/);
  if (!match || bump === "none") return version;
  const [major, minor, patch] = match.slice(1, 4).map(Number);
  const isPrerelease = Boolean(match[4]);
  if (bump === "patch") return isPrerelease ? `${major}.${minor}.${patch}` : `${major}.${minor}.${patch + 1}`;
  if (bump === "minor") return isPrerelease && patch === 0 ? `${major}.${minor}.0` : `${major}.${minor + 1}.0`;
  return isPrerelease && minor === 0 && patch === 0 ? `${major}.0.0` : `${major + 1}.0.0`;
}

const ExportModulePackageRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
  const dispatch = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [exportModulePackage] = useExportModulePackageMutation();

  const moduleName = String(event?.rowData?.name || event?.rowData?.id || "").trim();
  const moduleDisplayName = String(event?.rowData?.displayName || moduleName || "this module").trim();
  const currentVersion = String(event?.rowData?.version || "").trim() || null;
  const [bump, setBump] = useState<VersionBump>("none");
  const [initialVersion, setInitialVersion] = useState("1.0.0");
  const isInitialVersionValid = SEMVER_PATTERN.test(initialVersion.trim());
  const exportVersion = currentVersion ? previewBumpedVersion(currentVersion, bump) : initialVersion.trim();

  const exportArtifacts = useMemo(
    () => [
      "solid-api module folder",
      "solid-ui module folder",
      "manifest.json with archive checksums",
      "Packaged .sldx download",
    ],
    []
  );

  const handleExport = async () => {
    if (!moduleName) {
      setErrorState("The selected module does not have a valid name for export.");
      return;
    }

    try {
      setIsExporting(true);
      setErrorState(null);

      const response = await exportModulePackage(
        currentVersion ? { moduleName, bump } : { moduleName, version: initialVersion.trim() },
      ).unwrap();
      const fileUrl = window.URL.createObjectURL(response.blob);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = response.fileName || `${moduleName}-v${exportVersion}.sldx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);

      dispatch(
        showToast({
          severity: "success",
          summary: "Module exported",
          detail: `${moduleDisplayName} v${exportVersion} was packaged and downloaded as a .sldx archive.`,
        })
      );
      dispatch(closePopup());
    } catch (error: any) {
      const detail = error?.data?.message || error?.message || "Unable to export the selected module.";
      setErrorState(String(detail));
      dispatch(showToast({ severity: "error", summary: "Export failed", detail: String(detail) }));
    } finally {
      setIsExporting(false);
    }
  };

  if (isExporting) {
    return (
      <div className="solid-generate-code-popup">
        <div className="solid-filter-dialog-head solid-generate-code-popup__head">
          <div>
            <h3 className="solid-filter-dialog-title">Export Module</h3>
            <p className="solid-filter-dialog-subtitle m-0">Building a SolidX module package with a manifest and checksums.</p>
          </div>
        </div>
        <div className="solid-filter-dialog-sep" />
        <div className="solid-filter-dialog-body solid-generate-code-popup__body solid-generate-code-popup__body--loading">
          <SolidCircularLoader />
          <p className="solid-generate-code-popup__loading-title">Packaging module...</p>
          <p className="solid-generate-code-popup__loading-copy">Preparing the archive and starting the `.sldx` download.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="solid-generate-code-popup">
      <div className="solid-filter-dialog-head solid-generate-code-popup__head">
        <div>
          <h3 className="solid-filter-dialog-title">Export Module</h3>
          <p className="solid-filter-dialog-subtitle m-0">
            Package the selected module into a reusable `.sldx` archive for distribution across SolidX projects.
          </p>
        </div>
      </div>
      <div className="solid-filter-dialog-sep" />
      <div className="solid-filter-dialog-body solid-generate-code-popup__body">
        <p className="solid-generate-code-popup__intro">
          Export <strong>{moduleDisplayName}</strong> with its `solid-api`, `solid-ui`, and manifest assets.
        </p>

        <div className="solid-generate-code-popup__panel">
          <div className="solid-generate-code-popup__panel-title">
            <Tag size={15} />
            <span>Version</span>
          </div>
          {currentVersion ? (
            <div className="solid-export-module-version">
              <SolidSegmentedControl options={VERSION_BUMP_OPTIONS} value={bump} onChange={(value) => setBump(value)} />
              <p className="solid-export-module-version__copy">
                {bump === "none"
                  ? `Exports the current version, v${currentVersion}.`
                  : `Bumps v${currentVersion} to v${exportVersion} in the module metadata file, then exports it.`}
              </p>
            </div>
          ) : (
            <div className="solid-export-module-version">
              <label className="solid-export-module-version__label" htmlFor="export-module-initial-version">
                This module has no version yet. Set its initial version:
              </label>
              <SolidInput
                id="export-module-initial-version"
                value={initialVersion}
                onChange={(changeEvent) => setInitialVersion(changeEvent.target.value)}
                placeholder="1.0.0"
                aria-invalid={!isInitialVersionValid}
              />
              {!isInitialVersionValid ? (
                <p className="solid-export-module-version__error">Use a semver version such as 1.0.0.</p>
              ) : null}
            </div>
          )}
          <p className="solid-export-module-version__copy">
            File: <code>{moduleName}-v{exportVersion || "?"}.sldx</code>
          </p>
        </div>

        <div className="solid-generate-code-popup__panel">
          <div className="solid-generate-code-popup__panel-title">
            <FileArchive size={15} />
            <span>Archive contents</span>
          </div>
          <ul className="solid-generate-code-popup__list">
            {exportArtifacts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="solid-generate-code-popup__panel">
          <div className="solid-generate-code-popup__panel-title">
            <ShieldCheck size={15} />
            <span>Export guarantees</span>
          </div>
          <ul className="solid-generate-code-popup__list">
            <li>Archive is generated from the current local module folders.</li>
            <li>Manifest includes SHA-256 checksums for packaged module files.</li>
            <li>Download is delivered as a `.sldx` file ready for import testing.</li>
          </ul>
        </div>

        {errorState ? (
          <div className="solid-generate-code-popup__notice is-warning">
            <Files size={16} />
            <span>{errorState}</span>
          </div>
        ) : null}

        <div className="solid-generate-code-popup__actions">
          <SolidButton
            size="small"
            autoFocus
            leftIcon={<Download size={14} />}
            onClick={handleExport}
            disabled={!currentVersion && !isInitialVersionValid}
          >
            Export v{exportVersion || "?"}
          </SolidButton>
          <SolidButton size="small" variant="outline" onClick={() => dispatch(closePopup())}>
            Cancel
          </SolidButton>
        </div>
      </div>
    </div>
  );
};

export default ExportModulePackageRowAction;
