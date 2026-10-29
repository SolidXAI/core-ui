import { useEffect } from "react";
import { eventBus, AppEvents } from "../helpers/eventBus";
import { usePathname } from "../hooks/usePathname";
import { SolidStudio } from "../components/layout/SolidAiStudioLayout";
import { useDispatch } from "react-redux";
import { showToast } from "../redux/features/toastSlice";
import { env } from "../adapters/env";
import { backendHealthMonitor, type BackendHealthState } from "../helpers/backendHealthMonitor";

type GlobalErrorPayload = {
  status?: number | string;
  message?: string;
  error?: unknown;
};

function isDevMode() {
  const envName = (env("VITE_SOLIDX_ENV") || "").toLowerCase();
  return envName === "dev" || envName === "development";
}

function formatUnknownValue(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildDevErrorDetail(payload?: GlobalErrorPayload) {
  if (!payload) return undefined;

  const error = payload.error as any;
  const lines: string[] = [];

  if (payload.status !== undefined) {
    lines.push(`Status: ${String(payload.status)}`);
  }

  if (payload.message) {
    lines.push(`Summary: ${payload.message}`);
  }

  if (error?.message) {
    lines.push(`Error: ${error.message}`);
  }

  if (error?.code) {
    lines.push(`Code: ${error.code}`);
  }

  const responseData = error?.response?.data ?? error?.data;
  const responseText = formatUnknownValue(responseData);
  if (responseText) {
    lines.push(`Response:\n${responseText}`);
  }

  if (error?.stack) {
    lines.push(`Stack:\n${error.stack}`);
  }

  return lines.length > 0 ? lines.join("\n\n") : undefined;
}

export function AppEventListener() {
  const pathname = usePathname();
  const dispatch = useDispatch();

  // Reveal scrollbars only while scrolling (see auto-hiding scrollbars in _main.scss).
  // `scroll` doesn't bubble, so one capturing listener covers every scrollable element.
  useEffect(() => {
    const timers = new WeakMap<Element, number>();
    const onScroll = (event: Event) => {
      const target = event.target;
      const element = target instanceof Element ? target : target === document ? document.documentElement : null;
      if (!element) return;
      element.setAttribute("data-scrolling", "");
      window.clearTimeout(timers.get(element));
      timers.set(element, window.setTimeout(() => element.removeAttribute("data-scrolling"), 900));
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  useEffect(() => {
    const off = eventBus.on<GlobalErrorPayload>(AppEvents.GlobalError, (payload) => {
      if (!pathname.startsWith("/admin") && !pathname.startsWith("/auth")) {
        return;
      }

      dispatch(
        showToast({
          severity: "error",
          summary: payload?.message || "Something went wrong",
          detail: isDevMode() ? buildDevErrorDetail(payload) : undefined,
          sticky: isDevMode(),
          life: isDevMode() ? 10000 : 4000,
        })
      );
    });
    return () => off();
  }, [dispatch, pathname]);

  useEffect(() => {
    let previousStatus: BackendHealthState["status"] = backendHealthMonitor.getState().status;

    return backendHealthMonitor.subscribe((state) => {
      const nextStatus = state.status;
      const didBecomeOffline = previousStatus !== "offline" && nextStatus === "offline";
      previousStatus = nextStatus;

      if (!didBecomeOffline) {
        return;
      }

      dispatch(
        showToast({
          severity: "error",
          summary: "Server unreachable",
          detail: isDevMode() ? buildDevErrorDetail({
            status: state.statusCode,
            message: state.message || "Unable to reach the server. Please try again later.",
            error: state.error,
          }) : `We have been trying to reconnect to the server for over ${Math.max(1, Math.round(state.unavailableToastDelayMs / 1000))} seconds.`,
          sticky: isDevMode(),
          life: isDevMode() ? 10000 : 5000,
        })
      );
    });
  }, [dispatch]);

  return (
    <>
      {window.self === window.top && !pathname.startsWith("/embed/agent/") && <SolidStudio />}
    </>
  );
}
