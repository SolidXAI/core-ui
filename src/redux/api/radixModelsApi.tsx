import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const radixModelsApi = createApi({
    reducerPath: 'radixModelsApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getRadixModels: builder.query({
            query: (qs) => {
                return `/radix-model?${qs}`
            },
        }),
        getRadixModelsById: builder.query({
            query: (id) => `/radix-model/${id}`,
        }),
        getRadixModelsFiltersByExtraAttributes: builder.query({
            query: (productType:string) => {
                return `/radix-model/distinct-counts/${productType}`
            }
        }),
        createRadixModels: builder.mutation({
            query: (radixModel) => ({
                url: '/radix-model',
                method: 'POST',
                body: radixModel
            })
        }),
        updateRadixModels: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-model/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteRadixModelsAsset: builder.mutation({
            query: (data) => ({
                url: `/radix-model/delete-assets`,
                method: 'POST',
                body:data
            }),
        }),
        deleteRadixModelsAssetDownload: builder.mutation({
            query: (data) => ({
                url: `/radix-model/delete-assets-download`,
                method: 'POST',
                body:data
            }),
        }),
        deleteMultipleRadixModels: builder.mutation({
            query: (data) => ({
                url: `/radix-model/delete-many`,
                method: 'POST',
                body:data
            }),
        }),
        deleteRadixModels: builder.mutation({
            query: (id) => ({
                url: `/radix-model/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})
export const { useGetRadixModelsQuery, useLazyGetRadixModelsQuery, useDeleteRadixModelsAssetMutation, useDeleteRadixModelsAssetDownloadMutation, useDeleteRadixModelsMutation, useLazyGetRadixModelsByIdQuery, useGetRadixModelsByIdQuery, useDeleteMultipleRadixModelsMutation, useUpdateRadixModelsMutation, useGetRadixModelsFiltersByExtraAttributesQuery, useLazyGetRadixModelsFiltersByExtraAttributesQuery, useCreateRadixModelsMutation} = radixModelsApi  