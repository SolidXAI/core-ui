'use client';
import { createPermission, deletePermission, updatePermission } from "@/helpers/permissions";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "@/redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "@/redux/api/userApi";
import { useRouter } from "next/navigation";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import {
  DataTable,
  DataTableFilterMeta,
  DataTableStateEvent,
} from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import qs from "qs";
import { useEffect, useState } from "react";
import { SolidConfigureLayoutElement } from "../common/SolidConfigureLayoutElement";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import { ListViewRowActionPopup } from "./ListViewRowActionPopup";
import { SolidListViewColumn } from "./SolidListViewColumn";

type SolidListViewParams = {
  moduleName: string;
  modelName: string;
  inlineCreate?: boolean;
  handlePopUpOpen?: any;
  embeded?: boolean;
  customLayout?: any,
  customFilter?: any
};

export const SolidListView = (params: SolidListViewParams) => {

  const router = useRouter()
  // TODO: The initial filter state will be created based on the fields which are present on this list view. 
  const [filters, setFilters] = useState<DataTableFilterMeta>({});
  const [toPopulate, setToPopulate] = useState<string[]>([]);
  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);

  const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();
  useEffect(() => {

    const fetchPermissions = async () => {
      if (params.modelName) {
        const permissionNames = [
          createPermission(params.modelName),
          deletePermission(params.modelName),
          updatePermission(params.modelName)
        ]
        const queryData = {
          permissionNames: permissionNames
        };
        const queryString = qs.stringify(queryData, {
          encodeValuesOnly: true
        });
        const response = await triggerCheckIfPermissionExists(queryString);
        setActionsAllowed(response.data.data);
      }
    };
    fetchPermissions();
  }, [params.modelName]);

  const isFilterApplied = Object.values(filters).some(
    (filter: any) => filter?.value && filter.value.length > 0
  );

  // Create the RTK slices for this entity
  const entityApi = createSolidEntityApi(params.modelName);
  const {
    useCreateSolidEntityMutation,
    useDeleteMultipleSolidEntitiesMutation,
    useDeleteSolidEntityMutation,
    useGetSolidEntitiesQuery,
    useGetSolidEntityByIdQuery,
    useLazyGetSolidEntitiesQuery,
    useLazyGetSolidEntityByIdQuery,
    usePrefetch,
    useUpdateSolidEntityMutation
  } = entityApi;

  // Get the list view layout & metadata first. 
  const listViewMetaDataQs = qs.stringify({ modelName: params.modelName, moduleName: params.moduleName, viewType: 'list' }, {
    encodeValuesOnly: true,
  });
  const [listViewMetaData, setListViewMetaData] = useState({});
  const {
    data: solidListViewMetaData,
    error: solidListViewMetaDataError,
    isLoading: solidListViewMetaDataIsLoading,
    isError: solidListViewMetaDataIsError,
    refetch
  } = useGetSolidViewLayoutQuery(listViewMetaDataQs);


  const initialFilterMethod = () => {

    const solidView = solidListViewMetaData.data.solidView;
    const solidFieldsMetadata = solidListViewMetaData.data.solidFieldsMetadata;

    const initialFilters: any = {};
    const toPopulate: string[] = [];
    for (let i = 0; i < solidView.layout.children.length; i++) {
      const column = solidView.layout.children[i];
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];

      // Form the initial filters after iterating over the columns and field metadata. 
      if (['int', 'bigint', 'float', 'decimal'].includes(fieldMetadata.type)) {
        // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
        initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.EQUALS }
      }
      else if (['date', 'datetime', 'time', 'boolean'].includes(fieldMetadata.type)) {
        // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
        initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.EQUALS }
      }
      else if (['relation', 'selectionStatic', 'selectionDynamic'].includes(fieldMetadata.type)) {
        initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.IN }
      }
      else {
        // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
        initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.STARTS_WITH }
      }

      if (column.attrs.name === 'id') {
        initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.IN }
      }

      // Form the "toPopulate" array. 
      if (fieldMetadata.type === 'relation' && fieldMetadata.relationType === 'many-to-one') {
        toPopulate.push(fieldMetadata.name);
      }
    }
    setFilters(initialFilters);
    setRows(solidListViewMetaData?.data?.solidView?.layout?.attrs?.defaultPageSize ? solidListViewMetaData?.data?.solidView?.layout?.attrs.defaultPageSize : 25)
    setToPopulate(toPopulate);
  }

  useEffect(() => {
    // refetch();
    if (solidListViewMetaData) {
      if (params.customLayout) {
        const upatedSolidListViewMetaData = structuredClone(solidListViewMetaData);
        upatedSolidListViewMetaData.data.solidView.layout = params.customLayout;
        setListViewMetaData(upatedSolidListViewMetaData);

      } else {
        setListViewMetaData(solidListViewMetaData);

      }

      initialFilterMethod()
    }
  }, [solidListViewMetaData]);




  // All list view state.
  const [listViewData, setListViewData] = useState<any[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();

  // Custom Row Action
  const [listViewRowActionPopupState, setListViewRowActionPopupState] = useState(false);
  const [listViewRowActionData, setListRowActionData] = useState<any>();

  // Get the list view data.
  const [triggerGetSolidEntities, { data: solidEntityListViewData, isLoading, error }] = useLazyGetSolidEntitiesQuery();



  // After data is fetched populate the list view state so as to be able to render the data. 
  useEffect(() => {
    if (solidEntityListViewData) {

      setListViewData(solidEntityListViewData?.records);
      setTotalRecords(solidEntityListViewData?.meta.totalRecords);
      setLoading(false);

    }
  }, [solidEntityListViewData]);


  useEffect(() => {
    if (solidListViewMetaData) {
      const createActionUrl = solidListViewMetaData?.data?.solidView?.layout?.attrs?.createAction && solidListViewMetaData?.data?.solidView?.layout?.attrs?.createAction?.type === "custom" ? solidListViewMetaData?.data?.solidView?.layout?.attrs?.createAction?.customComponent : "form/new";
      const editActionUrl = solidListViewMetaData?.data?.solidView?.layout?.attrs?.editAction && solidListViewMetaData?.data?.solidView?.layout?.attrs?.editAction?.type === "custom" ? solidListViewMetaData?.data?.solidView?.layout?.attrs?.editAction?.customComponent : "form";
      if (createActionUrl) {
        setCreateButtonUrl(createActionUrl)
      }
      if (editActionUrl) {
        setEditButtonUrl(editActionUrl)
      }
    }
  }, [solidListViewMetaData])

  // Delete mutation 
  const [
    deleteManySolidEntities,
    {
      isLoading: isSolidEntitiesDeleted,
      isSuccess: isDeleteSolidEntitiesSucess,
      isError: isSolidEntitiesDeleteError,
      error: SolidEntitiesDeleteError,
      data: DeletedSolidEntities,
    },
  ] = useDeleteMultipleSolidEntitiesMutation();

  // Fetch data after toPopulate has been populated...
  useEffect(() => {
    if (toPopulate) {
      const queryData = {
        offset: 0,
        limit: 25,
        populate: toPopulate,
        sort: [`id:desc`],
        filters: { ...params.customFilter }
      };
      if (params.embeded) {

      }
      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true
      });

      triggerGetSolidEntities(queryString);
      setSelectedRecords([]);
    }
  }, [isDeleteSolidEntitiesSucess, toPopulate]);

  // Handle pagination event.
  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setQueryString(event.first, event.rows, sortField, sortOrder, filters);
  };

  // Handle sort event.
  const onSort = (event: DataTableStateEvent) => {
    const { sortField, sortOrder } = event;
    const validSortOrder = sortOrder === 1 || sortOrder === -1 ? sortOrder : 0;
    setSortField(sortField);
    setSortOrder(validSortOrder);
    setFirst(0);
    setQueryString(
      0,
      rows,
      sortField,
      sortOrder === 1 || sortOrder === -1 ? sortOrder : 0,
      filters
    );
  };

  // handle change in the records which are currently selected...
  const onSelectionChange = (event: any) => {
    const value = event.value;
    setSelectedRecords(value);
  };

  const identifySolidOperatorAndValue = (primeReactMatchMode: FilterMatchMode, value: any): { operator: string, value: string | string[] | any[] } => {
    // @ts-ignore
    if (primeReactMatchMode.label && primeReactMatchMode.label === 'Not In') {
      primeReactMatchMode = FilterMatchMode.NOT_IN;
    }

    // Default value, this might not be useful as the solid server might not support these match modes. 
    let solidOperator = '';
    let solidValue = value[0];

    switch (primeReactMatchMode) {
      case FilterMatchMode.STARTS_WITH:
        solidOperator = "$startsWithi";
        break;
      case FilterMatchMode.CONTAINS:
        solidOperator = "$containsi";
        break;
      case FilterMatchMode.NOT_CONTAINS:
        solidOperator = "$notContains";
        break;
      case FilterMatchMode.ENDS_WITH:
        solidOperator = "$endsWith";
        break;
      case FilterMatchMode.EQUALS:
        solidOperator = "$eqi";
        solidValue = value;
        break;
      case FilterMatchMode.NOT_EQUALS:
        solidOperator = "$nei";
        solidValue = value;
        break;
      case FilterMatchMode.IN:
        solidOperator = "$in";
        solidValue = value;
        break;
      case FilterMatchMode.NOT_IN:
        solidOperator = "$notIn";
        solidValue = value;
        break;
      case FilterMatchMode.LESS_THAN:
        solidOperator = "$lt";
        break;
      case FilterMatchMode.LESS_THAN_OR_EQUAL_TO:
        solidOperator = "$lte";
        break;
      case FilterMatchMode.GREATER_THAN:
        solidOperator = "$gt";
        break;
      case FilterMatchMode.GREATER_THAN_OR_EQUAL_TO:
        solidOperator = "$gte";
        break;
      case FilterMatchMode.BETWEEN:
        solidOperator = "$between";
        solidValue = value;
        break;
    }

    return { operator: solidOperator, value: solidValue };

  }

  // Common utility function that gets called on filter, sort & pagination events. 
  // This function creates the query string as per the solid backend API specification 
  const setQueryString = async (
    offset?: number,
    limit?: number,
    sortField?: string,
    sortOrder?: number,
    filterQuery?: any
  ) => {

    const formattedFilters: any = {};
    const solidFieldsMetadata = solidListViewMetaData.data.solidFieldsMetadata;

    Object.keys(filterQuery).forEach((field) => {

      const filterField = filterQuery[field];
      const filterFieldMeta = solidFieldsMetadata[field];

      // Some filters will not have constraints
      if (!filterField.constraints) {
        if (filterField.value != null) {
          const { operator, value } = identifySolidOperatorAndValue(filterField.matchMode, filterField.value);

          // Massage the filter value for relation many-to-one before sending to the server. 
          if (filterFieldMeta.type === 'relation' && filterFieldMeta.relationType === 'many-to-one') {
            // @ts-ignore
            const manyToOneIds = value.map(i => i.value);
            formattedFilters[field] = { [operator]: manyToOneIds };
          }
          // Massage the filter value for selectionStatic before sending to the server. 
          else if (['selectionStatic', 'selectionDynamic'].includes(filterFieldMeta.type)) {
            // @ts-ignore
            const values = value.map(i => i.value);
            formattedFilters[field] = { [operator]: values };
          }
          else {
            formattedFilters[field] = { [operator]: value };
          }
        }
      }
      // TODO: Incase we start supporting multiple constraints in the future then we need to implement an else block here. 
      else { }

    });

    const queryData: any = {
      offset: offset ?? first,
      limit: limit ?? rows,
      filters: formattedFilters,
      populate: toPopulate,
    };

    if (sortField) {
      const sortFieldMetadata = solidFieldsMetadata[sortField];
      if (sortFieldMetadata.type === 'relation' && sortFieldMetadata.relationType === 'many-to-one') {
        sortField = `${sortField}.${sortFieldMetadata.relationModel.userKeyField.name}`;
      }
      queryData.sort = [
        `${sortField}:${sortOrder == 0 ? null : sortOrder == 1 ? "asc" : "desc"}`,
      ];
    }
    else {
      queryData.sort = [`id:desc`];
    }

    const queryString = qs.stringify(queryData, {
      encodeValuesOnly: true,
    });

    triggerGetSolidEntities(queryString);
  };

  // handle filter...
  const onFilter = (e: any) => {
    setFilters(e.filters);
    setQueryString(
      0,
      rows,
      sortField,
      sortOrder === 1 || sortOrder === -1 ? sortOrder : 0,
      e.filters
    );
  };

  // clear Filter
  const clearFilter = () => {
    if (solidListViewMetaData) {
      initialFilterMethod()
    }
  };


  // clickable link allowing one to open the detail / form view.
  const detailsBodyTemplate = (solidViewData: any) => {

    return (
      <a onClick={() => {
        if (params.embeded == true) {
          params.handlePopUpOpen(solidViewData.id);
        } else {
          router.push(`${editButtonUrl}/${solidViewData.id}`)
        }
      }} rel="noopener noreferrer" className="text-sm font-bold p-0" style={{ color: "#12415D" }}>
        <i className="pi pi-pencil" style={{ fontSize: "1rem" }}></i>
      </a>
    );
  };

  // handle bulk deletion
  const deleteBulk = () => {
    let deleteList: any = [];
    selectedRecords.forEach((element: any) => {
      deleteList.push(element.id);
    });
    console.log(deleteList);
    deleteManySolidEntities(deleteList);
    setDialogVisible(false);
  };

  // handle closing of the delete dialog...
  const onDeleteClose = () => {
    setDialogVisible(false);
    setSelectedRecords([]);
  }

  // Render columns dynamically based on metadata
  const renderColumnsDynamically = (solidListViewMetaData: any) => {
    if (!solidListViewMetaData) {
      return;
    }
    if (!solidListViewMetaData.data) {
      return;
    }
    const solidView = solidListViewMetaData.data.solidView;
    const solidFieldsMetadata = solidListViewMetaData.data.solidFieldsMetadata;
    if (!solidView || !solidFieldsMetadata) {
      return;
    }
    return solidView.layout.children.map((column: any) => {
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];
      if (!fieldMetadata) {
        return;
      }

      return SolidListViewColumn({ solidListViewMetaData, fieldMetadata, column });

    });
  };

  //   const handlCustomRowAction = ((i, rowData) : any) => {

  // }

  //Note -  Custom Row Action Popup 
  const closeListViewRowActionPopup = () => {
    setListViewRowActionPopupState(false)
  }


  return (
    <>
      <div className="flex gap-3 mb-3 align-items-center justify-content-between align-items-top">
        <div className="flex gap-3  align-items-center" >

          {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.create !== false && params.embeded !== true &&
            <SolidCreateButton url={createButtonUrl} />
          }
          {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.create !== false && params.embeded == true && params.inlineCreate == true &&
            // < SolidCreateButton url={createButtonUrl} />
            <Button type="button" icon="pi pi-plus" label="Add" size='small' className='small-button'
              onClick={() => params.handlePopUpOpen(true)}
            ></Button>
          }
          {actionsAllowed.includes(`${deletePermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.delete !== false && selectedRecords.length > 0 && <Button
            type="button"
            label="Delete"
            size="small"
            onClick={() => setDialogVisible(true)}
            className="small-button"
            severity="danger"
          />}
          {isFilterApplied &&
            <Button
              type="button"
              icon="pi pi-filter-slash"
              label="Clear"
              size="small"
              outlined
              onClick={clearFilter}
              className="small-button"
            />
          }

          {solidListViewMetaData?.data?.solidView?.layout?.attrs?.enableGlobalSearch === true && params.embeded === false &&
            <SolidGlobalSearchElement viewData={solidListViewMetaData} ></SolidGlobalSearchElement>
          }
        </div>
        {params.embeded === false &&
          <SolidConfigureLayoutElement></SolidConfigureLayoutElement>
        }
      </div>
      <style>{`.p-datatable .p-datatable-loading-overlay {background-color: rgba(0, 0, 0, 0.0);}`}</style>

      <DataTable
        value={listViewData}
        showGridlines
        lazy
        size="small"
        paginator={true}
        rows={rows}
        rowsPerPageOptions={solidListViewMetaData?.data?.solidView?.layout?.attrs?.pageSizeOptions}
        dataKey="id"
        filters={filters}
        emptyMessage="No Entities found."
        onFilter={onFilter}
        filterDisplay="menu"
        totalRecords={totalRecords}
        first={first}
        onPage={onPageChange}
        onSort={(e: DataTableStateEvent) => onSort(e)}
        sortField={sortField}
        sortOrder={sortOrder === 1 || sortOrder === -1 ? sortOrder : 0}
        loading={loading || isLoading}
        loadingIcon="pi pi-spinner"
        selection={selectedRecords}
        onSelectionChange={onSelectionChange}
        selectionMode="multiple"
        removableSort
      >

        <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />

        {renderColumnsDynamically(listViewMetaData)}
        {actionsAllowed.includes(`${updatePermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.edit !== false &&
          <Column body={detailsBodyTemplate}></Column>
        }
        {solidListViewMetaData?.data?.solidView?.layout?.attrs?.rowButtons &&
          solidListViewMetaData?.data?.solidView?.layout?.attrs?.rowButtons.map((rowAction: any) => {
            return (
              <Column
                key={rowAction}
                body={(rowData) => (
                  <a onClick={() => {
                    setListRowActionData({
                      modelName: params.modelName,
                      moduleName: params.moduleName,
                      rowAction: rowAction,
                      rowData: rowData,
                      closeListViewRowActionPopup: closeListViewRowActionPopup

                    });
                    setListViewRowActionPopupState(true)
                  }
                  }>
                    <i className={rowAction?.attrs?.className ? rowAction?.attrs?.className : "pi pi-pencil"} /> {/* PrimeIcons pencil icon */}
                  </a>
                )}
              />
            );
          })}
      </DataTable>
      <Dialog
        visible={isDialogVisible}
        header="Confirm Delete"
        modal
        footer={() => (
          <div className="flex justify-content-center">
            <Button label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={deleteBulk} />
            <Button label="No" icon="pi pi-times" className='small-button' onClick={onDeleteClose} />
          </div>
        )}
        onHide={() => setDialogVisible(false)}
      >
        <p>Are you sure you want to delete the selected records?</p>
      </Dialog>


      {listViewRowActionData &&
        <Dialog
          visible={listViewRowActionPopupState}
          modal
          onHide={closeListViewRowActionPopup}
        >
          <ListViewRowActionPopup context={listViewRowActionData}></ListViewRowActionPopup>
        </Dialog>
      }
    </>
  );
};

