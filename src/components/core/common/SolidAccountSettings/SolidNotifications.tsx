import { useEffect, useState } from "react";
import { useFormik } from "formik";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { useBulkUpdateSolidUserSettingsMutation, useGetSolidSettingsQuery } from "../../../../redux/api/solidSettingsApi";
import { SolidButton } from "../../../shad-cn-ui/SolidButton";
import styles from "./SolidAccountSettings.module.css";
import { getSettingsMap } from "../../../../helpers/settingsPayload";

type ToastState = {
  id: number;
  severity: "success" | "error" | "info" | "warn";
  summary: string;
  detail: string;
} | null;

export const SolidNotifications = () => {
  const { data: solidSettingsData, refetch } = useGetSolidSettingsQuery(undefined);
  const settingsMap = getSettingsMap(solidSettingsData);
  const [bulkUpdateSolidSettings] = useBulkUpdateSolidUserSettingsMutation();
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const notify = (severity: "success" | "error" | "info" | "warn", summary: string, detail: string) => {
    setToast({ id: Date.now(), severity, summary, detail });
  };

  const formik = useFormik({
    initialValues: {
      enableNotification: settingsMap?.enableNotification ?? settingsMap?.enabledNotification ?? true,
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const updatedSettingsArray: Array<{ key: string; value: string | boolean; type: string }> = [];
        const currentSettings = settingsMap || {};
        Object.entries(values).forEach(([key, value]) => {
          if ((currentSettings[key] ?? "") !== (value ?? "")) {
            updatedSettingsArray.push({ key, value, type: "user" });
          }
        });

        if (!updatedSettingsArray.length) {
          notify("info", ERROR_MESSAGES.NO_CHANGE, ERROR_MESSAGES.NO_SETTING_UPDATE);
          return;
        }

        const formData = new FormData();
        formData.append("settings", JSON.stringify(updatedSettingsArray));
        const response = await bulkUpdateSolidSettings({ data: formData }).unwrap();

        if (response.statusCode === 200) {
          notify("success", ERROR_MESSAGES.UPDATED, ERROR_MESSAGES.SETTING_UPDATED);
        } else {
          notify("error", ERROR_MESSAGES.FAILED, ERROR_MESSAGES.SOMETHING_WRONG);
        }
      } catch {
        notify("error", ERROR_MESSAGES.FAILED, ERROR_MESSAGES.SOMETHING_WRONG);
      }
    },
  });

  const severityClass =
    toast?.severity === "error"
      ? styles.toastError
      : toast?.severity === "success"
        ? styles.toastSuccess
        : toast?.severity === "warn"
          ? styles.toastWarn
          : styles.toastInfo;

  return (
    <form onSubmit={formik.handleSubmit} className={styles.accountForm}>
      {toast ? (
        <div className={`${styles.toast} ${severityClass}`} role="status" aria-live="polite">
          <div>
            <div className={styles.toastTitle}>{toast.summary}</div>
            <div className={styles.toastBody}>{toast.detail}</div>
          </div>
          <button type="button" className={styles.toastClose} onClick={() => setToast(null)} aria-label="Close notification">
            ×
          </button>
        </div>
      ) : null}

      <div className={styles.accountScroll}>
        <div className={styles.switchRow}>
          <div>
            <label className={styles.sectionTitle}>Enable Notification</label>
            <div className={styles.versionCaption}>Decide whether you want to be notified of new messages or updates.</div>
          </div>
          <label className={styles.switch} aria-label="Enable notification">
            <input
              type="checkbox"
              checked={Boolean(formik.values.enableNotification)}
              onChange={(event) => formik.setFieldValue("enableNotification", event.target.checked)}
            />
            <span className={styles.switchTrack} />
          </label>
        </div>
      </div>

      <div className={styles.footerActions}>
        <SolidButton type="submit" size="sm" loading={formik.isSubmitting}>
          Save
        </SolidButton>
      </div>
    </form>
  );
};
