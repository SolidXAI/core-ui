import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';


export const solidServiceApi = createApi({
    reducerPath: 'actionMetadataApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        seeder: builder.mutation({
            query: (name) => ({
                url: '/test/seed',
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
} = solidServiceApi  