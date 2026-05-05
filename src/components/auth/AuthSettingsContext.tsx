import { createContext, useContext } from "react";

type AuthSettingsContextValue = {
  solidSettingsData: any;
  isLoadingAuthSettings: boolean;
  reloadAuthSettings: () => Promise<void>;
};

const noopReload = async () => {};

export const AuthSettingsContext = createContext<AuthSettingsContextValue>({
  solidSettingsData: null,
  isLoadingAuthSettings: false,
  reloadAuthSettings: noopReload,
});

export function useAuthSettings() {
  return useContext(AuthSettingsContext);
}
