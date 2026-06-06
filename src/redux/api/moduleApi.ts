import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

const toQueryString = (args: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    Object.entries(args).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        searchParams.set(key, String(value));
    });
    return searchParams.toString();
};

export const modulesApi = createApi({
    reducerPath: 'moduleApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getmodules: builder.query({
            query: (qs) => {
                return `/module-metadata?${qs}`
            },
            transformResponse: (response: any) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                return {
                    records: response.data.records,
                    meta: response.data.meta
                }
            }
        }),
        getmoduleById: builder.query({
            query: (id) => `/module-metadata/${id}`,
        }),
        createmodule: builder.mutation({
            query: (module) => ({
                url: '/module-metadata',
                method: 'POST',
                body: module
            }),
        }),
        generateCodeFormodule: builder.mutation({
            query: (module) => ({
                url: `/module-metadata/${module.id}/generate-code`,
                method: 'POST',
                body: module
            }),
        }),
        seedModuleMetadata: builder.mutation({
            query: ({ id }) => ({
                url: `/module-metadata/${id}/seed`,
                method: 'POST',
            }),
        }),
        refreshPermissions: builder.mutation({
            query: (module) => ({
                url: `/module-metadata/refresh-permission`,
                method: 'POST',
                body: module
            }),
        }),
        updatemodule: builder.mutation({
            query: ({ id, data }) => ({
                url: `/module-metadata/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultiplemodules: builder.mutation({
            query: (data) => ({
                url: `/module-metadata/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        deletemodule: builder.mutation({
            query: (id) => ({
                url: `/module-metadata/${id}`,
                method: 'DELETE',
            }),
        }),
        getDefaultDataSource: builder.query({
            query: () => `/module-metadata/fetch-default-datasource`,
        }),
        getModuleMetadataExplorerManifest: builder.query({
            query: (moduleName) => `/module-metadata-explorer/${moduleName}/manifest`,
            transformResponse: (response: any) => response?.data ?? response,
        }),
        getModuleMetadataExplorerDocument: builder.query({
            query: (moduleName) => `/module-metadata-explorer/${moduleName}/document`,
            transformResponse: (response: any) => response?.data ?? response,
        }),
        updateModuleMetadataExplorerDocument: builder.mutation({
            query: ({ moduleName, value }) => ({
                url: `/module-metadata-explorer/${moduleName}/document`,
                method: 'PUT',
                body: { value },
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        validateModuleMetadataExplorerDocument: builder.mutation({
            query: ({ moduleName, value }) => ({
                url: `/module-metadata-explorer/${moduleName}/document/validate`,
                method: 'POST',
                body: { value },
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        getModuleMetadataExplorerSection: builder.query({
            query: ({ moduleName, sectionKey }) => `/module-metadata-explorer/${moduleName}/sections/${sectionKey}`,
            transformResponse: (response: any) => response?.data ?? response,
        }),
        updateModuleMetadataExplorerSection: builder.mutation({
            query: ({ moduleName, sectionKey, value }) => ({
                url: `/module-metadata-explorer/${moduleName}/sections/${sectionKey}`,
                method: 'PUT',
                body: { value },
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        validateModuleMetadataExplorerSection: builder.mutation({
            query: ({ moduleName, sectionKey, value }) => ({
                url: `/module-metadata-explorer/${moduleName}/sections/${sectionKey}/validate`,
                method: 'POST',
                body: { value },
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        searchModuleMetadataExplorer: builder.query({
            query: ({ moduleName, ...query }) => {
                const qs = toQueryString(query);
                return `/module-metadata-explorer/${moduleName}/search${qs ? `?${qs}` : ''}`;
            },
            transformResponse: (response: any) => response?.data ?? response,
        }),
        getModuleMetadataExplorerReferences: builder.query({
            query: ({ moduleName, ...query }) => {
                const qs = toQueryString(query);
                return `/module-metadata-explorer/${moduleName}/references${qs ? `?${qs}` : ''}`;
            },
            transformResponse: (response: any) => response?.data ?? response,
        }),
    })
})

export const {
    useGetmodulesQuery,
    useLazyGetmodulesQuery,
    useLazyGetmoduleByIdQuery,
    useGetmoduleByIdQuery,
    useCreatemoduleMutation,
    useGenerateCodeFormoduleMutation,
    useSeedModuleMetadataMutation,
    useRefreshPermissionsMutation,
    useUpdatemoduleMutation,
    useDeletemoduleMutation,
    useDeleteMultiplemodulesMutation,
    useGetDefaultDataSourceQuery,
    useLazyGetDefaultDataSourceQuery,
    useGetModuleMetadataExplorerManifestQuery,
    useLazyGetModuleMetadataExplorerManifestQuery,
    useGetModuleMetadataExplorerDocumentQuery,
    useLazyGetModuleMetadataExplorerDocumentQuery,
    useUpdateModuleMetadataExplorerDocumentMutation,
    useValidateModuleMetadataExplorerDocumentMutation,
    useGetModuleMetadataExplorerSectionQuery,
    useLazyGetModuleMetadataExplorerSectionQuery,
    useUpdateModuleMetadataExplorerSectionMutation,
    useValidateModuleMetadataExplorerSectionMutation,
    useLazySearchModuleMetadataExplorerQuery,
    useLazyGetModuleMetadataExplorerReferencesQuery,
} = modulesApi
