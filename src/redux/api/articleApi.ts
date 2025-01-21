import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const articleApi = createApi({
    reducerPath: 'articleApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getarticle: builder.query({
            query: (qs) => {
                return `/radix-article-v2?${qs}`
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
        getarticleById: builder.query({
            query: (id) => `/radix-article-v2/${id}?populateMedia[]=icon`,
        }),
        createarticle: builder.mutation({
            query: (article) => ({
                url: '/radix-article-v2',
                method: 'POST',
                body: article
            }),
        }),
        updatearticle: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-article-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleArticles: builder.mutation({
            query: (data) => ({
                url: `/article/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        deletearticle: builder.mutation({
            query: (id) => ({
                url: `/article/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetarticleQuery, useLazyGetarticleQuery, useDeleteMultipleArticlesMutation, useCreatearticleMutation, useGetarticleByIdQuery, useUpdatearticleMutation, useDeletearticleMutation } = articleApi  