import { useEffect, useMemo, useState } from "react";
import { SolidPersonalInfo } from "./SolidPersonalInfo";
import { SolidChangePassword } from "./SolidChangePassword";
import { SolidVersionInfo } from "./SolidVersionInfo";
import "./solid-account-settings.css";
import { useGetSolidVersionInfoQuery, useLazyGetSolidSettingsQuery } from "../../../../redux/api/solidSettingsApi";
import { getSettingsMap, toLegacySettingsShape } from "../../../../helpers/settingsPayload";

export const SolidAccountSettings = ({ showProfileSettingsDialog, setShowProfileSettingsDialog }: any) => {
  const [settingKey, setSettingKey] = useState("personal_info");

  const [trigger, { data: solidSettingsData }] = useLazyGetSolidSettingsQuery();
  const versionInfoQuery = useGetSolidVersionInfoQuery(undefined, {
    skip: !showProfileSettingsDialog,
  });

  useEffect(() => {
    trigger("");
  }, [trigger]);

  const settingsMap = useMemo(() => getSettingsMap(solidSettingsData), [solidSettingsData]);
  const versionInfoErrorStatus =
    versionInfoQuery.error && typeof versionInfoQuery.error === "object" && "status" in versionInfoQuery.error
      ? versionInfoQuery.error.status
      : null;

  const settings = [
    { label: "Personal Info", key: "personal_info" },
    ...(settingsMap?.passwordBasedAuth ? [{ label: "Change Password", key: "change_password" }] : []),
    ...(versionInfoErrorStatus === 403 ? [] : [{ label: "About", key: "about" }]),
  ];

  useEffect(() => {
    if (settings.some((option) => option.key === settingKey)) return;
    setSettingKey(settings[0]?.key ?? "personal_info");
  }, [settingKey, settings]);

  const renderSettingComponent = useMemo(() => {
    const legacySettings = toLegacySettingsShape(solidSettingsData);
    switch (settingKey) {
      case "personal_info":
        return <SolidPersonalInfo />;
      case "change_password":
        return <SolidChangePassword solidSettingsData={legacySettings} />;
      case "about":
        return <SolidVersionInfo />;
      default:
        return null;
    }
  }, [settingKey, solidSettingsData]);

  if (!showProfileSettingsDialog) return null;

  return (
    <div className={"solid-account-settings-backdrop"} role="presentation" onClick={() => setShowProfileSettingsDialog(false)}>
      <section
        className={"solid-account-settings-modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="solid-account-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={"solid-account-settings-header"}>
          <div>
            <h2 id="solid-account-settings-title" className={"solid-account-settings-title"}>
              Account Settings
            </h2>
            <p className={"solid-account-settings-subtitle"}>Manage your profile and security settings.</p>
          </div>
          <button
            type="button"
            className={"solid-account-settings-close-button"}
            onClick={() => setShowProfileSettingsDialog(false)}
            aria-label="Close account settings"
          >
            ×
          </button>
        </header>

        <div className={"solid-account-settings-tabs-line"} role="tablist" aria-label="Account setting sections">
          {settings.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={option.key === settingKey}
              className={`${"solid-account-settings-tab-trigger"} ${option.key === settingKey ? "solid-account-settings-tab-active" : ""}`}
              onClick={() => setSettingKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={"solid-account-settings-form-wrapper"}>{renderSettingComponent}</div>
      </section>
    </div>
  );
};
