import authenticationReducer from "../features/authSlice";
import dataViewReducer from "../features/dataViewSlice";
import navbarReducer from "../features/navbarSlice";
import popupReducer from "../features/popupSlice";
import themeReducer from "../features/themeSlice";
import toastReducer from "../features/toastSlice";
import userReducer from "../features/userSlice";
import solidStudioReducer from "../features/solidStudioSlice";
import { authApi } from "../api/authApi";
import { aiInteractionApi } from "../api/aiInteractionApi";
import { dashboardApi } from "../api/dashboardApi";
import { dashboardQuestionApi } from "../api/dashboardQuestionApi";
import { exportTemplateApi } from "../api/exportTemplateApi";
import { fieldsApi } from "../api/fieldApi";
import { importTransactionApi } from "../api/importTransactionApi";
import { mediaApi } from "../api/mediaApi";
import { mediaStorageProviderApi } from "../api/mediaStorageProviderApi";
import { modulesApi } from "../api/moduleApi";
import { modelsApi } from "../api/modelApi";
import { roleApi } from "../api/roleApi";
import { solidActionsApi } from "../api/solidActionApi";
import { solidChatterMessageApi } from "../api/solidChatterMessageApi";
import { solidMenusApi } from "../api/solidMenuApi";
import { solidServiceApi } from "../api/solidServiceApi";
import { solidSettingsApi } from "../api/solidSettingsApi";
import { solidViewsApi } from "../api/solidViewApi";
import { userApi } from "../api/userApi";
import { dashboardLayoutApi } from "../api/dashboardLayoutApi";

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
    aiInteractionApi,
    dashboardLayoutApi
];

// 2. Export default reducers
export const solidReducers = {
    authentication: authenticationReducer,
    auth: userReducer,
    theme: themeReducer,
    popup: popupReducer,
    navbarState: navbarReducer,
    dataViewState: dataViewReducer,
    solidStudio: solidStudioReducer,
    toast: toastReducer,
};  
