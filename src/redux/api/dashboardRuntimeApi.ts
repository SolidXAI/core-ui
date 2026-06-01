import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

type DashboardPathArgs = {
  moduleName: string;
  dashboardName: string;
};

type DashboardVariableOptionsArgs = DashboardPathArgs & {
  variableName: string;
  query?: string;
  optionValue?: string;
  limit?: number;
  offset?: number;
  formValues?: Record<string, any> | string;
};

const toQueryString = (args: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(args).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "object") {
      searchParams.set(key, JSON.stringify(value));
      return;
    }
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
};

export const dashboardRuntimeApi = createApi({
  reducerPath: "dashboardRuntimeApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getDashboardDefinition: builder.query<any, DashboardPathArgs>({
      query: ({ moduleName, dashboardName }) => `/dashboard/${moduleName}/${dashboardName}/definition`,
      transformResponse: (response: any) => response?.data ?? response,
    }),
    getDashboardLayout: builder.query<any, DashboardPathArgs>({
      query: ({ moduleName, dashboardName }) => `/dashboard/${moduleName}/${dashboardName}/layout`,
      transformResponse: (response: any) => response?.data ?? response,
    }),
    saveDashboardLayout: builder.mutation<any, DashboardPathArgs & { layoutJson?: any; layout?: any }>({
      query: ({ moduleName, dashboardName, layoutJson, layout }) => ({
        url: `/dashboard/${moduleName}/${dashboardName}/layout`,
        method: "PUT",
        body: layoutJson !== undefined ? { layoutJson } : { layout },
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),
    getDashboardData: builder.mutation<any, DashboardPathArgs & { variables?: Record<string, any>; widgetNames?: string[] }>({
      query: ({ moduleName, dashboardName, ...body }) => ({
        url: `/dashboard/${moduleName}/${dashboardName}/data`,
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
    }),
    getDashboardVariableOptions: builder.query<any[], DashboardVariableOptionsArgs>({
      query: ({ moduleName, dashboardName, variableName, ...query }) => {
        const qs = toQueryString(query);
        return `/dashboard/${moduleName}/${dashboardName}/variable-options/${variableName}${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (response: any) => response?.data ?? response ?? [],
    }),
  }),
});

export const {
  useGetDashboardDefinitionQuery,
  useGetDashboardLayoutQuery,
  useSaveDashboardLayoutMutation,
  useGetDashboardDataMutation,
  useLazyGetDashboardVariableOptionsQuery,
} = dashboardRuntimeApi;
