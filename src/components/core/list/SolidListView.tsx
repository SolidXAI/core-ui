// @ts-nocheck

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DataTable,
  DataTableFilterMeta,
  DataTableStateEvent,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import Link from "next/link";
import qs from "qs";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "@/redux/api/solidViewApi";
import { SolidListViewColumn } from "./SolidListViewColumn";
// import { SolidListViewOptions } from "../common/SolidListviewOptions";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import { pascalCase } from "change-case";
import { useLazyCheckIfPermissionExistsQuery } from "@/redux/api/userApi";
import { createPermission, deletePermission, updatePermission } from "@/helpers/permissions";
import { useRouter } from "next/navigation";
import { ListViewRowActionPopup } from "./ListViewRowActionPopup";
import FilterComponent, { FilterOperator, FilterRule, FilterRuleType } from "@/components/core/common/FilterComponent";
import { SolidLayoutViews } from '../common/SolidLayoutViews'
import { FilterIcon } from '../../modelsComponents/filterIcon';
import { OverlayPanel } from "primereact/overlaypanel";
import { Toast } from "primereact/toast";
const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

  const solidGlobalSearchElementRef = useRef();


  const router = useRouter()
  // TODO: The initial filter state will be created based on the fields which are present on this list view. 
  const [filters, setFilters] = useState<any>();
  // const [customFilter, setCustomFilter] = useState<FilterRule[]>(initialState);
  // const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);

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

  const isFilterApplied = filters ? true : false;

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
    useUpdateSolidEntityMutation,
    useRecoverSolidEntityByIdQuery,
    useLazyRecoverSolidEntityByIdQuery,
    useLazyRecoverSolidEntityQuery
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
    // setFilters(initialFilters);
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
  const [isRecoverDialogVisible, setRecoverDialogVisible] = useState(false);
  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();
  const [showArchived, setShowArchived] = useState(false);

  // Custom Row Action
  const [listViewRowActionPopupState, setListViewRowActionPopupState] = useState(false);
  const [listViewRowActionData, setListRowActionData] = useState<any>();

  const toast = useRef<Toast>(null);

  // Get the list view data.
  const [triggerGetSolidEntities, { data: solidEntityListViewData, isLoading, error }] = useLazyGetSolidEntitiesQuery();

  const [triggerRecoverSolidEntitiesById, { data: recoverByIdData, isLoading: recoverByIdIsLoading, error: recoverByIdError, isError: recoverByIdIsError, isSuccess: recoverByIdIsSuccess }] = useLazyRecoverSolidEntityByIdQuery();

  const [triggerRecoverSolidEntities, { data: recoverByData, isLoading: recoverByIsLoading, error: recoverError, isError: recoverIsError, isSuccess: recoverByIsSuccess }] = useLazyRecoverSolidEntityQuery();

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
  const [deleteSolidSingleEntiry, { isSuccess: isDeleteSolidSingleEntitySuccess }] = useDeleteSolidEntityMutation()

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

  // Fetch Soft Deleted data
  useEffect(() => {
    const queryData = {
      offset: 0,
      limit: 25,
      populate: toPopulate,
      sort: [`id:desc`],
    };
    if (showArchived) {
      queryData.showSoftDeleted = 'true';
    }
    const queryString = qs.stringify(queryData, {
      encodeValuesOnly: true
    });

    triggerGetSolidEntities(queryString);
    setSelectedRecords([]);
  }, [showArchived, recoverByIdIsSuccess, recoverByIsSuccess]);


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
      setShowArchived(false);
    }
  }, [isDeleteSolidEntitiesSucess, isDeleteSolidSingleEntitySuccess, toPopulate]);

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
    filters?: any
  ) => {

    const solidFieldsMetadata = solidListViewMetaData.data.solidFieldsMetadata;


    const queryData: any = {
      offset: offset ?? first,
      limit: limit ?? rows,
      filters: filters ?? filters,
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
  const handleApplyCustomFilter = (filters) => {
    setFilters(filters);
    setQueryString(
      0,
      rows,
      sortField,
      sortOrder === 1 || sortOrder === -1 ? sortOrder : 0,
      filters
    );
  };

  // clear Filter
  const clearFilter = () => {
    if (solidListViewMetaData) {
      initialFilterMethod()
    }
    setFilters(null)
    solidGlobalSearchElementRef.current.clearFilter()
  };

  const op = useRef(null)

  // clickable link allowing one to open the detail / form view.
  const detailsBodyTemplate = (solidViewData: any) => {
    return (
      // <div>

      //   <Button
      //     text
      //     size="small"
      //     className="p-0"
      //     onClick={(e) =>
      //       // @ts-ignore 
      //       op.current.toggle(e)}
      //   >
      //     <svg xmlns="http://www.w3.org/2000/svg" width="3" height="10" viewBox="0 0 4 16" fill="none">
      //       <path d="M4 14C4 14.55 3.80417 15.0208 3.4125 15.4125C3.02083 15.8042 2.55 16 2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14C0 13.45 0.195833 12.9792 0.5875 12.5875C0.979167 12.1958 1.45 12 2 12C2.55 12 3.02083 12.1958 3.4125 12.5875C3.80417 12.9792 4 13.45 4 14ZM4 8C4 8.55 3.80417 9.02083 3.4125 9.4125C3.02083 9.80417 2.55 10 2 10C1.45 10 0.979167 9.80417 0.5875 9.4125C0.195833 9.02083 0 8.55 0 8C0 7.45 0.195833 6.97917 0.5875 6.5875C0.979167 6.19583 1.45 6 2 6C2.55 6 3.02083 6.19583 3.4125 6.5875C3.80417 6.97917 4 7.45 4 8ZM4 2C4 2.55 3.80417 3.02083 3.4125 3.4125C3.02083 3.80417 2.55 4 2 4C1.45 4 0.979167 3.80417 0.5875 3.4125C0.195833 3.02083 0 2.55 0 2C0 1.45 0.195833 0.979166 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0C2.55 0 3.02083 0.195833 3.4125 0.5875C3.80417 0.979166 4 1.45 4 2Z" fill="#666666" />
      //     </svg>
      //   </Button>
      //   <OverlayPanel ref={op} className="solid-custom-overlay" style={{ top: 10 }}>
      //     <div className="flex flex-column gap-1 p-1">
      //       <Button
      //         className="w-8rem"
      //         label="Edit"
      //         size="small"
      //         iconPos="left"
      //         icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      //           <path d="M3.33333 12.6667H4.28333L10.8 6.15L9.85 5.2L3.33333 11.7167V12.6667ZM2 14V11.1667L10.8 2.38333C10.9333 2.26111 11.0806 2.16667 11.2417 2.1C11.4028 2.03333 11.5722 2 11.75 2C11.9278 2 12.1 2.03333 12.2667 2.1C12.4333 2.16667 12.5778 2.26667 12.7 2.4L13.6167 3.33333C13.75 3.45556 13.8472 3.6 13.9083 3.76667C13.9694 3.93333 14 4.1 14 4.26667C14 4.44444 13.9694 4.61389 13.9083 4.775C13.8472 4.93611 13.75 5.08333 13.6167 5.21667L4.83333 14H2ZM10.3167 5.68333L9.85 5.2L10.8 6.15L10.3167 5.68333Z" fill="#F9F0FF" />
      //         </svg>}
      //         onClick={() => {
      //           if (params.embeded == true) {
      //             params.handlePopUpOpen(solidViewData.id);
      //           } else {
      //             router.push(`${editButtonUrl}/${solidViewData.id}`)
      //           }
      //         }}
      //       />
      //       <Button
      //         text
      //         className="w-8rem"
      //         label="Delete"
      //         size="small"
      //         iconPos="left"
      //         severity="secondary"
      //         icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
      //           <path d="M4.66666 14C4.29999 14 3.9861 13.8694 3.72499 13.6083C3.46388 13.3472 3.33332 13.0333 3.33332 12.6667V4H2.66666V2.66667H5.99999V2H9.99999V2.66667H13.3333V4H12.6667V12.6667C12.6667 13.0333 12.5361 13.3472 12.275 13.6083C12.0139 13.8694 11.7 14 11.3333 14H4.66666ZM11.3333 4H4.66666V12.6667H11.3333V4ZM5.99999 11.3333H7.33332V5.33333H5.99999V11.3333ZM8.66666 11.3333H9.99999V5.33333H8.66666V11.3333Z" fill="#4B4D52" />
      //         </svg>}
      //         onClick={() => deleteSolidSingleEntiry(solidViewData.id)}
      //       />
      //     </div>
      //   </OverlayPanel>
      // </div>
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

  // Recover functions
  const recoverById = (id) => {
    triggerRecoverSolidEntitiesById(id);
  }

  const recoverAll = () => {
    triggerRecoverSolidEntities();
    setRecoverDialogVisible(false);
  }

  useEffect(() => {
    if (recoverIsError || recoverByIdIsError) {
      showError(recoverByIdIsError ? recoverByIdError : recoverError);
    }
  }, [recoverIsError, recoverByIdIsError])

  const showError = async (error) => {
    const errorMessages = error.data.message;
    console.log('errorMessages', errorMessages);
    if (errorMessages.length > 0) {
      toast?.current?.show({
        severity: "error",
        summary: "Can you send me the report?",
        // sticky: true,
        life: 3000,
        //@ts-ignore
        content: (props) => (
          <div
            className="flex flex-column align-items-left"
            style={{ flex: "1" }}
          >
            {errorMessages.map((m, index) => (
              <div className="flex align-items-center gap-2" key={index}>
                <span className="font-bold text-900">{String(m)}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
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

  const sizeOptions = [
    { label: 'Compact', value: 'small', image: '/images/layout/images/compact.png' },
    { label: 'Cozy', value: 'normal', image: '/images/layout/images/cozy.png' },
    { label: 'Comfortable', value: 'large', image: '/images/layout/images/comfortable.png' }
  ]

  const viewModes = [
    { label: 'List ', value: 'list', image: '/images/layout/images/cozy.png' },
    { label: 'Kanban', value: 'kanban', image: '/images/layout/images/kanban.png' },
  ]

  const [size, setSize] = useState<string | any>(sizeOptions[1].value);
  const [view, setView] = useState<string | any>(viewModes[0].value);

  return (
    <>
      <div className="page-header">
      <Toast ref={toast} />
        <div className="flex gap-3 align-items-center">


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
            <SolidGlobalSearchElement ref={solidGlobalSearchElementRef} viewData={solidListViewMetaData} handleApplyCustomFilter={handleApplyCustomFilter}  setShowArchived={setShowArchived} showArchived={showArchived}></SolidGlobalSearchElement>
          }
        </div>
        <div className="flex align-items-center gap-3">

          {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.create !== false && params.embeded !== true &&
            <SolidCreateButton url={createButtonUrl} />
          }
          {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.create !== false && params.embeded == true && params.inlineCreate == true &&
            // < SolidCreateButton url={createButtonUrl} />
            <Button type="button" icon="pi pi-plus" label="Add" size='small' className='small-button'
              onClick={() => params.handlePopUpOpen(true)}
            ></Button>
          }
          {showArchived && <Button type="button" icon="pi pi-refresh" label="Recover" size='small' severity="warning"
              onClick={() => setRecoverDialogVisible(true)}
          ></Button>}
          <SolidLayoutViews
            sizeOptions={sizeOptions}
            setSize={setSize}
            size={size}
            viewModes={viewModes}
            setView={setView}
            view={view}
          />

          {/* {params.embeded === false &&
            <SolidListViewOptions></SolidListViewOptions>
          } */}
        </div>
      </div>
      <style>{`.p-datatable .p-datatable-loading-overlay {background-color: rgba(0, 0, 0, 0.0);} .greyed-out-row { background-color: #f5f5f5 !important; color: #a0a0a0 !important; opacity: 0.6;}`}</style>
      <div className="solid-datatable-wrapper">
        <DataTable
          value={listViewData}
          rowClassName={(rowData) => {
            return rowData.deletedAt ? "greyed-out-row" : "";
          }}
          showGridlines={false}
          lazy
          scrollable
          scrollHeight="90vh"
          size={size}
          resizableColumns
          paginator={true}
          rows={rows}
          rowsPerPageOptions={solidListViewMetaData?.data?.solidView?.layout?.attrs?.pageSizeOptions}
          dataKey="id"
          emptyMessage="No Entities found."
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
          filterIcon={<FilterIcon />}
          tableClassName="solid-data-table"
          paginatorClassName="solid-paginator"
        >

          <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />

          {renderColumnsDynamically(listViewMetaData)}
          {actionsAllowed.includes(`${updatePermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.edit !== false &&
            <Column body={(rowData) => (
              rowData.deletedAt ? (
                <a onClick={() => recoverById(rowData.id)} className="retrieve-button">
                  <i className="pi pi-refresh" style={{ fontSize: "1rem" }}/>
                </a>
              ) :
                detailsBodyTemplate(rowData)
            )}></Column>
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
      </div>
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

      <Dialog
        visible={isRecoverDialogVisible}
        header="Confirm Delete"
        modal
        footer={() => (
          <div className="flex justify-content-center">
            <Button label="Yes" icon="pi pi-check" className='small-button' severity="danger" autoFocus onClick={recoverAll} />
            <Button label="No" icon="pi pi-times" className='small-button' onClick={() => setRecoverDialogVisible(false)} />
          </div>
        )}
        onHide={() => setRecoverDialogVisible(false)}
      >
        <p>Are you sure you want to recover all records?</p>
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

