import type { SolidCardViewHandle } from "./SolidCardView";

const cardViewRegistry = new Map<string, SolidCardViewHandle>();

export const registerCardView = (cardId: string, handle: SolidCardViewHandle): void => {
  cardViewRegistry.set(cardId, handle);
};

export const unregisterCardView = (cardId: string): void => {
  cardViewRegistry.delete(cardId);
};

export const getCardView = (cardId: string): SolidCardViewHandle | undefined => {
  return cardViewRegistry.get(cardId);
};

export const hasCardView = (cardId: string): boolean => {
  return cardViewRegistry.has(cardId);
};

export const getRegisteredCardViewIds = (): string[] => {
  return Array.from(cardViewRegistry.keys());
};
