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
