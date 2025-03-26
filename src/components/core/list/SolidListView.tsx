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
import { Divider } from "primereact/divider";
import CompactImage from '../../../resources/images/layout/images/compact.png';
import CozyImage from '../../../resources/images/layout/images/cozy.png';
import ComfortableImage from '../../../resources/images/layout/images/comfortable.png';
import ListImage from '../../../resources/images/layout/images/cozy.png';
import KanbanImage from '../../../resources/images/layout/images/kanban.png';
import { capitalize } from "lodash";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { SolidListViewConfigure } from "./SolidListViewConfigure";

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
  const [toPopulateMedia, setToPopulateMedia] = useState<string[]>([]);
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
    useRecoverSolidEntityMutation
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
    const toPopulateMedia: string[] = [];

    for (let i = 0; i < solidView.layout.children?.length; i++) {
      const column = solidView.layout.children[i];
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];
      if (!fieldMetadata?.type) {
        showFieldError(`${column.attrs.label} is not present in metadata`)
        return;
      }
      // Form the initial filters after iterating over the columns and field metadata. 
      if (['int', 'bigint', 'float', 'decimal'].includes(fieldMetadata?.type)) {
        // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
        initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.EQUALS }
      }
      else if (['date', 'datetime', 'time', 'boolean'].includes(fieldMetadata?.type)) {
        // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
        initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.EQUALS }
      }
      else if (['relation', 'selectionStatic', 'selectionDynamic'].includes(fieldMetadata?.type)) {
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
      if (fieldMetadata.type === 'mediaSingle' || fieldMetadata.type === 'mediaMultiple') {
        toPopulateMedia.push(fieldMetadata.name);
      }
    }
    // setFilters(initialFilters);
    setRows(solidListViewMetaData?.data?.solidView?.layout?.attrs?.defaultPageSize ? solidListViewMetaData?.data?.solidView?.layout?.attrs.defaultPageSize : 25)
    setToPopulate(toPopulate);
    setToPopulateMedia(toPopulateMedia);
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
  const [selectedRecoverRecords, setSelectedRecoverRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isRecoverDialogVisible, setRecoverDialogVisible] = useState(false);
  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();
  const [showArchived, setShowArchived] = useState(false);

  const sizeOptions = [
    { label: 'Compact', value: 'small', image: CompactImage },
    { label: 'Cozy', value: 'normal', image: CozyImage },
    { label: 'Comfortable', value: 'large', image: ComfortableImage }
  ]

  // const viewModes = [
  //   { label: 'List ', value: 'list', image: ListImage },
  //   { label: 'Kanban', value: 'kanban', image: KanbanImage },
  // ]

  const [size, setSize] = useState<string | any>(sizeOptions[1].value);
  const [viewModes, setViewModes] = useState<any>([]);



  // Custom Row Action
  const [listViewRowActionPopupState, setListViewRowActionPopupState] = useState(false);
  const [listViewRowActionData, setListRowActionData] = useState<any>();

  const toast = useRef<Toast>(null);

  // Get the list view data.
  const [triggerGetSolidEntities, { data: solidEntityListViewData, isLoading, error }] = useLazyGetSolidEntitiesQuery();

  const [triggerRecoverSolidEntitiesById, { data: recoverByIdData, isLoading: recoverByIdIsLoading, error: recoverByIdError, isError: recoverByIdIsError, isSuccess: recoverByIdIsSuccess }] = useLazyRecoverSolidEntityByIdQuery();

  const [triggerRecoverSolidEntities, { data: recoverByData, isLoading: recoverByIsLoading, error: recoverError, isError: recoverIsError, isSuccess: recoverByIsSuccess }] = useRecoverSolidEntityMutation();

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
      const viewModes = solidListViewMetaData?.data?.solidView?.layout?.attrs?.allowedViews && solidListViewMetaData?.data?.solidView?.layout?.attrs?.allowedViews.length > 0 && solidListViewMetaData?.data?.solidView?.layout?.attrs?.allowedViews.map((view: any) => { return { label: capitalize(view), value: view } });
      setViewModes(viewModes);
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
      queryData.showSoftDeleted = 'inclusive';
    }
    const queryString = qs.stringify(queryData, {
      encodeValuesOnly: true
    });

    triggerGetSolidEntities(queryString);
    setSelectedRecords([]);
    setSelectedRecoverRecords([]);
  }, [showArchived, recoverByIdIsSuccess, recoverByIsSuccess]);


  // Fetch data after toPopulate has been populated...
  useEffect(() => {
    if (toPopulate || toPopulateMedia) {
      const queryData = {
        offset: 0,
        limit: 25,
        populate: toPopulate,
        populateMedia: toPopulateMedia,
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
      setSelectedRecoverRecords([]);
      setShowArchived(false);
    }
  }, [isDeleteSolidEntitiesSucess, isDeleteSolidSingleEntitySuccess, toPopulate, toPopulateMedia]);

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
    const activeRecords = value.filter((record: any) => record.deletedAt === null);
    const deletedRecords = value.filter((record: any) => record.deletedAt !== null);

    setSelectedRecords(activeRecords);
    setSelectedRecoverRecords(deletedRecords);
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
      populateMedia: toPopulateMedia
    };

    if (sortField) {
      const sortFieldMetadata = solidFieldsMetadata[sortField];
      if (sortFieldMetadata.type === 'relation' && sortFieldMetadata.relationType === 'many-to-one') {
        sortField = `${sortField}.${sortFieldMetadata?.relationModel?.userKeyField?.name}`;
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

  const [selectedSolidViewData, setSelectedSolidViewData] = useState<any>()

  const op = useRef(null)
  const [deleteEntity, setDeleteEntity] = useState(false);

  // clickable link allowing one to open the detail / form view.
  const detailsBodyTemplate = (solidViewData: any) => {
    return (
      <div>
        <Button
          text
          size="small"
          className=""
          onClick={(e) =>
          // @ts-ignore 
          {
            e.stopPropagation();
            op.current.toggle(e);
            setSelectedSolidViewData(solidViewData)
          }
          }

        >
          <svg xmlns="http://www.w3.org/2000/svg" width="3" height="10" viewBox="0 0 4 16" fill="none">
            <path d="M4 14C4 14.55 3.80417 15.0208 3.4125 15.4125C3.02083 15.8042 2.55 16 2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14C0 13.45 0.195833 12.9792 0.5875 12.5875C0.979167 12.1958 1.45 12 2 12C2.55 12 3.02083 12.1958 3.4125 12.5875C3.80417 12.9792 4 13.45 4 14ZM4 8C4 8.55 3.80417 9.02083 3.4125 9.4125C3.02083 9.80417 2.55 10 2 10C1.45 10 0.979167 9.80417 0.5875 9.4125C0.195833 9.02083 0 8.55 0 8C0 7.45 0.195833 6.97917 0.5875 6.5875C0.979167 6.19583 1.45 6 2 6C2.55 6 3.02083 6.19583 3.4125 6.5875C3.80417 6.97917 4 7.45 4 8ZM4 2C4 2.55 3.80417 3.02083 3.4125 3.4125C3.02083 3.80417 2.55 4 2 4C1.45 4 0.979167 3.80417 0.5875 3.4125C0.195833 3.02083 0 2.55 0 2C0 1.45 0.195833 0.979166 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0C2.55 0 3.02083 0.195833 3.4125 0.5875C3.80417 0.979166 4 1.45 4 2Z" fill="#666666" />
          </svg>
        </Button>
      </div>
      // <a onClick={() => {
      //   if (params.embeded == true) {
      //     params.handlePopUpOpen(solidViewData.id);
      //   } else {
      //     router.push(`${editButtonUrl}/${solidViewData.id}`)
      //   }
      // }} rel="noopener noreferrer" className="text-sm font-bold p-0" style={{ color: "#12415D" }}>
      //   <i className="pi pi-pencil" style={{ fontSize: "1rem" }}></i>
      // </a>
    );
  };

  // Recover functions
  const recoverById = (id) => {
    triggerRecoverSolidEntitiesById(id);
  }

  const recoverAll = () => {
    let recoverList: any = [];
    selectedRecoverRecords.forEach((element: any) => {
      recoverList.push(element.id);
    });
    triggerRecoverSolidEntities(recoverList);
    setRecoverDialogVisible(false);
  }

  useEffect(() => {
    if (recoverIsError || recoverByIdIsError) {
      showError(recoverByIdIsError ? recoverByIdError : recoverError);
    }
  }, [recoverIsError, recoverByIdIsError])

  const showError = async (error) => {
    const errorMessages = error?.data?.message;
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

  const showFieldError = async (error) => {
    if (error) {
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
            <div className="flex align-items-center gap-2" >
              <span className="font-bold text-900">{String(error)}</span>
            </div>
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
    deleteManySolidEntities(deleteList);
    setDialogVisible(false);
  };

  // handle closing of the delete dialog...
  const onDeleteClose = () => {
    setDialogVisible(false);
    setSelectedRecords([]);
    setSelectedRecoverRecords([]);
  }

  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxUrls, setLightboxUrls] = useState({});

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
    return solidView.layout.children?.map((column: any) => {
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];
      if (!fieldMetadata) {
        return;
      }

      return SolidListViewColumn({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox });

    });
  };

  //   const handlCustomRowAction = ((i, rowData) : any) => {

  // }

  //Note -  Custom Row Action Popup 
  const closeListViewRowActionPopup = () => {
    setListViewRowActionPopupState(false)
  }


  const listViewTitle = solidListViewMetaData?.data?.solidView?.displayName

  return (
    <div className="page-parent-wrapper">
      <div className="page-header">
        <Toast ref={toast} />
        <div className="flex gap-3 align-items-center">
          <p className="m-0 view-title">{listViewTitle}</p>
          {solidListViewMetaData?.data?.solidView?.layout?.attrs?.enableGlobalSearch === true && params.embeded === false &&
            <SolidGlobalSearchElement filters={filters} clearFilter={clearFilter} ref={solidGlobalSearchElementRef} viewData={solidListViewMetaData} handleApplyCustomFilter={handleApplyCustomFilter}></SolidGlobalSearchElement>
          }
        </div>
        <div className="flex align-items-center gap-3">

          {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.create !== false && params.embeded !== true &&
            <SolidCreateButton url={createButtonUrl} />
          }
          {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.create !== false && params.embeded == true && params.inlineCreate == true &&
            // < SolidCreateButton url={createButtonUrl} />
            <Button type="button" icon="pi pi-plus" label="Add" size='small'
              onClick={() => params.handlePopUpOpen("new")}
            ></Button>
          }
          {/* Button For Manual Refresh */}
          <Button
            type="button"
            size="small"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            onClick={() => {
              setQueryString(first, rows, sortField, sortOrder, filters);
            }}
          />
          {showArchived && <Button type="button" icon="pi pi-refresh" label="Recover" size='small' severity="secondary"
            onClick={() => setRecoverDialogVisible(true)}
          ></Button>}

          {params.embeded === false && (solidListViewMetaData?.data?.solidView?.layout?.attrs?.configureView !== false) &&
            <SolidListViewConfigure
              listViewMetaData={listViewMetaData}
              setShowArchived={setShowArchived}
              showArchived={showArchived}
              viewData={solidListViewMetaData}
              sizeOptions={sizeOptions}
              setSize={setSize}
              size={size}
              viewModes={viewModes}
              params={params}
              actionsAllowed={actionsAllowed}
              selectedRecords={selectedRecords}
              setDialogVisible={setDialogVisible}
            />
          }

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
          // scrollHeight="90vh"
          size={size}
          resizableColumns
          paginator={true}
          rows={rows}
          rowsPerPageOptions={solidListViewMetaData?.data?.solidView?.layout?.attrs?.pageSizeOptions}
          dataKey="id"
          emptyMessage={solidListViewMetaData?.data?.solidView?.model?.description || 'No Entities found.'}
          filterDisplay="menu"
          totalRecords={totalRecords}
          first={first}
          onPage={onPageChange}
          onSort={(e: DataTableStateEvent) => onSort(e)}
          sortField={sortField}
          sortOrder={sortOrder === 1 || sortOrder === -1 ? sortOrder : 0}
          loading={loading || isLoading}
          loadingIcon="pi pi-spinner"
          selection={[...selectedRecords, ...selectedRecoverRecords]}
          onSelectionChange={onSelectionChange}
          selectionMode="checkbox"
          removableSort
          filterIcon={<FilterIcon />}
          tableClassName="solid-data-table"
          paginatorClassName="solid-paginator"
          paginatorTemplate="RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink"
          currentPageReportTemplate="{first} - {last} of {totalRecords}"
          onRowClick={(e) => {
            const rowData = e.data;
            if (
              !(
                actionsAllowed.includes(updatePermission(params.modelName)) &&
                solidListViewMetaData?.data?.solidView?.layout?.attrs?.edit !== false
              )
            ) {
              return;
            }
            if (params.embeded == true) {
              params.handlePopUpOpen(rowData?.id);
            } else {
              router.push(`${editButtonUrl}/${rowData?.id}`);
            }
          }}
        >

          <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />

          {renderColumnsDynamically(listViewMetaData)}
          {actionsAllowed.includes(`${updatePermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.edit !== false &&
            <Column frozen alignFrozen="right" body={(rowData) => (
              rowData?.deletedAt ? (
                <a onClick={(event) => { event.stopPropagation(); recoverById(rowData.id) }} className="retrieve-button">
                  <i className="pi pi-refresh" style={{ fontSize: "1rem" }} />
                </a>
              ) :
                <>
                  {detailsBodyTemplate(rowData)}
                  <OverlayPanel ref={op} className="solid-custom-overlay" style={{ top: 10, minWidth: 120 }}>
                    <div className="flex flex-column gap-1 p-1">
                      <Button
                        type="button"
                        className="w-full text-left gap-1"
                        label="Edit"
                        size="small"
                        iconPos="left"
                        icon={"pi pi-pencil"}
                        onClick={() => {
                          if (params.embeded == true) {
                            params.handlePopUpOpen(selectedSolidViewData?.id);
                          } else {
                            router.push(`${editButtonUrl}/${selectedSolidViewData?.id}`)
                          }
                        }}
                      />
                      {actionsAllowed.includes(`${deletePermission(params.modelName)}`) && solidListViewMetaData?.data?.solidView?.layout?.attrs?.delete !== false &&
                        <Button
                          text
                          type="button"
                          className="w-full text-left gap-1"
                          label="Delete"
                          size="small"
                          iconPos="left"
                          severity="danger"
                          icon={'pi pi-trash'}
                          onClick={() => setDeleteEntity(true)}
                        />
                      }
                      {solidListViewMetaData?.data?.solidView?.layout?.attrs?.rowButtons &&
                        solidListViewMetaData?.data?.solidView?.layout?.attrs?.rowButtons.map((rowAction: any) => {
                          return (
                            <Button
                              text
                              size="small"
                              icon={rowAction?.attrs?.className ? rowAction?.attrs?.className : "pi pi-pencil"}
                              onClick={() => {
                                setListRowActionData({
                                  modelName: params.modelName,
                                  moduleName: params.moduleName,
                                  rowAction: rowAction,
                                  rowData: selectedSolidViewData,
                                  closeListViewRowActionPopup: closeListViewRowActionPopup

                                });
                                setListViewRowActionPopupState(true)
                              }
                              }
                              className="w-full text-left gap-2"
                              label="Generate Code"
                            />
                          );
                        })}
                    </div>
                  </OverlayPanel>
                </>
            )}></Column>
          }
        </DataTable>
      </div>
      <Dialog
        visible={isDialogVisible}
        header="Confirm Delete"
        modal
        footer={() => (
          <div className="flex justify-content-center">
            <Button label="Yes" icon="pi pi-check" severity="danger" autoFocus onClick={deleteBulk} />
            <Button label="No" icon="pi pi-times" onClick={onDeleteClose} />
          </div>
        )}
        onHide={() => setDialogVisible(false)}
      >
        <p>Are you sure you want to delete the selected records?</p>
      </Dialog>

      <Dialog
        visible={isRecoverDialogVisible}
        header="Confirm Recover"
        modal
        footer={() => (
          <div className="flex justify-content-center">
            <Button label="Yes" icon="pi pi-check" severity="danger" autoFocus onClick={recoverAll} />
            <Button label="No" icon="pi pi-times" onClick={() => setRecoverDialogVisible(false)} />
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
      <Dialog header="Delete Field" headerClassName="py-2" contentClassName="px-0 pb-0" visible={deleteEntity} style={{ width: '20vw' }} onHide={() => { if (!deleteEntity) return; setDeleteEntity(false); }}>
        <Divider className="m-0" />
        <div className="p-4">
          <p className="m-0 solid-primary-title" style={{ fontSize: 16 }}>
            Are you sure you want to delete this Field ?
          </p>
          <p className="" style={{ color: 'var{--solid-grey-500}' }}>{selectedSolidViewData?.singularName}</p>
          <div className="flex align-items-center gap-2 mt-3">
            <Button label="Delete" size="small" onClick={() => { deleteSolidSingleEntiry(selectedSolidViewData?.id); setDeleteEntity(false); }} />
            <Button label="Cancel" size="small" onClick={() => setDeleteEntity(false)} outlined className='bg-primary-reverse' />
          </div>
        </div>
      </Dialog>
      {openLightbox &&
        <Lightbox
          open={openLightbox}
          plugins={[Counter, Download]}
          close={() => setOpenLightbox(false)}
          slides={lightboxUrls}
        />
      }
    </div>
  );
};