import { useDeleteMultipleUsersMutation, useLazyGetusersQuery } from "../../../redux/api/userApi";
import Link from "../../common/Link";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { CreateButton } from "../../../components/common/CreateButton";
import qs from "qs";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { showToast } from "../../../redux/features/toastSlice";
import { SolidButton, SolidDialog, SolidIcon, SolidInput, SolidSpinner } from "../../shad-cn-ui";
import { Column, DataTableStateEvent, SolidDataTable } from "../list/SolidDataTable";
import { FilterMatchMode } from "../filter/filterMatchMode";

interface Users {
  id: string;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
}

interface ErrorResponseData {
  message: string;
  statusCode: number;
  error: string;
}

type FilterMeta = Record<string, { value: string | null; matchMode: string }>;

const createDefaultFilters = (): FilterMeta => ({
  fullName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  username: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  email: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  mobile: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

export const UserListView = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState<Users[]>([]);
  const [filters, setFilters] = useState<FilterMeta>(() => createDefaultFilters());
  const [pendingFilters, setPendingFilters] = useState<FilterMeta>(() => createDefaultFilters());
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0>(0);
  const [selectedUsers, setSelectedUsers] = useState<Users[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogVisible, setDialogVisible] = useState(false);

  const [triggerGetUser, { data: user, isLoading, error, isError }] = useLazyGetusersQuery();
  const [deleteManyUser, { isSuccess: isDeleteUserSuceess, isError: isUserDeleteError, error: UserDeleteError }] =
    useDeleteMultipleUsersMutation();

  useEffect(() => {
    if (user) {
      setUsers(user?.data?.records ?? []);
      setTotalRecords(user?.data?.meta?.totalRecords ?? 0);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const queryData = {
      offset: 0,
      limit: rows,
      populate: ["roles"],
    };
    const queryString = qs.stringify(queryData, { encodeValuesOnly: true });
    triggerGetUser(queryString);
    setSelectedUsers([]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isError || isUserDeleteError) {
      setLoading(false);
      let errorMessage = ERROR_MESSAGES.ERROR_OCCURED;

      const errorToast = isError ? error : UserDeleteError;

      if (isFetchBaseQueryErrorWithErrorResponse(errorToast)) {
        errorMessage = `${(errorToast as FetchBaseQueryError & { data: ErrorResponseData }).data.message}`;
      } else {
        errorMessage = ERROR_MESSAGES.SOMETHING_WRONG;
      }

      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.ERROR, detail: errorMessage, life: 3000 }));
    }
  }, [dispatch, isError, isUserDeleteError, error, UserDeleteError]);

  const isFetchBaseQueryErrorWithErrorResponse = (
    error: any
  ): error is FetchBaseQueryError & { data: ErrorResponseData } => {
    return error && typeof error === "object" && "data" in error && "message" in (error as any).data;
  };

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

        formattedFilters[fieldName] = { [operator]: filterValue };
      }
    });

    const queryData: Record<string, any> = {
      offset: offset ?? first,
      limit: rowCount ?? rows,
      populate: ["roles"],
      filters: formattedFilters,
    };

    if (field) {
      queryData.sort = [`${field}:${order === 0 ? null : order === 1 ? "asc" : "desc"}`];
    }

    const queryString = qs.stringify(queryData, {
      encodeValuesOnly: true,
    });

    return triggerGetUser(queryString);
  };

  const handleFilterInputChange = (fieldName: keyof FilterMeta, value: string) => {
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
    const deleteList = selectedUsers.map((user) => user.id);
    deleteManyUser(deleteList);
    setDialogVisible(false);
  };

  return (
    <div className="solid-user-list w-full">
      <div className="flex gap-3 mb-4 align-items-center flex-wrap">
        <CreateButton />
        {selectedUsers.length > 0 && (
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

      <div className="grid formgrid mb-3">
        {[
          { key: "fullName", placeholder: "Search by full name" },
          { key: "username", placeholder: "Search by username" },
          { key: "email", placeholder: "Search by email" },
          { key: "mobile", placeholder: "Search by mobile" },
        ].map((filter) => (
          <div className="field col-12 md:col-3" key={filter.key}>
            <SolidInput
              value={pendingFilters[filter.key as keyof FilterMeta].value ?? ""}
              onChange={(event) =>
                handleFilterInputChange(filter.key as keyof FilterMeta, event.currentTarget.value)
              }
              placeholder={filter.placeholder}
            />
          </div>
        ))}
        <div className="field col-12 flex align-items-center gap-2">
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
        value={users}
        size="small"
        paginator
        rows={rows}
        rowsPerPageOptions={[10, 25, 50]}
        dataKey="id"
        emptyMessage="No users found"
        totalRecords={totalRecords}
        first={first}
        onPage={onPageChange}
        onSort={onSort}
        sortField={sortField}
        sortOrder={sortOrder}
        selection={selectedUsers}
        onSelectionChange={({ value }) => setSelectedUsers(value)}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
        <Column field="id" header="ID" className="text-sm" sortable headerClassName="table-header-fs" />
        <Column
          field="fullName"
          header="Full Name"
          className="text-sm"
          sortable
          style={{ minWidth: "12rem" }}
          headerClassName="table-header-fs"
        />
        <Column
          field="username"
          header="Username"
          className="text-sm"
          sortable
          style={{ minWidth: "12rem" }}
          headerClassName="table-header-fs"
        />
        <Column
          field="email"
          header="Email"
          className="text-sm"
          sortable
          style={{ minWidth: "12rem" }}
          headerClassName="table-header-fs"
        />
        <Column
          body={(record: Users) => (
            <Link
              href={`${record.id}`}
              rel="noopener noreferrer"
              className="text-sm font-bold p-0"
              style={{ color: "#12415D" }}
            >
              <SolidIcon name="si-pencil" style={{ fontSize: "1rem" }} aria-hidden />
            </Link>
          )}
        />
      </SolidDataTable>

      <SolidDialog
        visible={isDialogVisible}
        header="Confirm Delete"
        modal
        className="solid-confirm-dialog"
        onHide={() => setDialogVisible(false)}
      >
        <p>Are you sure you want to delete the selected Users?</p>
        <div className="flex justify-content-center gap-3 mt-3">
          <SolidButton label="Yes" className="small-button" severity="danger" autoFocus onClick={deleteBulk} />
          <SolidButton label="No" className="small-button" variant="ghost" onClick={() => setDialogVisible(false)} />
        </div>
      </SolidDialog>
    </div>
  );
};
