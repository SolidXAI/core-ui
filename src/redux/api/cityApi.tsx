import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const citiesApi = createApi({
    reducerPath: 'citiesApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getCities: builder.query({
            query: (qs) => {
                return `/city?populate[]=state&${qs}`
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
        getCityById: builder.query({
            query: (id) => `/city/${id}?populate[]=state`,
        }),
        createCity: builder.mutation({
            query: (city) => ({
                url: '/city',
                method: 'POST',
                body: city
            }),
        }),
        // updateCity: builder.mutation({
        //     query: ({ id, data }) => ({
        //         url: `/city/${id}`,
        //         method: 'Patch',
        //         body: data,
        //     }),
        // }),

        deleteMultipleCities: builder.mutation({
            query: (data) => ({
                url: `/city/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        deleteCity: builder.mutation({
            query: (id) => ({
                url: `/city/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useLazyGetCitiesQuery, useCreateCityMutation, useDeleteCityMutation, useDeleteMultipleCitiesMutation, useGetCitiesQuery, useGetCityByIdQuery, useLazyGetCityByIdQuery, usePrefetch } = citiesApi  