import { fetchBaseQuery } from "@reduxjs/toolkit/dist/query";
import { getSession } from "../../hooks/solid/auth";

const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api`; // Base URL for the API endpoints
// Updated fetchBaseQuery to include accessToken in headers
export const baseQueryWithAuth = fetchBaseQuery({
    baseUrl,
    prepareHeaders: async (headers) => {
        const session = await getSession(); // Fetch session data
        if (session?.user?.accessToken) {
            headers.set('authorization', `Bearer ${session?.user?.accessToken}`); // Add access token to headers
        }
        return headers;
    },
});

// @ts-nocheck
// import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import type { FetchBaseQueryError, BaseQueryFn } from "@reduxjs/toolkit/query";
// import type { FetchArgs } from "@reduxjs/toolkit/query";
// import { getSession } from "../../hooks/solid/auth";

// const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api`;

// const rawBaseQuery = fetchBaseQuery({
//     baseUrl,
//     prepareHeaders: async (headers) => {
//         const session = await getSession();
//         if (session?.user.accessToken) {
//             headers.set('authorization', `Bearer ${session?.user?.accessToken}`);
//         }
//         return headers;
//     },
// });

// // Wrapper with error handling
// export const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, {}> = async (args, api, extraOptions) => {
//     const result = await rawBaseQuery(args, api, extraOptions);

//     if (result.error) {
//         const status = result.error.status;
//         const isFetchError = typeof status === 'string' && status === 'FETCH_ERROR';

//         if (typeof window !== 'undefined') {
//             switch (true) {
//                 case isFetchError:
//                     window.location.href = '/offline';
//                     break;
//                 case typeof status === 'number' && status >= 500:
//                     window.location.href = '/server-error';
//                     break;
//                 case typeof status === 'number' && status >= 400:
//                     window.location.href = '/client-error';
//                     break;
//             }
//         }
//     }

//     return result;
// };

// // Wrapper fetch to include authentication and error handling
// export async function baseFetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
//     const session = await getSession();

//     const headers = new Headers(init.headers || {});
//     if (session?.user?.accessToken) {
//         headers.set("Authorization", `Bearer ${session.user.accessToken}`);
//     }

//     try {
//         const response = await fetch(input, { ...init, headers });

//         if (!response.ok) {
//             const status = response.status;
//             if (typeof window !== 'undefined') {
//                 if (status >= 500) {
//                     window.location.href = "/server-error";
//                 } else if (status >= 400) {
//                     window.location.href = "/client-error";
//                 }
//             }
//             throw new Error(`HTTP error! status: ${status}`);
//         }

//         return response;
//     } catch (error: any) {
//         console.error('Fetch failed:', error);

//         // You could redirect or render a fallback error here
//         if (typeof window !== 'undefined') {
//             window.location.href = "/offline"; // Create this route
//         }

//         // Re-throw for potential higher-level handling
//         // throw new Error(`Network error: ${error.message}`);
//     }
// }