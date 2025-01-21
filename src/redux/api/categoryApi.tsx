import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const categorysApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getcategorys: builder.query({   
            query: (qs) => {
                return `/radix-category-v2?populateMedia[]=bannerImage&populateMedia[]=thumbnailImage&populateMedia[]=thumbnailBackgroundImage&populateMedia[]=thumbnailIcon&populate[]=parentCategory&${qs}`
            }
        }),
        getcategoryById: builder.query({
            query: (id) => `/radix-category-v2/${id}?populateMedia[]=bannerImage&populateMedia[]=thumbnailImage&populateMedia[]=thumbnailBackgroundImage&populateMedia[]=thumbnailIcon&populate[]=parentCategory`,
        }),
        createcategory: builder.mutation({
            query: (category) => ({
                url: '/radix-category-v2',
                method: 'POST',
                body: category
            })
        }),
        updatecategory: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-category-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleCategorys: builder.mutation({
            query: (data) => ({
                url: `/category/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        deletecategory: builder.mutation({
            query: (id) => ({
                url: `/category/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetcategorysQuery, useLazyGetcategorysQuery, useGetcategoryByIdQuery, useDeleteMultipleCategorysMutation, useUpdatecategoryMutation,useCreatecategoryMutation, useDeletecategoryMutation } = categorysApi  