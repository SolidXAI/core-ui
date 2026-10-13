import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { History, TriangleAlert } from "lucide-react";
import { SolidCircularLoader } from "../../../../../../components/core/common/SolidLoaders/SolidCircularLoader";
import {
  useLazyGetLatestModulePackageBackupQuery,
  useRestoreModulePackageImportMutation,
} from "../../../../../../redux/api/moduleApi";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { SolidButton } from "../../../../../shad-cn-ui";

const formatVersion = (version?: string | null) => (version ? `v${version}` : "unversioned");

const RestoreModulePackageRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
  const dispatch = useDispatch();
  const moduleName = String(event?.rowData?.name || event?.rowData?.id || "").trim();
  const moduleDisplayName = String(event?.rowData?.displayName || moduleName || "this module").trim();

  const [fetchLatestBackup] = useLazyGetLatestModulePackageBackupQuery();
  const [restoreModulePackageImport] = useRestoreModulePackageImportMutation();
  const [backup, setBackup] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetchLatestBackup({ moduleName }, false).unwrap();
        if (!cancelled) setBackup(response ?? null);
      } catch (error: any) {
        if (!cancelled) setErrorState(String(error?.data?.message || error?.message || "Unable to look up backups for this module."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchLatestBackup, moduleName]);

  const handleRestore = async () => {
    if (!backup?.transactionKey) return;

    try {
      setIsRestoring(true);
      setErrorState(null);
      await restoreModulePackageImport({ transactionKey: backup.transactionKey }).unwrap();
      dispatch(
        showToast({
          severity: "success",
          summary: "Previous version restored",
          detail: `${moduleDisplayName} ${formatVersion(backup.backup?.version)} was put back. Wait for the UI and API to restart, then refresh this module list page to continue with build and seed.`,
        }),
      );
      dispatch(closePopup());
    } catch (error: any) {
      const detail = String(error?.data?.message || error?.message || "Unable to restore the previous version.");
      setErrorState(detail);
      dispatch(showToast({ severity: "error", summary: "Restore failed", detail }));
      setIsRestoring(false);
    }
  };

  if (isLoading || isRestoring) {
    return (
      <div className="solid-generate-code-popup">
        <div className="solid-filter-dialog-head solid-generate-code-popup__head">
          <div>
            <h3 className="solid-filter-dialog-title">Restore Previous Version</h3>
          </div>
        </div>
        <div className="solid-filter-dialog-sep" />
        <div className="solid-filter-dialog-body solid-generate-code-popup__body solid-generate-code-popup__body--loading">
          <SolidCircularLoader />
          <p className="solid-generate-code-popup__loading-title">{isRestoring ? "Restoring..." : "Looking for a backup..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="solid-generate-code-popup">
      <div className="solid-filter-dialog-head solid-generate-code-popup__head">
        <div>
          <h3 className="solid-filter-dialog-title">Restore Previous Version</h3>
          <p className="solid-filter-dialog-subtitle m-0">Put back the module folders from before the last update.</p>
        </div>
      </div>
      <div className="solid-filter-dialog-sep" />
      <div className="solid-filter-dialog-body solid-generate-code-popup__body">
        {backup ? (
          <>
            <p className="solid-generate-code-popup__intro">
              Restore <strong>{moduleDisplayName}</strong> from <strong>{formatVersion(backup.currentVersion)}</strong> back to{" "}
              <strong>{formatVersion(backup.backup?.version)}</strong>. The backup was taken on{" "}
              {backup.backup?.createdAt ? new Date(backup.backup.createdAt).toLocaleString() : "an earlier update"}.
            </p>

            <div className="solid-generate-code-popup__panel">
              <div className="solid-generate-code-popup__panel-title">
                <History size={15} />
                <span>What happens</span>
              </div>
              <ul className="solid-generate-code-popup__list">
                <li>The solid-api and solid-ui folders for this module are replaced with the backup.</li>
                <li>The UI and API restart. Refresh this page afterwards and continue with build and seed; prune is turned on for that seed.</li>
              </ul>
            </div>

            <div className="solid-generate-code-popup__notice is-warning">
              <TriangleAlert size={16} />
              <span>
                When the API restarts, the database schema is synced to the restored code: columns added by the newer version are dropped
                along with their data, and tables it added are left in place. Back up the database first if this module has data you care about.
              </span>
            </div>
          </>
        ) : (
          <p className="solid-generate-code-popup__intro">
            There is no backup for <strong>{moduleDisplayName}</strong>. A backup is taken each time the module is updated from a package.
          </p>
        )}

        {errorState ? (
          <div className="solid-generate-code-popup__notice is-warning">
            <TriangleAlert size={16} />
            <span>{errorState}</span>
          </div>
        ) : null}

        <div className="solid-generate-code-popup__actions">
          {backup ? (
            <SolidButton size="small" variant="destructive" leftIcon={<History size={14} />} onClick={handleRestore}>
              Restore {formatVersion(backup.backup?.version)}
            </SolidButton>
          ) : null}
          <SolidButton size="small" variant="outline" onClick={() => dispatch(closePopup())}>
            {backup ? "Cancel" : "Close"}
          </SolidButton>
        </div>
      </div>
    </div>
  );
};

export default RestoreModulePackageRowAction;
