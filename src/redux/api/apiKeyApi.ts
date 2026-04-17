import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

export interface ApiKeyRecord {
  id: string;
  name: string;
  maskedKey: string;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyBody {
  name: string;
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  data: {
    apiKey: string;
    record: ApiKeyRecord;
  };
}

export const apiKeyApi = createApi({
  reducerPath: "apiKeyApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["ApiKey"],
  endpoints: (builder) => ({
    // Fetch user record with apiKeys populated.
    // Always called with a userId — the backend enforces access rules.
    getUserApiKeys: builder.query<{ data: { apiKeys: ApiKeyRecord[] } }, string>({
      query: (userId) => `/user/${userId}?populate[0]=apiKeys`,
      providesTags: ["ApiKey"],
    }),
    createApiKey: builder.mutation<CreateApiKeyResponse, CreateApiKeyBody>({
      query: (body) => ({
        url: "/iam/api-keys",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ApiKey"],
    }),
    updateApiKey: builder.mutation<void, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/iam/api-keys/${id}`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["ApiKey"],
    }),
    generateApiKeyForUser: builder.mutation<CreateApiKeyResponse, { userId: number; body: CreateApiKeyBody }>({
      query: ({ userId, body }) => ({
        url: `/api-keys/users/${userId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ApiKey"],
    }),
  }),
});

export const {
  useGetUserApiKeysQuery,
  useCreateApiKeyMutation,
  useUpdateApiKeyMutation,
  useGenerateApiKeyForUserMutation,
} = apiKeyApi;
