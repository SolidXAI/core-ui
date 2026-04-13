import { useEffect } from "react";
import { useLazyGetSolidVersionInfoQuery } from "../../../../redux/api/solidSettingsApi";
import styles from "./SolidAccountSettings.module.css";

interface PackageVersionInfo {
  repo: "local" | "npm";
  version: string;
}

const PACKAGE_LABELS: Record<string, string> = {
  "solid-core": "Solid Core",
  "solid-core-ui": "Solid Core UI",
  "solid-code-builder": "Solid Code Builder",
};

const PACKAGE_HINTS: Record<string, string> = {
  "solid-core": "@solidxai/core",
  "solid-core-ui": "@solidxai/core-ui",
  "solid-code-builder": "@solidxai/code-builder",
};

export const SolidVersionInfo = () => {
  const [trigger, { data, isLoading, isError }] = useLazyGetSolidVersionInfoQuery();

  useEffect(() => {
    trigger("");
  }, [trigger]);

  if (isLoading) {
    return (
      <div className={styles.versionLoaderWrap}>
        <span className="solid-btn-spinner" aria-hidden="true" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className={styles.versionError}>Unable to load version information.</p>;
  }

  const packages = ((data as any)?.data ?? data) as Record<string, PackageVersionInfo>;

  return (
    <div className={styles.versionPanel}>
      <h3 className={styles.sectionTitle}>Version Information</h3>
      <p className={styles.versionCaption}>Packages powering this application</p>

      <div className={styles.versionList}>
        {Object.entries(packages).map(([key, info]) => (
          <div key={key} className={styles.versionRow}>
            <div>
              <div className={styles.versionName}>{PACKAGE_LABELS[key] || key}</div>
              <div className={styles.versionHint}>{PACKAGE_HINTS[key] || key}</div>
            </div>
            <div className={styles.versionTags}>
              <span className={styles.versionTag}>{info.version}</span>
              <span className={`${styles.versionTag} ${info.repo === "local" ? styles.repoLocal : styles.repoNpm}`}>
                {info.repo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
