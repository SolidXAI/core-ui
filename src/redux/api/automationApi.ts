import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const automationApi = createApi({
    reducerPath: 'automationApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getautomations: builder.query({
            query: (qs) => {
                return `/automation?populate[]=category&populateMedia[]=bannerImage&populateMedia[]=automationThumbnailIcon&populateMedia[]=galleryImages&populateMedia[]=downloads&${qs}`
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
        getautomationById: builder.query({
            query: (id) => `/automation/${id}?populate[]=category&populateMedia[]=bannerImage&populateMedia[]=automationThumbnailIcon&populateMedia[]=galleryImages&populateMedia[]=downloads`,
        }),
        createautomation: builder.mutation({
            query: (automation) => ({
                url: '/automation',
                method: 'POST',
                body: automation
            })
        }),
        updateautomation: builder.mutation({
            query: ({ id, data }) => ({
                url: `/automation/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleAutomations: builder.mutation({
            query: (data) => ({
                url: `/automation/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        deleteautomation: builder.mutation({
            query: (id) => ({
                url: `/automation/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetautomationsQuery, useLazyGetautomationsQuery, useDeleteMultipleAutomationsMutation, useGetautomationByIdQuery, useUpdateautomationMutation, useCreateautomationMutation, useDeleteautomationMutation } = automationApi  