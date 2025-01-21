import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    register: builder.mutation({
      query(body) {
        return {
          url: "/iam/register",
          method: "POST",
          body,
        };
      },
    }),
    registerPrivate: builder.mutation({
      query(body) {
        return {
          url: "/iam/register-private",
          method: "POST",
          body,
        };
      },
    }),
    updateUser: builder.mutation({
      query: ({ id, data }) => ({
        url: `/user/${id}`,
        method: 'PATCH',
        body: data,
      }),
    }),
    forgotPassword: builder.mutation({
      query(body) {
        return {
          url: "/password/forgot",
          method: "POST",
          body,
        };
      },
    }),
    resetPassword: builder.mutation({
      query({ token, body }) {
        return {
          url: `/password/reset/${token}`,
          method: "PUT",
          body,
        };
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useRegisterPrivateMutation,
  useUpdateUserMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
