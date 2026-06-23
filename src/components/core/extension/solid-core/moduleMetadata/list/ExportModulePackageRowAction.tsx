import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Download, FileArchive, Files, ShieldCheck } from "lucide-react";
import { SolidCircularLoader } from "../../../../../../components/core/common/SolidLoaders/SolidCircularLoader";
import { useExportModulePackageMutation } from "../../../../../../redux/api/moduleApi";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { SolidButton } from "../../../../../shad-cn-ui";

const ExportModulePackageRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
  const dispatch = useDispatch();
  const [isExporting, setIsExporting] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [exportModulePackage] = useExportModulePackageMutation();

  const moduleName = String(event?.rowData?.name || event?.rowData?.id || "").trim();
  const moduleDisplayName = String(event?.rowData?.displayName || moduleName || "this module").trim();

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

      const response = await exportModulePackage({ moduleName }).unwrap();
      const fileUrl = window.URL.createObjectURL(response.blob);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = response.fileName || `${moduleName}.sldx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);

      dispatch(
        showToast({
          severity: "success",
          summary: "Module exported",
          detail: `${moduleDisplayName} was packaged and downloaded as a .sldx archive.`,
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
          <SolidButton size="small" autoFocus leftIcon={<Download size={14} />} onClick={handleExport}>
            Export Module
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
