import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const reviewApi = createApi({
    reducerPath: 'reviewApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getreview: builder.query({
            query: (qs) => {
                return `/radix-review-v2?${qs}`
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
        getreviewById: builder.query({
            query: (id) => `/radix-review-v2/${id}?populate[]=user`,
        }),
        createreview: builder.mutation({
            query: (review) => ({
                url: '/radix-review-v2',
                method: 'POST',
                body: review
            }),
        }),
        updatereview: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-review-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultiplereviews: builder.mutation({
            query: (data) => ({
                url: `/radix-review-v2/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        deletereview: builder.mutation({
            query: (id) => ({
                url: `/radix-review-v2/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetreviewQuery, useLazyGetreviewQuery, useDeleteMultiplereviewsMutation, useCreatereviewMutation, useGetreviewByIdQuery, useUpdatereviewMutation, useDeletereviewMutation } = reviewApi  