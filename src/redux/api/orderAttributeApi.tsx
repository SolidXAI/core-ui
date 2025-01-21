import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const orderAttributeApi = createApi({
    reducerPath: 'orderAttribute',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getRadixModelMetadataOrderAttributes: builder.query({
            query: (radixModelMetadata) => {
                return `radix-model-metadata-v2?populate[]=orderAttributeMetadatas&filters[name][$eqi]=${radixModelMetadata}`
            }
        }),
        createOrderAttribute: builder.mutation({
            query: (orderAttribute) => ({
                url: '/radix-order-attribute-metadata-v2',
                method: 'POST',
                body: orderAttribute
            })
        }),
        deleteMultipleOrderAttributes: builder.mutation({
            query: (data) => ({
                url: `/radix-order-attribute-metadata-v2/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        updateOrderAttribute: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-order-attribute-metadata-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
    })
})

export const { useUpdateOrderAttributeMutation, useLazyGetRadixModelMetadataOrderAttributesQuery } = orderAttributeApi  