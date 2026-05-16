import { useEffect, useRef } from "react";
import { matchRoutes, Outlet, useLocation, type RouteObject } from "react-router-dom";
import { getSettingsMap } from "../helpers/settingsPayload";
import { useGetAuthSettingsQuery } from "../redux/api/solidSettingsApi";
import type { SolidPageMeta } from "./types";

function normalizePart(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function uniqueParts(parts: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    if (!part || seen.has(part)) continue;
    seen.add(part);
    result.push(part);
  }

  return result;
}

export function SolidRouteMetadataBoundary({ routes }: { routes: RouteObject[] }) {
  const location = useLocation();
  const { data: authSettings } = useGetAuthSettingsQuery(undefined);
  const initialDescriptionRef = useRef(
    typeof document !== "undefined"
      ? document.querySelector('meta[name="description"]')?.getAttribute("content") ?? ""
      : "",
  );

  useEffect(() => {
    const matches = matchRoutes(routes, location) ?? [];
    const handles = matches
      .map((match) => match.route.handle as SolidPageMeta | undefined)
      .filter((handle): handle is SolidPageMeta => Boolean(handle));

    const hasExplicitOptOut = handles.some((handle) => handle.manageDocumentMeta === false);
    const hasAutoManagedMeta = handles.some(
      (handle) =>
        handle.manageDocumentMeta === true ||
        Boolean(handle.title || handle.description || handle.titlePrefix || handle.titleSuffix),
    );

    if (hasExplicitOptOut || !hasAutoManagedMeta) {
      return;
    }

    const settingsMap = getSettingsMap(authSettings);
    const resolvedAppTitle = normalizePart(settingsMap.appTitle) ?? "SolidX";
    const resolvedTitle = [...handles]
      .reverse()
      .map((handle) => normalizePart(handle.title))
      .find(Boolean);
    const resolvedDescription = [...handles]
      .reverse()
      .map((handle) => normalizePart(handle.description))
      .find(Boolean);
    const titlePrefixes = handles.map((handle) => normalizePart(handle.titlePrefix));
    const titleSuffixes = handles.map((handle) => normalizePart(handle.titleSuffix));

    const nextTitleParts = uniqueParts([...titlePrefixes, resolvedTitle, ...titleSuffixes, resolvedAppTitle]);
    document.title = nextTitleParts.join(" | ");

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        resolvedDescription ?? normalizePart(initialDescriptionRef.current) ?? resolvedAppTitle,
      );
    }
  }, [authSettings, location, routes]);

  return <Outlet />;
}
