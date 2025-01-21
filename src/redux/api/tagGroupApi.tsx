import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const tagGroupApi = createApi({
    reducerPath: 'tagGroupApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        gettagGroups: builder.query({
            query: (qs) => {
                return `/tagGroup?populate[]=tags&${qs}`
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
        gettagGroupById: builder.query({
            query: (id) => `/tagGroup/${id}?populate[]=tags`,
        }),
        createtagGroup: builder.mutation({
            query: (tagGroup) => ({
                url: '/tagGroup',
                method: 'POST',
                body: tagGroup
            })
        }),
        updatetagGroup: builder.mutation({
            query: ({ id, data }) => ({
                url: `/tagGroup/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleTagGroups: builder.mutation({
            query: (data) => ({
                url: `/tagGroup/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        deletetagGroup: builder.mutation({
            query: (id) => ({
                url: `/tagGroup/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGettagGroupsQuery, useLazyGettagGroupsQuery, useGettagGroupByIdQuery, useUpdatetagGroupMutation, useCreatetagGroupMutation, useDeletetagGroupMutation, useDeleteMultipleTagGroupsMutation } = tagGroupApi  