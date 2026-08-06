import type { SolidKanbanViewHandle } from "./SolidKanbanView";

const kanbanViewRegistry = new Map<string, SolidKanbanViewHandle>();

export const registerKanbanView = (kanbanId: string, handle: SolidKanbanViewHandle): void => {
  kanbanViewRegistry.set(kanbanId, handle);
};

export const unregisterKanbanView = (kanbanId: string): void => {
  kanbanViewRegistry.delete(kanbanId);
};

export const getKanbanView = (kanbanId: string): SolidKanbanViewHandle | undefined => {
  return kanbanViewRegistry.get(kanbanId);
};

export const hasKanbanView = (kanbanId: string): boolean => {
  return kanbanViewRegistry.has(kanbanId);
};

export const getRegisteredKanbanViewIds = (): string[] => {
  return Array.from(kanbanViewRegistry.keys());
};
