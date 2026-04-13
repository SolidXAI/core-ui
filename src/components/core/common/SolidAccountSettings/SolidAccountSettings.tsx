import { useEffect, useMemo, useState } from "react";
import { SolidPersonalInfo } from "./SolidPersonalInfo";
import { SolidChangePassword } from "./SolidChangePassword";
import { SolidVersionInfo } from "./SolidVersionInfo";
import styles from "./SolidAccountSettings.module.css";
import { useLazyGetSolidSettingsQuery } from "../../../../redux/api/solidSettingsApi";

export const SolidAccountSettings = ({ showProfileSettingsDialog, setShowProfileSettingsDialog }: any) => {
  const [settingKey, setSettingKey] = useState("personal_info");

  const [trigger, { data: solidSettingsData }] = useLazyGetSolidSettingsQuery();
  useEffect(() => {
    trigger("");
  }, [trigger]);

  const settings = [
    { label: "Personal Info", key: "personal_info" },
    { label: "Change Password", key: "change_password" },
    { label: "About", key: "about" },
  ];

  const renderSettingComponent = useMemo(() => {
    switch (settingKey) {
      case "personal_info":
        return <SolidPersonalInfo />;
      case "change_password":
        return <SolidChangePassword solidSettingsData={solidSettingsData} />;
      case "about":
        return <SolidVersionInfo />;
      default:
        return null;
    }
  }, [settingKey, solidSettingsData]);

  if (!showProfileSettingsDialog) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={() => setShowProfileSettingsDialog(false)}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="solid-account-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h2 id="solid-account-settings-title" className={styles.title}>
              Account Settings
            </h2>
            <p className={styles.subtitle}>Manage your profile and security settings.</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setShowProfileSettingsDialog(false)}
            aria-label="Close account settings"
          >
            ×
          </button>
        </header>

        <div className={styles.tabsLine} role="tablist" aria-label="Account setting sections">
          {settings.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={option.key === settingKey}
              className={`${styles.tabTrigger} ${option.key === settingKey ? styles.tabActive : ""}`}
              onClick={() => setSettingKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.formWrapper}>{renderSettingComponent}</div>
      </section>
    </div>
  );
};
