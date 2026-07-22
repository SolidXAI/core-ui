import { ArrowRight, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import React from "react";
import qs from "qs";
import YAML from "yaml";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Column, type DataTableStateEvent, SolidDataTable } from "../../../../components/core/list/SolidDataTable";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { useGetmodulesQuery } from "../../../../redux/api/moduleApi";
import { showToast } from "../../../../redux/features/toastSlice";
import {
  SolidButton,
  SolidConfirmDialog,
  SolidInput,
  SolidSpinner,
  SolidTag,
} from "../../../../components/shad-cn-ui";
import "./WorkflowDefinitionListPage.css";

const RESERVED_WORKFLOW_MODULE_NAMES = new Set(["solid-core"]);

type WorkflowDefinitionListRecord = {
  id: number;
  key?: string | null;
  displayName?: string | null;
  moduleMetadata?: Record<string, any> | null;
  moduleMetadataId?: number | null;
  moduleMetadataUserKey?: string | null;
  description?: string | null;
  namespace?: string | null;
  status?: string | null;
  definitionVersion?: string | null;
  definitionChecksum?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  definitionYaml?: {
    nodes?: Array<Record<string, any>>;
    triggers?: Array<Record<string, any>>;
  } | string | null;
};

function getDefinitionYaml(definitionYaml: WorkflowDefinitionListRecord["definitionYaml"]) {
  if (!definitionYaml) {
    return {};
  }

  if (typeof definitionYaml === "string") {
    try {
      return YAML.parse(definitionYaml) ?? {};
    } catch {
      return {};
    }
  }

  return definitionYaml;
}

function getNodeCount(record: WorkflowDefinitionListRecord) {
  const definitionYaml = getDefinitionYaml(record.definitionYaml);
  return Array.isArray(definitionYaml?.nodes) ? definitionYaml.nodes.length : 0;
}

function getTriggerCount(record: WorkflowDefinitionListRecord) {
  const definitionYaml = getDefinitionYaml(record.definitionYaml);
  return Array.isArray(definitionYaml?.triggers) ? definitionYaml.triggers.length : 0;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildQueryString(options: {
  first: number;
  rows: number;
  sortField: string;
  sortOrder: 1 | -1 | 0;
  searchValue: string;
}) {
  const { first, rows, sortField, sortOrder, searchValue } = options;
  const queryData: Record<string, any> = {
    offset: first,
    limit: rows,
    populate: ["moduleMetadata"],
    sort: [sortField ? `${sortField}:${sortOrder === 1 ? "asc" : "desc"}` : "id:desc"],
  };

  const trimmedSearch = searchValue.trim();
  if (trimmedSearch) {
    queryData.filters = {
      $or: [
        { key: { $containsi: trimmedSearch } },
        { displayName: { $containsi: trimmedSearch } },
        { namespace: { $containsi: trimmedSearch } },
        { description: { $containsi: trimmedSearch } },
        { status: { $containsi: trimmedSearch } },
      ],
    };
  }

  return qs.stringify(queryData, { encodeValuesOnly: true });
}

function statusTone(status?: string | null) {
  const value = (status ?? "").toLowerCase();
  if (value === "published" || value === "active" || value === "success") {
    return "success";
  }
  if (value === "draft") {
    return "warn";
  }
  if (value === "failed" || value === "error") {
    return "danger";
  }
  return undefined;
}

function isWorkflowModuleSelectable(module?: Record<string, any> | null) {
  const moduleName = String(module?.name ?? "").trim();
  return Boolean(moduleName) && !RESERVED_WORKFLOW_MODULE_NAMES.has(moduleName);
}

export function WorkflowDefinitionListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const entityApi = React.useMemo(
    () => createSolidEntityApi("workflowDefinition"),
    [],
  );
  const {
    useDeleteSolidEntityMutation,
    useLazyGetSolidEntitiesQuery,
  } = entityApi;

  const [first, setFirst] = React.useState(0);
  const [rows, setRows] = React.useState(25);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [sortField, setSortField] = React.useState("id");
  const [sortOrder, setSortOrder] = React.useState<1 | -1 | 0>(-1);
  const [searchInput, setSearchInput] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  const [deleteCandidate, setDeleteCandidate] =
    React.useState<WorkflowDefinitionListRecord | null>(null);

  const [triggerGetWorkflowDefinitions, { data, isLoading, isFetching, error }] =
    useLazyGetSolidEntitiesQuery();
  const [deleteWorkflowDefinition, { isLoading: isDeleting }] =
    useDeleteSolidEntityMutation();
  const { data: moduleMetadataResponse } = useGetmodulesQuery(
    "offset=0&limit=100&sort[0]=displayName%3Aasc",
  );

  const defaultWorkflowModuleName = React.useMemo(() => {
    const moduleRecords = ((moduleMetadataResponse?.records ?? []) as Record<string, any>[]);
    return moduleRecords.find(isWorkflowModuleSelectable)?.name ?? "";
  }, [moduleMetadataResponse?.records]);

  const loadData = React.useCallback(
    async (nextState?: Partial<{
      first: number;
      rows: number;
      sortField: string;
      sortOrder: 1 | -1 | 0;
      searchValue: string;
    }>) => {
      const effectiveState = {
        first,
        rows,
        sortField,
        sortOrder,
        searchValue,
        ...nextState,
      };

      const queryString = buildQueryString(effectiveState);
      const response: any = await triggerGetWorkflowDefinitions(queryString);
      const meta = response?.data?.meta;
      setTotalRecords(meta?.totalRecords ?? 0);
    },
    [first, rows, searchValue, sortField, sortOrder, triggerGetWorkflowDefinitions],
  );

  React.useEffect(() => {
    void loadData({
      first,
      rows,
      sortField,
      sortOrder,
      searchValue,
    });
  }, [first, rows, sortField, sortOrder, searchValue, loadData]);

  const records = React.useMemo(
    () => ((data?.records ?? []) as WorkflowDefinitionListRecord[]),
    [data],
  );
  const handleDelete = (record: WorkflowDefinitionListRecord) => {
    setDeleteCandidate(record);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    const record = deleteCandidate;
    setDeleteCandidate(null);
    try {
      await deleteWorkflowDefinition(record.id).unwrap();
      dispatch(
        showToast({
          severity: "success",
          summary: "Deleted",
          detail: "Workflow definition deleted successfully.",
        }),
      );
      void loadData();
    } catch (deleteError: any) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Delete failed",
          detail:
            deleteError?.data?.message ??
            deleteError?.message ??
            "Failed to delete workflow definition.",
        }),
      );
    }
  };

  const handleRefresh = () => {
    void loadData();
  };

  const applySearch = () => {
    setFirst(0);
    setSearchValue(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchValue("");
    setFirst(0);
  };

  return (
    <div className="workflow-definition-list-page">
      <section className="workflow-definition-list-shell">
        <div className="workflow-definition-list-toolbar">
          <div className="workflow-definition-list-search">
            <Search size={15} />
            <SolidInput
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
              placeholder="Search workflow definitions"
            />
          </div>
          <div className="workflow-definition-list-toolbar-actions">
            <SolidButton
              size="small"
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={handleRefresh}
            >
              Refresh
            </SolidButton>
            <SolidButton
              size="small"
              leftIcon={<Plus size={14} />}
              onClick={() =>
                navigate("/admin/core/solid-core/workflow-definition/editor/new")
              }
              disabled={!defaultWorkflowModuleName}
            >
              New workflow
            </SolidButton>
            {searchValue ? (
              <button
                type="button"
                className="workflow-definition-list-clear"
                onClick={clearSearch}
              >
                Clear all
              </button>
            ) : null}
            {isFetching && !isLoading ? (
              <div className="workflow-definition-list-inline-status">
                <SolidSpinner size={16} />
                <span>Refreshing</span>
              </div>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="workflow-definition-list-loading">
            <SolidSpinner size={28} />
            <p>Loading workflow definitions...</p>
          </div>
        ) : error ? (
          <div className="workflow-definition-list-error">
            <span>Unable to load workflow definitions.</span>
            <SolidButton variant="outline" onClick={handleRefresh}>
              Retry
            </SolidButton>
          </div>
        ) : (
          <div className="workflow-definition-list-table-wrap">
            <SolidDataTable
              value={records}
              dataKey="id"
              paginator={totalRecords > rows}
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={[10, 25, 50]}
              onPage={
                totalRecords > rows
                  ? (event) => {
                      setFirst(event.first);
                      setRows(event.rows);
                    }
                  : undefined
              }
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={(event: DataTableStateEvent) => {
                const nextSortField = event.sortField ?? "id";
                const nextSortOrder =
                  event.sortOrder === 1 || event.sortOrder === -1
                    ? event.sortOrder
                    : -1;
                setSortField(nextSortField);
                setSortOrder(nextSortOrder);
                setFirst(0);
              }}
              removableSort={false}
              size="small"
              viewportHeight="auto"
              tableClassName="workflow-definition-table"
              paginatorClassName="workflow-definition-table-paginator"
              currentPageReportTemplate="{first} - {last} of {totalRecords}"
              emptyMessage="No workflow definitions found"
              onRowClick={({ data: row }) =>
                navigate(`/admin/core/solid-core/workflow-definition/editor/${row.id}`)
              }
              rowClassName={(row) =>
                row.status ? `workflow-definition-table-row workflow-definition-table-row--${String(row.status).toLowerCase()}` : "workflow-definition-table-row"
              }
            >
              <Column
                field="key"
                header="Id"
                sortable
                className="workflow-definition-table-cell--id"
                headerClassName="workflow-definition-table-cell--id"
                body={(row: WorkflowDefinitionListRecord) => (
                  <span className="workflow-definition-table-id">
                    {row.key || `workflow-${row.id}`}
                  </span>
                )}
              />
              <Column
                field="displayName"
                header="Name"
                sortable
                className="workflow-definition-table-cell--name"
                headerClassName="workflow-definition-table-cell--name"
                body={(row: WorkflowDefinitionListRecord) => (
                  <span className="workflow-definition-table-name">
                    {row.displayName || row.key || `Workflow ${row.id}`}
                  </span>
                )}
              />
              <Column
                field="namespace"
                header="Namespace"
                sortable
                body={(row: WorkflowDefinitionListRecord) => (
                  <span className="workflow-definition-table-namespace">
                    {row.namespace || "Not set"}
                  </span>
                )}
              />
              <Column
                field="description"
                header="Description"
                body={(row: WorkflowDefinitionListRecord) => (
                  <div className="workflow-definition-table-description">
                    {row.description || "No description yet"}
                  </div>
                )}
              />
              <Column
                field="status"
                header="Status"
                sortable
                body={(row: WorkflowDefinitionListRecord) => (
                  row.status ? (
                    <SolidTag tone={statusTone(row.status) as any}>{row.status}</SolidTag>
                  ) : (
                    <span className="workflow-definition-table-muted">Not set</span>
                  )
                )}
              />
              <Column
                field="definitionVersion"
                header="Version"
                sortable
                body={(row: WorkflowDefinitionListRecord) => (
                  row.definitionVersion ? (
                    <SolidTag>{row.definitionVersion}</SolidTag>
                  ) : (
                    <span className="workflow-definition-table-muted">n/a</span>
                  )
                )}
              />
              <Column
                header="Nodes"
                body={(row: WorkflowDefinitionListRecord) => getNodeCount(row)}
              />
              <Column
                header="Triggers"
                body={(row: WorkflowDefinitionListRecord) => getTriggerCount(row)}
              />
              <Column
                field="updatedAt"
                header="Updated"
                sortable
                className="workflow-definition-table-cell--updated"
                headerClassName="workflow-definition-table-cell--updated"
                body={(row: WorkflowDefinitionListRecord) => (
                  <span className="workflow-definition-table-date">
                    {formatDate(row.updatedAt || row.createdAt)}
                  </span>
                )}
              />
              <Column
                header="Actions"
                body={(row: WorkflowDefinitionListRecord) => (
                  <div
                    className="workflow-definition-table-actions"
                    data-no-row-click="true"
                  >
                    <SolidButton
                      size="small"
                      variant="ghost"
                      onClick={() => void handleDelete(row)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={14} />
                    </SolidButton>
                    <SolidButton
                      size="small"
                      onClick={() =>
                        navigate(
                          `/admin/core/solid-core/workflow-definition/editor/${row.id}`,
                        )
                      }
                    >
                      <ArrowRight size={14} />
                    </SolidButton>
                  </div>
                )}
              />
            </SolidDataTable>
          </div>
        )}
      </section>
      <SolidConfirmDialog
        open={Boolean(deleteCandidate)}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={() => void confirmDelete()}
        className="solid-shadcn-confirm-dialog solid-delete-confirm-dialog"
        headerClassName="solid-shadcn-dialog-head"
        bodyClassName="solid-shadcn-dialog-body"
        footerClassName="solid-shadcn-dialog-actions"
        separatorClassName="solid-shadcn-dialog-sep"
        showSeparator
        title="Delete Workflow Definition"
        message={
          <p className="solid-shadcn-dialog-text">
            {`Are you sure you want to delete workflow definition "${deleteCandidate?.displayName || deleteCandidate?.key || deleteCandidate?.id}"?`}
          </p>
        }
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
      />
    </div>
  );
}
