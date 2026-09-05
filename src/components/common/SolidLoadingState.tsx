import { useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { SolidSpinner } from "../shad-cn-ui";
import { getDefaultThemeKey, isRegisteredThemeKey, type ThemeMode } from "../../theme/theme-registry";
import "./solid-loading-state.css";

const THEME_MODE_STORAGE_KEY = "solidx.theme.mode";
const LIGHT_THEME_STORAGE_KEY = "solidx.theme.light";
const DARK_THEME_STORAGE_KEY = "solidx.theme.dark";

function applyStoredThemeBeforePaint() {
  if (typeof window === "undefined") return;

  const mode: ThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY) === "dark"
    ? "dark"
    : "light";
  const themeStorageKey = mode === "dark" ? DARK_THEME_STORAGE_KEY : LIGHT_THEME_STORAGE_KEY;
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  const theme = isRegisteredThemeKey(storedTheme, mode)
    ? storedTheme
    : getDefaultThemeKey(mode);

  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.setAttribute("data-theme", mode);

  const themeLink = document.getElementById("theme-css") as HTMLLinkElement | null;
  if (themeLink) {
    themeLink.href = `/themes/${theme}/theme.css`;
  }
}

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
  useLayoutEffect(() => {
    applyStoredThemeBeforePaint();
  }, []);

  return (
    <section className={"solid-loading-state"} aria-busy="true" aria-live="polite">
      <div className={"solid-loading-card"}>
        <SolidSpinner size={28} className={"solid-loading-spinner"} label={spinnerLabel} />
        <h2 className={"solid-loading-title"}>{title}</h2>
        <p className={"solid-loading-description"}>{description}</p>
        {children}
      </div>
    </section>
  );
}
