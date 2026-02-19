import type { SolidListViewHandle } from "./SolidListView";

const listViewRegistry = new Map<string, SolidListViewHandle>();

export const registerListView = (listId: string, handle: SolidListViewHandle): void => {
  listViewRegistry.set(listId, handle);
};

export const unregisterListView = (listId: string): void => {
  listViewRegistry.delete(listId);
};

export const getListView = (listId: string): SolidListViewHandle | undefined => {
  return listViewRegistry.get(listId);
};

export const hasListView = (listId: string): boolean => {
  return listViewRegistry.has(listId);
};

export const getRegisteredListViewIds = (): string[] => {
  return Array.from(listViewRegistry.keys());
};

