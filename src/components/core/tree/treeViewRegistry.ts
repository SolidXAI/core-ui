import { SolidTreeViewHandle } from "../tree/SolidTreeView";

const treeViewRegistry = new Map<string, SolidTreeViewHandle>();

export const registerTree = (treeId: string, handle: SolidTreeViewHandle): void => {
  treeViewRegistry.set(treeId, handle);
};

export const unregisterTree = (treeId: string): void => {
  treeViewRegistry.delete(treeId);
};

export const getTree = (treeId: string): SolidTreeViewHandle | undefined => {
  return treeViewRegistry.get(treeId);
};

export const hasTree = (treeId: string): boolean => {
  return treeViewRegistry.has(treeId);
};

export const getRegisteredTreeIds = (): string[] => {
  return Array.from(treeViewRegistry.keys());
};
