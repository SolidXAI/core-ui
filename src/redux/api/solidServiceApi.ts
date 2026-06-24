import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const solidServiceApi = createApi({
    reducerPath: 'solidServiceApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        seeder: builder.mutation<any, { seeder: string, modulesToSeed?: string[] } | string>({
            query: (payload) => ({
                url: '/seed',
                method: 'POST',
                body: typeof payload === 'string' ? { seeder: payload } : payload,
            }),
        }),
        // Add a mutation for calling /code-generation/post-process, which takes an empty body
        codeGenerationPostProcess: builder.mutation<any, { "runModuleMetadataSeeder": boolean, "runSolidIngestion": boolean, "modulesToSeed"?: string[] }>({
            query: (payload) => ({
                url: '/code-generation/post-process',
                method: 'POST',
                body: payload
            }),
        }),
    }),
});

export const {
    useSeederMutation,
    useCodeGenerationPostProcessMutation
} = solidServiceApi;
