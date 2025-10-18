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
        // Add a mutation for calling /code-generation/post-process, which takes an empty body
        codeGenerationPostProcess: builder.mutation<any, void>({
            query: () => ({
                url: '/code-generation/post-process',
                method: 'POST',
                body: {}
            }),
        }),
    }),
});

export const {
    useSeederMutation,
    useCodeGenerationPostProcessMutation
} = solidServiceApi;
