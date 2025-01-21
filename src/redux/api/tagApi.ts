import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const tagApi = createApi({
    reducerPath: 'tagApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        gettags: builder.query({
            query: (qs) => {
                return `/radix-tag-v2`
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
        gettagById: builder.query({
            query: (id) => `/radix-tag-v2/${id}`,
        }),
        createtag: builder.mutation({
            query: (tag) => ({
                url: '/radix-tag-v2',
                method: 'POST',
                body: tag
            })
        }),
        updatetag: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-tag-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleTags: builder.mutation({
            query: (data) => ({
                url: `/radix-tag-v2/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        deletetag: builder.mutation({
            query: (id) => ({
                url: `/radix-tag-v2/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGettagsQuery, useLazyGettagsQuery, useDeleteMultipleTagsMutation, useGettagByIdQuery, useUpdatetagMutation, useCreatetagMutation, useDeletetagMutation } = tagApi  