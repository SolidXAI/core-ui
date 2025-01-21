import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const ratingApi = createApi({
    reducerPath: 'ratingApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getrating: builder.query({
            query: (qs) => {
                return `/radix-rating-v2?${qs}`
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
        getratingById: builder.query({
            query: (id) => `/radix-rating-v2/${id}?populate[]=user`,
        }),
        createrating: builder.mutation({
            query: (rating) => ({
                url: '/radix-rating-v2',
                method: 'POST',
                body: rating
            }),
        }),
        updaterating: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-rating-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleRatings: builder.mutation({
            query: (data) => ({
                url: `/radix-rating-v2/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        deleterating: builder.mutation({
            query: (id) => ({
                url: `/radix-rating-v2/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetratingQuery, useLazyGetratingQuery, useDeleteMultipleRatingsMutation, useCreateratingMutation, useGetratingByIdQuery, useUpdateratingMutation, useDeleteratingMutation } = ratingApi  