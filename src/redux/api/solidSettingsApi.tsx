import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const solidSettingsApi = createApi({
    reducerPath: 'solidSettingsApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        createSolidSettings: builder.mutation({
            query: (data) => ({
                url: '/setting',
                method: 'POST',
                body: data
            }),
        }),
        getSolidSettings: builder.query({
            query: () => {
                return `/setting`
            },
        }),
        getAuthSettings: builder.query({
            query: () => {
                return `/setting/wrapped`
            },
        }),
        getSolidSettingsById: builder.query({
            query: (id) => `/setting/${id}`,
        }),
        updateSolidSettings: builder.mutation({
            query: ({ id, data }) => ({
                url: `/setting/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        bulkUpdateSolidSettings: builder.mutation({
            query: ({ data }) => ({
                url: `/setting/bulk-update`,
                method: 'POST',
                body: data,
            }),
        }),
    })
});

export const {
    useCreateSolidSettingsMutation,
    useGetSolidSettingsByIdQuery,
    useGetSolidSettingsQuery,
    useGetAuthSettingsQuery,
    useLazyGetAuthSettingsQuery,
    useLazyGetSolidSettingsQuery,
    useLazyGetSolidSettingsByIdQuery,
    useUpdateSolidSettingsMutation,
    useBulkUpdateSolidSettingsMutation
} = solidSettingsApi;