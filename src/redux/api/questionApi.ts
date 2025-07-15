import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

// API Definition
export const questionApi = createApi({
  reducerPath: "questionApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getQuestionDataById: builder.query({
      query: ({ id, qs }) => `/question/${id}/data?${qs}`,
    }),

  }),
});

// Hooks
export const { useGetQuestionDataByIdQuery, useLazyGetQuestionDataByIdQuery } = questionApi;