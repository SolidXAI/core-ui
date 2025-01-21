// @ts-nocheck
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";
import authenticationReducer from "./features/authSlice";
import { authApi } from "./api/authApi";
import { userApi } from "./api/userApi";
import themeReducer from './features/themeSlice';
import popupReducer from './features/popupSlice';
import navbarReducer from './features/navbarSlice';
import { modulesApi } from "./api/moduleApi";
import dataViewReducer from "./features/dataViewSlice";
import { cmsBannerImagesApi } from "./api/cmsBannerImageApi";
import { menusApi } from "./api/menuApi";
import { menuItemsApi } from "./api/menuItemsApi";
import { countriesApi } from "./api/countryApi";
import { statesApi } from "./api/stateApi";
import { categorysApi } from "./api/categoryApi";
import { roleApi } from "./api/roleApi";
import { permissionApi } from "./api/permissionApi";
import { tagGroupApi } from "./api/tagGroupApi";
import { articleApi } from "./api/articleApi";
import { radixExtraModelAttributeApi } from "./api/radixExtraModelAttributeApi";
import { tagApi } from "./api/tagApi";
import { automationApi } from "./api/automationApi";
import { modelsApi } from "./api/modelApi";
import { fieldsApi } from "./api/fieldApi";
import { orderAttributeApi } from "./api/orderAttributeApi";
import { radixModelsMetadataApi } from "./api/radixModelMetadataApi";
import { radixModelsApi } from "./api/radixModelsApi";
import { citiesApi } from "./api/cityApi";
import { pincodesApi } from "./api/pincodeApi";
import { solidViewsApi } from "./api/solidViewApi";
import { solidActionsApi } from "./api/solidActionApi";
import { mediaStorageProviderApi } from "./api/mediaStorageProviderApi";
import { mediaApi } from "./api/mediaApi";
import { solidMenusApi } from "./api/solidMenuApi";
import { solidCountryApi } from "./api/solidCountryApi";
import { createSolidEntityApi } from "./api/solidEntityApi";
import { reviewApi } from "./api/reviewApi";
import { ratingApi } from "./api/ratingApi";

export function initializeStore(entities: string[] = []) {

  const reducers = {
    authentication: authenticationReducer,
    auth: userReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [modulesApi.reducerPath]: modulesApi.reducer,
    [modelsApi.reducerPath]: modelsApi.reducer,
    [fieldsApi.reducerPath]: fieldsApi.reducer,
    [mediaStorageProviderApi.reducerPath]: mediaStorageProviderApi.reducer,
    [mediaApi.reducerPath]: mediaApi.reducer,
    [cmsBannerImagesApi.reducerPath]: cmsBannerImagesApi.reducer,
    [menusApi.reducerPath]: menusApi.reducer,
    [menuItemsApi.reducerPath]: menuItemsApi.reducer,
    // [countriesApi.reducerPath]: countriesApi.reducer,
    // [statesApi.reducerPath]: statesApi.reducer,
    // [citiesApi.reducerPath]: citiesApi.reducer,
    // [pincodesApi.reducerPath]: pincodesApi.reducer,
    [categorysApi.reducerPath]: categorysApi.reducer,
    [radixModelsMetadataApi.reducerPath]: radixModelsMetadataApi.reducer,
    [radixModelsApi.reducerPath]: radixModelsApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [permissionApi.reducerPath]: permissionApi.reducer,
    [tagGroupApi.reducerPath]: tagGroupApi.reducer,
    [articleApi.reducerPath]: articleApi.reducer,
    [tagApi.reducerPath]: tagApi.reducer,
    [automationApi.reducerPath]: automationApi.reducer,
    [radixExtraModelAttributeApi.reducerPath]: radixExtraModelAttributeApi.reducer,
    [orderAttributeApi.reducerPath]: orderAttributeApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [ratingApi.reducerPath]: ratingApi.reducer,

    [solidViewsApi.reducerPath]: solidViewsApi.reducer,
    [solidActionsApi.reducerPath]: solidActionsApi.reducer,
    [solidMenusApi.reducerPath]: solidMenusApi.reducer,
    // This has now become dynamica and is added using the for loop below
    // [solidCountryApi.reducerPath]: solidCountryApi.reducer,

    theme: themeReducer,
    popup: popupReducer,
    navbarState: navbarReducer,
    dataViewState: dataViewReducer
  };

  const middlewares = [
    authApi.middleware,
    userApi.middleware,
    modulesApi.middleware,
    modelsApi.middleware,
    fieldsApi.middleware,
    mediaStorageProviderApi.middleware,
    mediaApi.middleware,
    cmsBannerImagesApi.middleware,
    menusApi.middleware,
    menuItemsApi.middleware,
    // countriesApi.middleware,
    // statesApi.middleware,
    // citiesApi.middleware,
    // pincodesApi.middleware,
    categorysApi.middleware,
    radixModelsMetadataApi.middleware,
    radixModelsApi.middleware,
    roleApi.middleware,
    permissionApi.middleware,
    tagGroupApi.middleware,
    articleApi.middleware,
    tagApi.middleware,
    automationApi.middleware,
    radixExtraModelAttributeApi.middleware,
    orderAttributeApi.middleware,
    solidViewsApi.middleware,
    solidActionsApi.middleware,
    solidMenusApi.middleware,
    reviewApi.middleware,
    ratingApi.middleware,
    // This has now become dynamica and is added using the for loop below
    // solidCountryApi.middleware
  ];

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];

    // Dynamic API slice creation... 
    const apiSlice = createSolidEntityApi(entity);

    // Use the dynamically created slice to register a reducer and middleware.
    reducers[apiSlice.reducerPath] = apiSlice.reducer;
    middlewares.push(apiSlice.middleware);
  }

  return configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(middlewares),
  });
}

export type RootState = ReturnType<ReturnType<typeof initializeStore>['getState']>;
export type AppDispatch = ReturnType<typeof initializeStore>['dispatch'];
