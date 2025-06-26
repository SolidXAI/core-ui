import { fetchBaseQuery } from "@reduxjs/toolkit/dist/query";
import { getSession } from "next-auth/react";

const baseUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api`; // Base URL for the API endpoints
// Updated fetchBaseQuery to include accessToken in headers
export const baseQueryWithAuth = fetchBaseQuery({
    baseUrl,
    prepareHeaders: async (headers) => {
        const session = await getSession(); // Fetch session data
        if (session?.user.accessToken) {
            headers.set('authorization', `Bearer ${session?.user?.accessToken}`); // Add access token to headers
        }
        return headers;
    },
});
