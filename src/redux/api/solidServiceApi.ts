import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const solidServiceApi = createApi({
    reducerPath: 'solidServiceApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        seeder: builder.mutation({
            query: (name) => ({
                url: '/seed',
                method: 'POST',
                body: {
                    "seeder": name
                }
            }),
        }),
        // Add Ping Pong here
    }),
});

export const {
    useSeederMutation
} = solidServiceApi;
