import { useLazyGetfieldsQuery } from "../../../redux/api/fieldApi";
import { useDeleteMultipleModelsMutation } from "../../../redux/api/modelApi";
import Link from "../../common/Link";
import qs from "qs";
import { useEffect, useState } from "react";
import { FilterMatchMode } from "../filter/filterMatchMode";
import { SolidButton, SolidDialog, SolidInput, SolidSpinner } from "../../shad-cn-ui";
import { Column, DataTableStateEvent, SolidDataTable } from "../list/SolidDataTable";

export interface ModelMetaData {
  id: string;
  displayName: string;
  model: string;
}

type FilterMeta = Record<string, { value: string | null; matchMode: string }>;

const createDefaultFilters = (): FilterMeta => ({
  displayName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  "model.displayName": { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

export const FieldListViewData = () => {
  const [fieldMetaData, setFieldMetadata] = useState<ModelMetaData[]>([]);
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
  const [triggerGetModels, { data: field, isLoading }] = useLazyGetfieldsQuery();

  const [deleteManyModel] = useDeleteMultipleModelsMutation();

  useEffect(() => {
    if (field) {
      setFieldMetadata(field?.records ?? []);
      setTotalRecords(field?.meta?.totalRecords ?? 0);
      setLoading(false);
    }
  }, [field]);

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

  const onSelectionChange = (value: ModelMetaData[]) => {
    setSelectedMenus(value);
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

  return (
    <div className="solid-field-list w-full">
      <div className="flex gap-3 mb-4">
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
            placeholder="Search by display name"
            className="w-full md:w-20rem"
        />
        <SolidInput
            value={pendingFilters["model.displayName"].value ?? ""}
            onChange={(event) => handleFilterInputChange("model.displayName", event.currentTarget.value)}
            placeholder="Search by model name"
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
        value={fieldMetaData}
        size="small"
        paginator
        rows={rows}
        rowsPerPageOptions={[10, 25, 50]}
        dataKey="id"
        emptyMessage="No Fields found"
        totalRecords={totalRecords}
        first={first}
        onPage={onPageChange}
        onSort={onSort}
        sortField={sortField}
        sortOrder={sortOrder}
        selection={selectedMenus}
        onSelectionChange={({ value }) => onSelectionChange(value)}
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
          field="model.displayName"
          header="Model Name"
          className="text-sm"
          style={{ minWidth: "12rem" }}
          headerClassName="table-header-fs"
        />
      </SolidDataTable>

      <SolidDialog
        visible={isDialogVisible}
        header="Confirm Delete"
        modal
        className="solid-confirm-dialog"
        onHide={() => setDialogVisible(false)}
      >
        <p>Are you sure you want to delete the selected Fields?</p>
        <div className="flex justify-content-center gap-3 mt-3">
          <SolidButton label="Yes" className="small-button" severity="danger" autoFocus onClick={deleteBulk} />
          <SolidButton label="No" className="small-button" variant="ghost" onClick={onDeleteClose} />
        </div>
      </SolidDialog>
    </div>
  );
};
