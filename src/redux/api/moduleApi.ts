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

const getDownloadFileName = (contentDisposition?: string | null) => {
    if (!contentDisposition) return 'module-package.sldx';
    const match = contentDisposition.match(/filename="?([^"]+)"?/i);
    return match?.[1] || 'module-package.sldx';
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
        validateModulePackageImport: builder.mutation({
            query: (formData) => ({
                url: '/module-packages/import/validate',
                method: 'POST',
                body: formData,
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        confirmModulePackageImport: builder.mutation({
            query: ({ transactionKey, ...body }) => ({
                url: `/module-packages/import/${transactionKey}/confirm`,
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        getModulePackageImportStatus: builder.query({
            query: ({ transactionKey }) => `/module-packages/import/${transactionKey}/status`,
            transformResponse: (response: any) => response?.data ?? response,
        }),
        getLatestResumableModulePackageImport: builder.query({
            query: () => `/module-packages/import/resumable/latest`,
            transformResponse: (response: any) => response?.data ?? response,
        }),
        clearModulePackageRuntime: builder.mutation({
            query: () => ({
                url: '/module-packages/runtime/clear',
                method: 'POST',
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        runModulePackageBuild: builder.mutation({
            query: ({ transactionKey, ...body }) => ({
                url: `/module-packages/import/${transactionKey}/build`,
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        runModulePackageSeed: builder.mutation({
            query: ({ transactionKey, ...body }) => ({
                url: `/module-packages/import/${transactionKey}/seed`,
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        dismissModulePackageImport: builder.mutation({
            query: ({ transactionKey }) => ({
                url: `/module-packages/import/${transactionKey}/dismiss`,
                method: 'POST',
            }),
            transformResponse: (response: any) => response?.data ?? response,
        }),
        exportModulePackage: builder.mutation({
            query: ({ moduleName }) => ({
                url: `/module-packages/export/${moduleName}`,
                method: 'GET',
                responseHandler: async (response) => response.blob(),
                cache: 'no-store',
            }),
            transformResponse: (response: Blob, meta: any) => ({
                blob: response,
                fileName: getDownloadFileName(meta?.response?.headers?.get('Content-Disposition')),
            }),
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
    useValidateModulePackageImportMutation,
    useConfirmModulePackageImportMutation,
    useLazyGetModulePackageImportStatusQuery,
    useLazyGetLatestResumableModulePackageImportQuery,
    useClearModulePackageRuntimeMutation,
    useRunModulePackageBuildMutation,
    useRunModulePackageSeedMutation,
    useDismissModulePackageImportMutation,
    useExportModulePackageMutation,
} = modulesApi
