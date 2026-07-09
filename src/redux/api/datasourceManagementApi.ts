import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "./fetchBaseQuery";

export type DatasourceManagementRecord = {
  name: string;
  displayName: string;
  type: "postgres" | "mysql" | "mssql" | string;
  envPrefix: string;
  isDefault: boolean;
  host: string;
  port: number | null;
  database: string;
  username: string;
  passwordConfigured: boolean;
  synchronize: boolean | null;
  logging: boolean | null;
  moduleFile: string;
  envFile: string;
  advanced: Record<string, any>;
};

export type CreateDatasourceManagementPayload = {
  name: string;
  displayName?: string;
  type: "postgres" | "mysql" | "mssql";
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  synchronize?: boolean;
  logging?: boolean;
  ssl?: boolean;
  sslRejectUnauthorized?: boolean;
  poolMax?: number;
  connectionTimeoutMs?: number;
  idleTimeoutMs?: number;
  statementTimeoutMs?: number;
  idleInTxTimeoutMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
};

function unwrapEnvelope<T = any>(payload: any): T {
  let current = payload;

  while (
    current
    && typeof current === "object"
    && "data" in current
    && current.data !== undefined
  ) {
    current = current.data;
  }

  return current as T;
}

export const datasourceManagementApi = createApi({
  reducerPath: "datasourceManagementApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["DatasourceManagement"],
  endpoints: (builder) => ({
    getDatasources: builder.query<DatasourceManagementRecord[], void>({
      query: () => "/datasource-management",
      providesTags: ["DatasourceManagement"],
      transformResponse: (response: any) => unwrapEnvelope<{ records?: DatasourceManagementRecord[] }>(response)?.records ?? [],
    }),
    createDatasource: builder.mutation<DatasourceManagementRecord, CreateDatasourceManagementPayload>({
      query: (body) => ({
        url: "/datasource-management",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DatasourceManagement"],
      transformResponse: (response: any) => unwrapEnvelope<DatasourceManagementRecord>(response),
    }),
  }),
});

export const {
  useGetDatasourcesQuery,
  useCreateDatasourceMutation,
} = datasourceManagementApi;
