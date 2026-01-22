import { authenticationReducer, dataViewReducer, navbarReducer, popupReducer, settingsReducer, themeReducer, userReducer } from "@solid-ui/index";
import {
    authApi, aiInteractionApi, dashboardApi, dashboardQuestionApi, exportTemplateApi, fieldsApi,
    importTransactionApi, mediaApi, mediaStorageProviderApi, modulesApi, modelsApi, roleApi,
    solidActionsApi, solidChatterMessageApi, solidMenusApi, solidServiceApi, solidSettingsApi,
    solidViewsApi, userApi
} from "@solid-ui/index";

// 1. Export all APIs in one array
export const solidApiSlices = [
    authApi,
    userApi,
    modulesApi,
    modelsApi,
    fieldsApi,
    mediaStorageProviderApi,
    mediaApi,
    solidViewsApi,
    solidActionsApi,
    solidMenusApi,
    solidSettingsApi,
    roleApi,
    solidChatterMessageApi,
    exportTemplateApi,
    solidServiceApi,
    importTransactionApi,
    dashboardApi,
    dashboardQuestionApi,
    aiInteractionApi
];

// 2. Export default reducers
export const solidReducers = {
    authentication: authenticationReducer,
    auth: userReducer,
    theme: themeReducer,
    popup: popupReducer,
    navbarState: navbarReducer,
    settingsState: settingsReducer,
    dataViewState: dataViewReducer,
};  