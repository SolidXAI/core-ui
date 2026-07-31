import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";
import type { WorkflowNodeMetadataResponse } from "../../types/workflow-node";

export const workflowNodeApi = createApi({
  reducerPath: "workflowNodeApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    getWorkflowNodeTypes: builder.query<WorkflowNodeMetadataResponse[], void>({
      query: () => "/workflow-definition/node-types",
      transformResponse: (response: any) => response?.data ?? response,
    }),
  }),
});

export const { useGetWorkflowNodeTypesQuery, useLazyGetWorkflowNodeTypesQuery } =
  workflowNodeApi;

