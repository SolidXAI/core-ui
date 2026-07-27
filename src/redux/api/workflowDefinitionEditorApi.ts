import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

type WorkflowDefinitionValidationRequest = {
  definitionYaml: string;
};

type WorkflowDefinitionExecutionRequest = {
  id: number;
  input?: Record<string, any>;
  variables?: Record<string, any>;
  triggerType?: string;
  requestedByUserId?: number;
};

export const workflowDefinitionEditorApi = createApi({
  reducerPath: "workflowDefinitionEditorApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    validateWorkflowDefinition: builder.mutation<any, WorkflowDefinitionValidationRequest>({
      query: (body) => ({
        url: "/workflow-definition/validate",
        method: "POST",
        body,
      }),
    }),
    executeWorkflowDefinition: builder.mutation<any, WorkflowDefinitionExecutionRequest>({
      query: ({ id, ...body }) => ({
        url: `/workflow-definition/${id}/execute`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useExecuteWorkflowDefinitionMutation,
  useValidateWorkflowDefinitionMutation,
} = workflowDefinitionEditorApi;
