// import { fetchBaseQuery } from "@reduxjs/toolkit/dist/query";
// import { getSession } from "next-auth/react";

// const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api`; // Base URL for the API endpoints
// // Updated fetchBaseQuery to include accessToken in headers
// export const baseQueryWithAuth = fetchBaseQuery({
//     baseUrl,
//     prepareHeaders: async (headers) => {
//         const session = await getSession(); // Fetch session data
//         if (session?.user.accessToken) {
//             headers.set('authorization', `Bearer ${session?.user?.accessToken}`); // Add access token to headers
//         }
//         return headers;
//     },
// });

import {
    fetchBaseQuery,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
    FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import { getSession } from 'next-auth/react';

const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api`;

export const baseQueryWithAuth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const session = await getSession();

    const rawBaseQuery = fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers) => {
            if (session?.user?.accessToken) {
                headers.set('authorization', `Bearer ${session.user.accessToken}`);
            }
            return headers;
        },
    });

    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error && typeof window !== 'undefined') {
        const error = result.error;
        if ('status' in error) {
            if (error.status === 403) {
                window.location.href = '/server-error/403';
            } else if (error.status === 503) {
                window.location.href = '/server-error/503';
            }
        }
    }

    return result;
};