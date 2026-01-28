import { fetchBaseQuery } from "@reduxjs/toolkit/dist/query";
import { getSession } from "../../adapters/auth/index";
import { env } from "../../adapters/env";
import { logger } from "../../helpers/logger";

const baseUrl = `${env("NEXT_PUBLIC_BACKEND_API_URL")}/api`; // Base URL for the API endpoints
logger.debug(`fetchBaseQuery resolved baseUrl to ${baseUrl}`);

// Updated fetchBaseQuery to include accessToken in headers
export const baseQueryWithAuth = fetchBaseQuery({
    baseUrl,
    prepareHeaders: async (headers) => {
        const session = await getSession(); // Fetch session data
        if (session?.user?.accessToken) {
            headers.set('authorization', `Bearer ${session?.user?.accessToken}`); // Add access token to headers
        }

        if (session?.user?.accessToken) {
            headers.set("authorization", `Bearer ${session.user.accessToken}`);
            logger.debug("[prepareHeaders] set auth header");
        } else {
            logger.debug("[prepareHeaders] no access token");
        }

        logger.debug("[prepareHeaders] end");
        return headers;
    },
});
