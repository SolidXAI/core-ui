import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const radixExtraModelAttributeApi = createApi({
    reducerPath: 'radixExtraModelAttribute',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getRadixModelMetadataExtraAttributes: builder.query({
            query: (radixModelMetadata) => {
                return `radix-model-metadata-v2?populate[]=radixExtraModelAttributeMetadatas&filters[name][$eqi]=${radixModelMetadata}`
            }
        }),
        createRadixExtraModelAttribute: builder.mutation({
            query: (radixExtramodelAttributeMetadata) => ({
                url: '/radix-extra-model-attribute-metadata-v2',
                method: 'POST',
                body: radixExtramodelAttributeMetadata
            })
        }),
        deleteMultipleRadixExtraModelAttributes: builder.mutation({
            query: (data) => ({
                url: `/radix-extra-model-attribute-metadata-v2/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        updateRadixExtraModelAttribute: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-extra-model-attribute-metadata-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
    })
})

export const { useCreateRadixExtraModelAttributeMutation, useUpdateRadixExtraModelAttributeMutation , useGetRadixModelMetadataExtraAttributesQuery, useLazyGetRadixModelMetadataExtraAttributesQuery} = radixExtraModelAttributeApi  