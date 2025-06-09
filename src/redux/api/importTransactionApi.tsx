import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const importTransactionApi = createApi({
    reducerPath: 'importTransactionApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        // Get instructions
        getImportInstructions: builder.query({
            query: ({ id }) => {
                return `/import-transaction/import-instructions/${id}`
            },
        }),
        // Get import templates
        getImportTemplate: builder.query({
            query: ({ id, format }) => {
                return `/import-transaction/import-template/${id}/${format}`
            },
            transformResponse: (response: any) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                return {
                    records: response.data.records,
                    meta: response.data.meta
                }
            },
        }),
        // create transaction / upload file here
        createImportTransaction: builder.mutation({
            query: (templateData) => ({
                url: '/import-transaction',
                method: 'POST',
                body: templateData
            }),
        }),
        // After getting response getting id patch that here and pass     "status": "mapping_created",
        patchUpdateImportTransaction: builder.mutation({
            query: ({ id, data }) => ({
                url: `/import-transaction/${id}`,
                method: 'PATCH',
                body: data,
            }),
        }),
        // Get Mattping info
        // Get import templates
        getImportMappingInfo: builder.query({
            query: ({ id }) => {
                return `/import-transaction/${id}/import-mapping-info`
            },
            transformResponse: (response: any) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                return {
                    records: response.data.records,
                    meta: response.data.meta
                }
            },
        }),
        createImportSync: builder.mutation({
            query: ({ id }) => ({
                url: `/import-transaction/${id}/start-import/sync`,
            }),
            transformResponse: (response: any) => {
                return {
                    file: response
                }
            }
        }),
        createImportAsync: builder.mutation({
            query: ({ id, templateData }) => ({
                url: `/import-transaction/${id}/start-import/async`,
                method: 'POST',
                body: templateData
            }),
        })
    })
})

export const {
    useGetImportInstructionsQuery,
    useLazyGetImportInstructionsQuery,
    useGetImportTemplateQuery,
    useLazyGetImportTemplateQuery,
    useCreateImportTransactionMutation,
    usePatchUpdateImportTransactionMutation,
    useGetImportMappingInfoQuery,
    useLazyGetImportMappingInfoQuery,
    useCreateImportAsyncMutation,
    useCreateImportSyncMutation
} = importTransactionApi