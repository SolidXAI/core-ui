import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

// Types
interface DashboardLayout {
  id: string;
  name: string;
  [key: string]: any;
}

export interface DashboardLayoutResponse {
  records: DashboardLayout[];
  meta: {
    totalCount: number;
    [key: string]: any;
  };
}

export interface SelectionDynamicOption {
  value: string;
  label: string;
}

// API Definition
export const dashboardLayoutApi = createApi({
  reducerPath: "dashboardLayoutApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getDashboardLayout: builder.query<DashboardLayoutResponse, string>({
      query: (qs) => `/dashboard?${qs}`,
      transformResponse: (response: any) => {
        if (response.error) {
          throw new Error(response.error);
        }
        return {
          records: response.data.records,
          meta: response.data.meta,
        };
      },
    }),
    getUserDashboardLayoutByDashboardId: builder.query({
      query: (dashboardId: string) => `/dashboard-layout/user-dashboard-layout/${dashboardId}`,
    }),
    upsertUserDashboardLayout: builder.mutation({
      query: (data) => ({
        url: '/dashboard-layout/upsert-user-dashboard-layout',
        method: 'POST',
        body: data
      }),
    }),
  }),
});

// Hooks
export const { useGetDashboardLayoutQuery, useLazyGetDashboardLayoutQuery, useUpsertUserDashboardLayoutMutation, useLazyGetUserDashboardLayoutByDashboardIdQuery } = dashboardLayoutApi;