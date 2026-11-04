import { AppEvents, eventBus } from "./eventBus";

export type AdminViewRefreshRequest = {
  moduleName: string;
  modelName: string;
  viewName: "list" | "tree" | "kanban" | "card" | "form";
  scope: "collection" | "record";
  recordId?: string;
};

export const ADMIN_VIEW_REFRESH_REQUESTED = AppEvents.AdminViewRefreshRequested;

export function requestAdminViewRefresh(request: AdminViewRefreshRequest) {
  eventBus.emit<AdminViewRefreshRequest>(ADMIN_VIEW_REFRESH_REQUESTED, request);
}

export function isMatchingAdminViewRefresh(
  request: AdminViewRefreshRequest,
  current: Pick<AdminViewRefreshRequest, "moduleName" | "modelName" | "viewName"> & { recordId?: string },
) {
  if (request.moduleName !== current.moduleName || request.modelName !== current.modelName || request.viewName !== current.viewName) {
    return false;
  }
  if (request.scope === "collection") return request.viewName !== "form";
  return request.viewName === "form" && !!request.recordId && request.recordId === current.recordId;
}
