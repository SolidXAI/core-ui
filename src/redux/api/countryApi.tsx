import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const countriesApi = createApi({
    reducerPath: 'countriesApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getCountries: builder.query({
            query: (qs) => {
                return `/custom-countries?&${qs}`
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
        getCountryById: builder.query({
            query: (id) => `/custom-countries/${id}`,
        }),
        createCountry: builder.mutation({
            query: (country) => ({
                url: '/custom-countries',
                method: 'POST',
                body: country
            }),
        }),
        updateCountry: builder.mutation({
            query: ({ id, data }) => ({
                url: `/custom-countries/${id}`,
                method: 'Patch',
                body: data,
            }),
        }),

        deleteMultipleCountries: builder.mutation({
            query: (data) => ({
                url: `/custom-countries/bulk/`,
                method: 'DELETE',
                body: data
            }),
        }),
        deleteCountry: builder.mutation({
            query: (id) => ({
                url: `/custom-countries/${id}`,
                method: 'DELETE',
            }),
        }),
    })
})

export const { useLazyGetCountriesQuery, useCreateCountryMutation, useDeleteCountryMutation, useDeleteMultipleCountriesMutation, useGetCountriesQuery, useGetCountryByIdQuery, useLazyGetCountryByIdQuery, usePrefetch, useUpdateCountryMutation } = countriesApi  