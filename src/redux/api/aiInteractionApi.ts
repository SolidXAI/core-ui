import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

interface TriggerMcpClientJobRequest {
    prompt: string;
}

interface TriggerMcpClientJobResponse {
    statusCode: number;
    message: string[];
    error: string;
    data: string; // UUID
}

interface ApplySolidAiInteractionRequest {
    id: number;
}

interface ApplySolidAiInteractionResponse {
    statusCode: number;
    message: string[];
    error: string;
    data: string; // UUID
}

export const aiInteractionApi = createApi({
    reducerPath: "aiInteractionApi",
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        triggerMcpClientJob: builder.mutation<TriggerMcpClientJobResponse, TriggerMcpClientJobRequest>({
            query: (body) => ({
                url: "/ai-interaction/trigger-mcp-client-job",
                method: "POST",
                body,
            }),
        }),
        applySolidAiInteraction: builder.mutation<ApplySolidAiInteractionResponse, ApplySolidAiInteractionRequest>({
            query: (body) => ({
                url: `/ai-interaction/${body.id}/apply-solid-ai-interaction`,
                method: "POST",
                // body,
            }),
        }),
    }),
});

export const {
    useTriggerMcpClientJobMutation,
    useApplySolidAiInteractionMutation,
} = aiInteractionApi;