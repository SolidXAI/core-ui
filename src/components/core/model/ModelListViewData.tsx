import { CreateButton } from "../../../components/common/CreateButton";
import {
  useDeleteMultipleModelsMutation,
  useGenerateCodeForModelMutation,
  useLazyGetModelsQuery,
} from "../../../redux/api/modelApi";
import Link from "../../common/Link";
import qs from "qs";
import { useEffect, useState } from "react";
import { FilterMatchMode } from "../filter/filterMatchMode";
import { SolidButton, SolidDialog, SolidIcon, SolidInput, SolidSpinner } from "../../shad-cn-ui";
import { Column, DataTableStateEvent, SolidDataTable } from "../list/SolidDataTable";

export interface ModelMetaData {
  id: string;
  displayName: string;
  module: string;
  isSystem: boolean;
}

type FilterMeta = Record<string, { value: string | null; matchMode: string }>;

const createDefaultFilters = (): FilterMeta => ({
  displayName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  "module.displayName": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

export const ModelListViewData = () => {
  const [modelMetadata, setModelMetadata] = useState<ModelMetaData[]>([]);
  const [filters, setFilters] = useState<FilterMeta>(() => createDefaultFilters());
  const [pendingFilters, setPendingFilters] = useState<FilterMeta>(() => createDefaultFilters());
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0>(0);
  const [selectedMenus, setSelectedMenus] = useState<ModelMetaData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isGenerateCodeVisible, setGenerateCodeVisible] = useState(false);
  const [generateCodeForModel, setGenerateCodeForModel] = useState<string | null>(null);

  const [triggerGetModels, { data: model, isLoading }] = useLazyGetModelsQuery();
  const [generateCode] = useGenerateCodeForModelMutation();
  const [deleteManyModel] = useDeleteMultipleModelsMutation();

  useEffect(() => {
    if (model) {
      setModelMetadata(model?.records ?? []);
      setTotalRecords(model?.meta?.totalRecords ?? 0);
      setLoading(false);
    }
  }, [model]);

  useEffect(() => {
    const queryData = {
      offset: 0,
      limit: rows,
      sort: [`id:desc`],
    };
    const queryString = qs.stringify(queryData, { encodeValuesOnly: true });
    triggerGetModels(queryString);
    setSelectedMenus([]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onPageChange = (event: { first: number; rows: number }) => {
    setFirst(event.first);
    setRows(event.rows);
    setQueryString(event.first, event.rows, sortField, sortOrder, filters);
  };

  const onSort = (event: DataTableStateEvent) => {
    const nextSortField = event.sortField ?? "";
    const validSortOrder = event.sortOrder === 1 || event.sortOrder === -1 ? event.sortOrder : 0;
    setSortField(nextSortField);
    setSortOrder(validSortOrder);
    setFirst(0);
    setQueryString(0, rows, nextSortField, validSortOrder, filters);
  };

  const setQueryString = async (
    offset?: number,
    rowCount?: number,
    field?: string,
    order?: 1 | -1 | 0,
    filterQuery?: FilterMeta
  ) => {
    const formattedFilters: Record<string, any> = {};

    Object.keys(filterQuery ?? {}).forEach((fieldName) => {
      const filterValue = filterQuery?.[fieldName]?.value;
      const matchMode = filterQuery?.[fieldName]?.matchMode;

      if (filterValue !== null && filterValue !== undefined && matchMode) {
        let operator = matchMode;
        switch (matchMode) {
          case FilterMatchMode.CONTAINS:
            operator = "$containsi";
            break;
          case FilterMatchMode.STARTS_WITH:
            operator = "$startsWithi";
            break;
          case FilterMatchMode.EQUALS:
            operator = "$eqi";
            break;
          case FilterMatchMode.NOT_CONTAINS:
            operator = "$notContainsi";
            break;
          case FilterMatchMode.NOT_EQUALS:
            operator = "$nei";
            break;
          case FilterMatchMode.ENDS_WITH:
            operator = "$endsWithi";
            break;
          default:
            operator = matchMode;
        }

        if (fieldName.includes(".")) {
          const [parent, child] = fieldName.split(".");
          if (!formattedFilters[parent]) {
            formattedFilters[parent] = {};
          }
          formattedFilters[parent][child] = { [operator]: filterValue };
        } else {
          formattedFilters[fieldName] = { [operator]: filterValue };
        }
      }
    });

    const queryData: Record<string, any> = {
      offset: offset ?? first,
      limit: rowCount ?? rows,
      filters: formattedFilters,
    };

    if (field) {
      queryData.sort = [`${field}:${order === 0 ? null : order === 1 ? "asc" : "desc"}`];
    }

    const queryString = qs.stringify(queryData, { encodeValuesOnly: true });
    return triggerGetModels(queryString);
  };

  const handleFilterInputChange = (fieldName: string, value: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], value },
    }));
  };

  const applyFilters = () => {
    setFirst(0);
    setFilters(pendingFilters);
    setQueryString(0, rows, sortField, sortOrder, pendingFilters);
  };

  const clearFilters = () => {
    const defaults = createDefaultFilters();
    setPendingFilters(defaults);
    setFilters(defaults);
    setFirst(0);
    setQueryString(0, rows, sortField, sortOrder, defaults);
  };

  const deleteBulk = () => {
    const deleteList = selectedMenus.map((element) => element.id);
    deleteManyModel(deleteList);
    setDialogVisible(false);
    setSelectedMenus([]);
  };

  const onDeleteClose = () => {
    setDialogVisible(false);
    setSelectedMenus([]);
  };

  const handleGenerateCode = async () => {
    if (!generateCodeForModel) return;
    await generateCode({ id: generateCodeForModel });
    setGenerateCodeVisible(false);
    setGenerateCodeForModel(null);
  };

  const detailsBodyTemplate = (record: ModelMetaData) => (
    <Link
      href={`${record.id}`}
      rel="noopener noreferrer"
      className="text-sm font-bold p-0"
      style={{ color: "#12415D" }}
    >
      {record.isSystem ? (
        <SolidIcon name="si-eye" style={{ fontSize: "1rem" }} aria-hidden />
      ) : (
        <SolidIcon name="si-pencil" style={{ fontSize: "1rem" }} aria-hidden />
      )}
    </Link>
  );

  const generateCodeBodyTemplate = (record: ModelMetaData) => {
    if (record.isSystem) {
      return null;
    }
    return (
      <button
        type="button"
        className="text-primary border-0 bg-transparent cursor-pointer"
        onClick={() => {
          setGenerateCodeForModel(record.id);
          setGenerateCodeVisible(true);
        }}
      >
        <SolidIcon name="si-cog" style={{ fontSize: "1rem" }} aria-hidden />
      </button>
    );
  };

  return (
    <div className="solid-model-list w-full">
      <div className="flex gap-3 mb-4 align-items-center flex-wrap">
        <CreateButton />
        {selectedMenus.length > 0 && (
          <SolidButton
            type="button"
            label="Delete"
            size="small"
            severity="danger"
            className="small-button"
            onClick={() => setDialogVisible(true)}
          />
        )}
      </div>

      <div className="flex flex-column md:flex-row align-items-start gap-3 mb-3">
        <SolidInput
          value={pendingFilters.displayName.value ?? ""}
          onChange={(event) => handleFilterInputChange("displayName", event.currentTarget.value)}
          placeholder="Search by model name"
          className="w-full md:w-20rem"
        />
        <SolidInput
          value={pendingFilters["module.displayName"].value ?? ""}
          onChange={(event) => handleFilterInputChange("module.displayName", event.currentTarget.value)}
          placeholder="Search by module"
          className="w-full md:w-20rem"
        />
        <div className="flex align-items-center gap-2">
          <SolidButton size="small" onClick={applyFilters} label="Apply" />
          <SolidButton size="small" variant="ghost" onClick={clearFilters} label="Clear" />
        </div>
      </div>

      {(loading || isLoading) && (
        <div className="flex justify-content-center my-3">
          <SolidSpinner />
        </div>
      )}

      <SolidDataTable
        value={modelMetadata}
        size="small"
        paginator
        rows={rows}
        rowsPerPageOptions={[10, 25, 50]}
        dataKey="id"
        emptyMessage="No Models found"
        totalRecords={totalRecords}
        first={first}
        onPage={onPageChange}
        onSort={onSort}
        sortField={sortField}
        sortOrder={sortOrder}
        selection={selectedMenus}
        onSelectionChange={({ value }) => setSelectedMenus(value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
        <Column field="id" header="Id" className="text-sm" sortable headerClassName="table-header-fs" />
        <Column
          field="displayName"
          header="Display Name"
          className="text-sm"
          sortable
          style={{ minWidth: "12rem" }}
          headerClassName="table-header-fs"
        />
        <Column
          field="module.displayName"
          header="Module Name"
          className="text-sm"
          style={{ minWidth: "12rem" }}
          headerClassName="table-header-fs"
        />
        <Column header="Edit" body={detailsBodyTemplate} />
        <Column header="Code" body={generateCodeBodyTemplate} />
      </SolidDataTable>

      <SolidDialog
        visible={isDialogVisible}
        header="Confirm Delete"
        modal
        className="solid-confirm-dialog"
        onHide={() => setDialogVisible(false)}
      >
        <p>Are you sure you want to delete the selected Models?</p>
        <div className="flex justify-content-center gap-3 mt-3">
          <SolidButton label="Yes" className="small-button" severity="danger" autoFocus onClick={deleteBulk} />
          <SolidButton label="No" className="small-button" variant="ghost" onClick={onDeleteClose} />
        </div>
      </SolidDialog>

      <SolidDialog
        visible={isGenerateCodeVisible}
        header="Generate Code"
        modal
        className="solid-confirm-dialog"
        onHide={() => {
          setGenerateCodeVisible(false);
          setGenerateCodeForModel(null);
        }}
      >
        <p className="text-center">Proceed with model code generation? Existing files will be overwritten.</p>
        <p>Below is the list of files that will be created:</p>
        <ul>
          <li>Model Entity File</li>
          <li>Model Controller File</li>
          <li>Model Service File</li>
          <li>Model Create and Update DTO files</li>
        </ul>
        <div className="flex justify-content-center gap-3 mt-3">
          <SolidButton label="Yes" className="small-button" severity="danger" autoFocus onClick={handleGenerateCode} />
          <SolidButton label="No" className="small-button" variant="ghost" onClick={() => setGenerateCodeVisible(false)} />
        </div>
      </SolidDialog>
    </div>
  );
};
