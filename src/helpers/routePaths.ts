export const normalizeSolidListTreeKanbanActionPath = (currentPath: string, actionUrl: string) => {
  if (!actionUrl) return "";
  if (actionUrl.startsWith("http") || actionUrl.startsWith("/")) {
    return actionUrl;
  }

  const basePath = currentPath.replace(/\/(list|tree|kanban|card)(\/)?$/, "");
  const normalizedBase = basePath.length > 0 ? basePath : "/";
  const actionTrimmed = actionUrl.replace(/^\/+/, "");

  return `${normalizedBase.replace(/\/+$/, "")}/${actionTrimmed}`;
};

/** Build the optional record label query parameter from collection row data. */
export const getRecordUserKeyQuery = (record: any, viewMetadata: any) => {
  const data = viewMetadata?.data || viewMetadata;
  const model = data?.solidView?.model;
  const configuredUserKey = model?.userKeyField;
  const userKeyFieldName = typeof configuredUserKey === "string"
    ? configuredUserKey
    : configuredUserKey?.name;
  const metadataUserKeyFieldName = Object.entries(data?.solidFieldsMetadata || {})
    .find(([, fieldMetadata]: [string, any]) => fieldMetadata?.isUserKey)?.[0];
  const value = record?.[userKeyFieldName || metadataUserKeyFieldName];

  return value === undefined || value === null || value === ""
    ? ""
    : `recordUserKey=${encodeURIComponent(String(value))}`;
};

export const getRecordActionQuery = (viewMetadata: any) => {
  const data = viewMetadata?.data || viewMetadata;
  const editAction = data?.solidView?.layout?.attrs?.editAction;
  const params = new URLSearchParams();
  if (editAction?.name) params.set("actionName", editAction.name);
  if (editAction?.type) params.set("actionType", editAction.type);
  if (editAction?.context) params.set("actionContext", editAction.context);
  return params.toString();
};

export const buildAdminRecordFormPath = ({
  moduleName,
  modelName,
  recordId,
  viewMode,
}: {
  moduleName?: string | null;
  modelName?: string | null;
  recordId?: string | number | null;
  viewMode?: "view" | "edit";
}) => {
  if (!moduleName || !modelName || recordId === null || recordId === undefined || recordId === "") {
    return "";
  }

  const normalizedModelName = modelName
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
  const basePath = `/admin/core/${moduleName.trim()}/${normalizedModelName}/form/${recordId}`;

  return viewMode ? `${basePath}?viewMode=${viewMode}` : basePath;
};

/** Build an internal standard SolidX admin model-view path from structured route fields. */
export const buildAdminModelViewPath = ({
  moduleName,
  modelName,
  viewName,
}: {
  moduleName?: string | null;
  modelName?: string | null;
  viewName?: string | null;
}) => {
  if (!moduleName || !modelName || !viewName) return "";
  const safeSegment = /^[A-Za-z0-9_-]+$/;
  if (!safeSegment.test(moduleName.trim()) || !safeSegment.test(modelName.trim())) return "";
  if (!["list", "tree", "kanban", "card"].includes(viewName)) return "";

  const normalizedModelName = modelName.trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
  return `/admin/core/${encodeURIComponent(moduleName.trim())}/${encodeURIComponent(normalizedModelName)}/${viewName}`;
};

/** Build the standard SolidX dashboard route from metadata identifiers. */
export const buildAdminDashboardPath = ({
  moduleName,
  dashboardName,
}: {
  moduleName?: string | null;
  dashboardName?: string | null;
}) => {
  const safeSegment = /^[A-Za-z0-9_-]+$/;
  if (!moduleName || !dashboardName || !safeSegment.test(moduleName.trim()) || !safeSegment.test(dashboardName.trim())) return "";
  return `/admin/core/${encodeURIComponent(moduleName.trim())}/dashboard/${encodeURIComponent(dashboardName.trim())}`;
};

/** Accept only concrete same-origin SolidX admin routes read from custom action metadata. */
export const buildAdminCustomPath = (customRoute?: string | null) => {
  if (!customRoute || !customRoute.startsWith("/admin/") || customRoute.startsWith("//") || customRoute.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(customRoute)) return "";
  try {
    const resolved = new URL(customRoute, "https://solidx.local");
    if (resolved.origin !== "https://solidx.local" || !resolved.pathname.startsWith("/admin/")) return "";
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "";
  }
};

export const normalizeSolidFormActionPath = (currentPath: string, actionUrl: string) => {
  if (!actionUrl) return "";
  if (actionUrl.startsWith("http") || actionUrl.startsWith("/")) {
    return actionUrl;
  }

  const basePath = currentPath.replace(/\/form(\/[^/]+)?(\/)?$/, "");
  const normalizedBase = basePath.length > 0 ? basePath : "/";
  const actionTrimmed = actionUrl.replace(/^\/+/, "");

  return `${normalizedBase.replace(/\/+$/, "")}/${actionTrimmed}`;
};
