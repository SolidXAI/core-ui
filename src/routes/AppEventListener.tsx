import { useEffect } from "react";
import { eventBus, AppEvents } from "../helpers/eventBus";
import { usePathname } from "../hooks/usePathname";
import { SolidStudio, PreviewModePersist } from "../components/layout/SolidAiStudioLayout";
import { useDispatch } from "react-redux";
import { showToast } from "../redux/features/toastSlice";
import { env } from "../adapters/env";

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

  return (
    <>
      <SolidStudio />
      <PreviewModePersist />
    </>
  );
}
