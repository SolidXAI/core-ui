import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const cmsBannerImagesApi = createApi({
    reducerPath: 'cmsBannerImageApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getcmsBannerImages: builder.query({
            query: (qs) => {
                    return `/cmsBannerImage?populateMedia[]=backgroundAssetUrl&populateMedia[]=foregroundAssetUrl&${qs}`
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
        getCmsBannerImageById: builder.query({
            query: (id) => `/radix-cms-banner-image-v2/${id}?populateMedia[]=backgroundAssetUrl&populateMedia[]=foregroundAssetUrl`,
        }),
        createCmsBannerImage: builder.mutation({
            query: (cmsBannerImage) => ({
                url: '/radix-cms-banner-image-v2',
                method: 'POST',
                body: cmsBannerImage
            })
        }),
        updateCmsBannerImage: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-cms-banner-image-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleCmsBannerImages: builder.mutation({
            query: (data) => ({
                url: `/cmsBannerImage/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        deleteCmsBannerImage: builder.mutation({
            query: (id) => ({
                url: `/cmsBannerImage/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetcmsBannerImagesQuery, useLazyGetcmsBannerImagesQuery, useDeleteMultipleCmsBannerImagesMutation, useGetCmsBannerImageByIdQuery, useUpdateCmsBannerImageMutation,useCreateCmsBannerImageMutation, useDeleteCmsBannerImageMutation } = cmsBannerImagesApi  