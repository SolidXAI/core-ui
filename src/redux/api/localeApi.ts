import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const localeApi = createApi({
    reducerPath: 'localeApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getLocales: builder.query({
            query: () => {
                return `/locale`
            },
            transformResponse: (response: any) => {
                if (response.error) {
                    throw new Error(response.error);
                }
                return {
                    records: response.data.records,
                    meta: response.data.meta
                }
            },
        }),
    })
})

export const { useGetLocalesQuery } = localeApi;