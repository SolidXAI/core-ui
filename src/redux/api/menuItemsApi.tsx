import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const menuItemsApi = createApi({
    reducerPath: 'menuItemApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getmenuItems: builder.query({
            query: (qs) => {
                return `/radix-menu-item-v2?populate[]=menu&populate[]=parentMenuItems&populate[]=category&${qs}`
            },
            // query: () => '/menuItem?populate[]=menu&populate[]=parentMenuItem',
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
        getmenuItemById: builder.query({
            query: (id) => `/radix-menu-item-v2/${id}?populate[]=menu&populate[]=parentMenuItems&populate[]=category&populateMedia[]=menuIcon`,
        }),
        createmenuItem: builder.mutation({
            query: (menuItem) => ({
                url: '/radix-menu-item-v2',
                method: 'POST',
                body: menuItem
            })
        }),
        updatemenuItem: builder.mutation({
            query: ({ id, data }) => ({
                url: `/radix-menu-item-v2/${id}`,
                method: 'PUT',
                body: data,
            }),
        }),
        deleteMultipleMenuItems: builder.mutation({
            query: (data) => ({
                url: `/menuItem/bulk/`,
                method: 'DELETE',
                body:data
            }),
        }),
        deletemenuItem: builder.mutation({
            query: (id) => ({
                url: `/menuItem/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useGetmenuItemsQuery, useLazyGetmenuItemsQuery,useLazyGetmenuItemByIdQuery, useDeleteMultipleMenuItemsMutation, useGetmenuItemByIdQuery, useUpdatemenuItemMutation, useCreatemenuItemMutation, useDeletemenuItemMutation } = menuItemsApi  