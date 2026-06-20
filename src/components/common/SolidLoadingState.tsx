import type { ReactNode } from "react";
import { SolidSpinner } from "../shad-cn-ui";
import styles from "./SolidLoadingState.module.css";

type SolidLoadingStateProps = {
  title?: string;
  description?: string;
  spinnerLabel?: string;
  children?: ReactNode;
};

export function SolidLoadingState({
  title = "Loading",
  description = "Please wait while we prepare things for you.",
  spinnerLabel,
  children,
}: SolidLoadingStateProps) {
  return (
    <section className={styles.solidLoadingState} aria-busy="true" aria-live="polite">
      <div className={styles.card}>
        <SolidSpinner size={28} className={styles.spinner} label={spinnerLabel} />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        {children}
      </div>
    </section>
  );
}
