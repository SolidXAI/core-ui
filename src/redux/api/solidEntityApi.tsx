import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';
import { kebabCase } from 'change-case';

export const createSolidEntityApi = (entityName: string) => {
    const kebabEntityName = kebabCase(entityName);

    return createApi({
        reducerPath: `genericSolid${entityName}Api`,
        baseQuery: baseQueryWithAuth,
        tagTypes: [entityName],
        endpoints: (builder) => ({
            getSolidEntities: builder.query({
                query: (qs) => {
                    return `/${kebabEntityName}?&${qs}`
                },
                transformResponse: (response: any) => {
                    if (response.error) {
                        throw new Error(response.error);
                    }
                    return {
                        records: response.data.records,
                        meta: response.data.meta,
                        groupMeta: response?.data?.groupMeta,
                        groupRecords: response?.data?.groupRecords ? response.data.groupRecords : [],
                    }
                },
                providesTags: (result) => [{ type: entityName }],
            }),
            getSolidKanbanEntities: builder.query({
                query: (qs) => {
                    return `/${kebabEntityName}/group-kanban?&${qs}`
                },
                transformResponse: (response: any) => {
                    if (response.error) {
                        throw new Error(response.error);
                    }
                    return {
                        records: response.data.records.groupedData,
                        meta: response.data.meta
                    }
                }
            }),
            getSolidEntityById: builder.query({
                query:({ id, qs }) => { 
                    return`/${kebabEntityName}/${id}?${qs}`
                },
                providesTags: () => [{ type: entityName }],
            }),
            createSolidEntity: builder.mutation({
                query: (entity) => ({
                    url: `/${kebabEntityName}`,
                    method: 'POST',
                    body: entity
                }),
            }),
            upsertSolidEntity: builder.mutation({
                query: (entity) => ({
                    url: `/${kebabEntityName}/upsert`,
                    method: 'POST',
                    body: entity
                }),
            }),
            updateSolidEntity: builder.mutation({
                query: ({ id, data }) => ({
                    url: `/${kebabEntityName}/${id}`,
                    method: 'PUT',
                    body: data,
                }),
                invalidatesTags: [{ type: entityName }]
            }),
            deleteMultipleSolidEntities: builder.mutation({
                query: (data) => ({
                    url: `/${kebabEntityName}/bulk/`,
                    method: 'DELETE',
                    body: data
                }),
                invalidatesTags: [{ type: entityName }]
            }),
            deleteSolidEntity: builder.mutation({
                query: (id) => ({
                    url: `/${kebabEntityName}/${id}`,
                    method: 'DELETE',
                }),
                invalidatesTags: [{ type: entityName }]
            }),
            recoverSolidEntityById: builder.query({
                query: (id) => `/${kebabEntityName}/recover/${id}`,
            }),
            recoverSolidEntity: builder.mutation({
                query: (data) => ({
                    url: `/${kebabEntityName}/bulk-recover/`,
                    method: 'POST',
                    body: data
                })
            }),
            patchUpdateSolidEntity: builder.mutation({
                query: ({ id, data }) => ({
                    url: `/${kebabEntityName}/${id}`,
                    method: 'PATCH',
                    body: data,
                }),
            }),
        }),
    });
};

// export const {
//     useCreateSolidEntityMutation,
//     useDeleteMultipleSolidEntitiesMutation,
//     useDeleteSolidEntityMutation,
//     useGetSolidEntitiesQuery,
//     useGetSolidEntityByIdQuery,
//     useLazyGetSolidEntitiesQuery,
//     useLazyGetSolidEntityByIdQuery,
//     usePrefetch,
//     useUpdateSolidEntityMutation
// } = solidEntityApi;
