import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const menusApi = createApi({
    reducerPath: 'menuApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getmenus: builder.query({
            query: (qs) => {
                return `/radix-menu-v2?${qs}`
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
        getmenuById: builder.query({
            query: (id) => `/menu/${id}`,
        }),
        createmenu: builder.mutation({
            query: (menu) => ({
                url: '/menu',
                method: 'POST',
                body: menu
            }),
        }),
        updatemenu: builder.mutation({
            query: ({ id, data }) => ({
                url: `/menu/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleMenus: builder.mutation({
            query: (data) => ({
                url: `/menu/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        deletemenu: builder.mutation({
            query: (id) => ({
                url: `/menu/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetmenusQuery, useLazyGetmenusQuery, useLazyGetmenuByIdQuery, useGetmenuByIdQuery, useUpdatemenuMutation, useCreatemenuMutation, useDeletemenuMutation, useDeleteMultipleMenusMutation } = menusApi  