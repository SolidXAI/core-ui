import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const radixModelsMetadataApi = createApi({
    reducerPath: 'radixModelMetadataApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getRadixModelsMetadata: builder.query({
            query: (qs) => {
                return `/radix-model-metadata-v2?populate[0]=categorys&populate[1]=radixExtraModelAttributeMetadatas&${qs}`
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
        getRadixModelMetadataById: builder.query({
            query: (id) => `/radix-model-metadata-v2/${id}?populate[0]=categorys&populate[1]=radixExtraModelAttributeMetadatas&populate[2]=orderAttributeMetadatas`,
        }),
        createRadixModelMetadata: builder.mutation({
            query: (radixModelMetadata) => ({
                url: '/radix-model-metadata-v2',
                method: 'POST',
                body: radixModelMetadata
            })
        }),
        updateRadixModelMetadata: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-model-metadata-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleRadixModelsMetadata: builder.mutation({
            query: (data) => ({
                url: `/radix-model-metadata-v2/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        deleteRadixModelMetadata: builder.mutation({
            query: (id) => ({
                url: `/radix-model-metadata-v2/${id}`,
                method: 'DELETE',
            }),
        }),
        uploadRadixModelMetadata: builder.mutation({
            query: (radixModelMetadata) => ({
                url: '/radix-model-metadata-v2/uploadOrderCode',
                method: 'POST',
                body: radixModelMetadata
            })
        }),
    })
})

export const { useGetRadixModelsMetadataQuery, useGetRadixModelMetadataByIdQuery, useDeleteMultipleRadixModelsMetadataMutation, useLazyGetRadixModelsMetadataQuery, useUpdateRadixModelMetadataMutation,useCreateRadixModelMetadataMutation, useDeleteRadixModelMetadataMutation, useUploadRadixModelMetadataMutation } = radixModelsMetadataApi  