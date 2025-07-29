// @ts-nocheck

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { createPermission, deleteManyPermission, deletePermission, findPermission, updatePermission } from "@/helpers/permissions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { capitalize, filter, set } from "lodash";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { SolidListViewConfigure } from "./SolidListViewConfigure";
import { SolidListViewShimmerLoading } from "./SolidListViewShimmerLoading";
import { SolidEmptyListViewPlaceholder } from "./SolidEmptyListViewPlaceholder";
import { useHandleListCustomButtonClick } from "@/components/common/useHandleListCustomButtonClick";
import { hasAnyRole, useHasAnyRole } from "@/helpers/rolesHelper";
import { SolidListViewHeaderButton } from "./SolidListViewHeaderButton";
import { SolidListViewRowButtonContextMenu } from "./SolidListViewRowButtonContextMenu";
import { useSelector } from "react-redux";
import styles from './SolidListViewWrapper.module.css';
import { SolidXAIModule } from "../solid-ai/SolidXAIModule";
import { SolidXAIIcon } from "../solid-ai/SolidXAIIcon";
const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const queryStringToQueryObject = () => {
  const currentPageUrl = window.location.pathname; // Get the current page URL
  const encodedQueryString = localStorage.getItem(currentPageUrl); // Retrieve the encoded query string from local storage

  if (encodedQueryString) {
    try {
      const decodedQueryString = atob(encodedQueryString); // Base64 decode the string
      const parsedParams = qs.parse(decodedQueryString); // Parse the decoded string into an object
      return parsedParams;
    } catch (error) {
      console.error("Error decoding or parsing query string from local storage:", error);
    }
  };

};

export const queryObjectToQueryString = (queryObject: string) => {
  if (queryObject) {
    const stringifiedObject = qs.stringify(queryObject);
    const encodedQueryString = btoa(stringifiedObject); // Base64 encode the stringified object
    const currentPageUrl = window.location.pathname; // Get the current page URL
    localStorage.setItem(currentPageUrl, encodedQueryString); // Store in local storage with the URL as the key
    return encodedQueryString;
  }
  return null;
};

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
  const { user } = useSelector((state: any) => state.auth);

  const solidGlobalSearchElementRef = useRef();

  const router = useRouter()
  const searchParams = useSearchParams(); // Converts the query params to a string
  const localeName = searchParams.get('locale');
  // TODO: The initial filter state will be created based on the fields which are present on this list view. 
  const [filters, setFilters] = useState<any>(params.customFilter || null);
  // const [customFilter, setCustomFilter] = useState<FilterRule[]>(initialState);
  // const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);

  const [toPopulate, setToPopulate] = useState<string[]>([]);
  const [toPopulateMedia, setToPopulateMedia] = useState<string[]>([]);
  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
  const [isOpenSolidXAiPanel, setIsOpenSolidXAiPanel] = useState(false);
  const [chatterWidth, setChatterWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();

  const handleCustomButtonClick = useHandleListCustomButtonClick()

  useEffect(() => {
    const storedOpen = localStorage.getItem('l_solidxai_open');
    const storedWidth = localStorage.getItem('l_solidxai_width');

    if (storedOpen !== null) {
      setIsOpenSolidXAiPanel(storedOpen === 'true');
    }

    if (storedWidth !== null) {
      const width = parseInt(storedWidth, 10);
      if (!isNaN(width)) {
        setChatterWidth(width);
      }
    }
  }, []);


  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = window.innerWidth - e.clientX;
        const clampedWidth = Math.max(280, Math.min(newWidth, 700));
        setChatterWidth(clampedWidth);
        localStorage.setItem('l_solidxai_width', clampedWidth.toString());
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  useEffect(() => {
    console.log('useEffect: [params.modelName]');
    const fetchPermissions = async () => {
      if (params.modelName) {
        const permissionNames = [
          createPermission(params.modelName),
          deletePermission(params.modelName),
          updatePermission(params.modelName),
          deleteManyPermission(params.modelName),
          findPermission(params.modelName)
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
  const [solidListViewLayout, setSolidListViewLayout] = useState({})
  const {
    data: solidListViewMetaData,
    error: solidListViewMetaDataError,
    isLoading: solidListViewMetaDataIsLoading,
    isError: solidListViewMetaDataIsError,
    refetch
  } = useGetSolidViewLayoutQuery(listViewMetaDataQs);

  const initialFilterMethod = () => {
    const solidView = solidListViewMetaData?.data?.solidView;
    const solidFieldsMetadata = solidListViewMetaData?.data?.solidFieldsMetadata;

    const initialFilters: any = {};
    const toPopulate: string[] = [];
    const toPopulateMedia: string[] = [];
    const currentLayout = params.customLayout ? params.customLayout : solidView?.layout;
    for (let i = 0; i < currentLayout?.children.length; i++) {
      const column = currentLayout?.children[i];
      const fieldMetadata = solidFieldsMetadata?.[column.attrs.name];
      if (!fieldMetadata?.type) {
        showFieldError(`${column.attrs.label} is not present in metadata`)
        // return;
      }
      if (fieldMetadata) {
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
        if (fieldMetadata.type === 'relation') {
          if (!toPopulate.includes(fieldMetadata.name)) {
            toPopulate.push(fieldMetadata.name);
          }
        }
        if (fieldMetadata.type === 'mediaSingle' || fieldMetadata.type === 'mediaMultiple') {
          if (!toPopulateMedia.includes(fieldMetadata.name)) {
            toPopulateMedia.push(fieldMetadata.name);
          }

        }
      }

    }
    // setFilters(initialFilters);
    const rows = currentLayout?.attrs?.defaultPageSize ?? 25;
    const populate = toPopulate;
    const populateMedia = toPopulateMedia;
    setRows(rows);
    setToPopulate(populate);
    setToPopulateMedia(populateMedia);
    setSortField('id');
    setSortOrder(-1);
    return { rows, populate, populateMedia }
  }

  // Set the initial filter state based on the metadata.
  useEffect(() => {
    console.log('useEffect: [solidListViewMetaData] line no 227');
    // refetch();
    if (solidListViewMetaData) {
      if (params.customLayout) {
        setSolidListViewLayout(params.customLayout)
      } else {

        setSolidListViewLayout(solidListViewMetaData?.data.solidView.layout)
      }
      setListViewMetaData(solidListViewMetaData);
      // initialFilterMethod()
    }
  }, [solidListViewMetaData]);

  // set layout and actions for create and edit buttons and view modes
  useEffect(() => {
    console.log('useEffect: [solidListViewMetaData] line no 245');
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


  // All list view state.
  const [listViewData, setListViewData] = useState<any[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(solidListViewLayout?.attrs?.defaultPageSize ? solidListViewLayout?.attrs?.defaultPageSize : 10);
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
  const [queryDataLoaded, setQueryDataLoaded] = useState(false);
  const [customFilter, setCustomFilter] = useState(null);
  const [showSaveFilterPopup, setShowSaveFilterPopup] = useState<boolean>(false);


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
    console.log('useEffect: [solidListViewMetaData] line no 310');
    if (solidEntityListViewData) {
      const cleanedRecords = solidEntityListViewData.records.map((record) => {
        const newRecord = { ...record };

        Object.entries(newRecord).forEach(([key, value]) => {
          if (typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                newRecord[key] = parsed.join(', ');
              }
            } catch {
              // If not valid JSON array, optionally strip brackets/quotes
              if (/^\[.*\]$/.test(value)) {
                newRecord[key] = value.replace(/[\[\]"]+/g, '');
              }
            }
          }
        });

        return newRecord;
      });
      setListViewData(cleanedRecords);
      // setListViewData(solidEntityListViewData?.records);
      setTotalRecords(solidEntityListViewData?.meta.totalRecords);
      setLoading(false);
    }
  }, [solidEntityListViewData]);

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


  // Fetch data after toPopulate has been populated...
  useEffect(() => {
    console.log('useEffect: [isDeleteSolidEntitiesSucess, isDeleteSolidSingleEntitySuccess, recoverByIdIsSuccess, recoverByIsSuccess, solidListViewMetaData]');
    if (solidListViewMetaData) {
      const queryObject = queryStringToQueryObject();

      if (queryObject) {
        const queryData = {
          offset: queryObject.offset || 0,
          limit: queryObject.limit || 25,
          populate: queryObject.populate,
          populateMedia: queryObject.populateMedia,
          sort: queryObject.sort ? queryObject.sort?.map((sortItem: string) => {
            const [field, order] = sortItem.split(":");
            return { field, order };
          }) : [`id:desc`],
          filters: queryObject.filters
        };
        const filters = {
          $and: []
        }
        if (queryObject.s_filter) {
          filters.$and.push(queryObject.s_filter);
        }
        if (queryObject.c_filter) {
          filters.$and.push(queryObject.c_filter);
        }
        setRows(Number(queryData.limit));
        setToPopulate(queryData?.populate);
        setToPopulateMedia(queryData?.populateMedia);
        setFirst(Number(queryData?.offset));
        setSortField(queryData?.sort[0]?.field);
        setSortOrder(queryData?.sort[0]?.order);
        setFilters(filters);
        setQueryDataLoaded(true);
      } else {
        initialFilterMethod();
        setQueryDataLoaded(true)
      }
      setSelectedRecords([]);
      setSelectedRecoverRecords([]);

    }
  }, [isDeleteSolidEntitiesSucess, isDeleteSolidSingleEntitySuccess, recoverByIdIsSuccess, recoverByIsSuccess, solidListViewMetaData]);

  useEffect(() => {
    console.log('useEffect: [first, rows, sortField, sortOrder, showArchived, toPopulate, toPopulateMedia, customFilter, queryDataLoaded]');

    if (queryDataLoaded) {
      setQueryString(
        first,
        rows,
        sortField,
        sortOrder,
        filters,
        showArchived
      );
    }
  }, [first, rows, sortField, sortOrder, showArchived, toPopulate, toPopulateMedia, customFilter, queryDataLoaded]);

  // Handle pagination event.
  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    // setQueryString(event.first, event.rows, sortField, sortOrder, filters, showArchived);
  };

  // Handle sort event.
  const onSort = (event: DataTableStateEvent) => {
    const { sortField, sortOrder } = event;
    const validSortOrder = sortOrder === 1 || sortOrder === -1 ? sortOrder : 0;
    setSortField(sortField);
    setSortOrder(validSortOrder);
    setFirst(0);
    // setQueryString(
    //   0,
    //   rows,
    //   sortField,
    //   sortOrder === 1 || sortOrder === -1 ? sortOrder : 0,
    //   filters
    // );
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
    filters?: any,
    showArchived?: boolean,
    locale?:string
  ) => {

    const solidFieldsMetadata = solidListViewMetaData?.data?.solidFieldsMetadata;


    const queryData: any = {
      offset: offset ?? first,
      limit: limit ?? rows,
      filters: filters ?? filters,
      populate: toPopulate,
      populateMedia: toPopulateMedia,
      locale: localeName ? localeName : 'en'
    };

    if (sortField) {
      const sortFieldMetadata = solidFieldsMetadata[sortField];
      if (sortFieldMetadata?.type === 'relation' && sortFieldMetadata?.relationType === 'many-to-one') {
        sortField = `${sortField}.${sortFieldMetadata?.relationModel?.userKeyField?.name}`;
      }
      queryData.sort = [
        `${sortField}:${sortOrder == 0 ? null : sortOrder == 1 ? "asc" : "desc"}`,
      ];
    }
    else {
      queryData.sort = [`id:desc`];
    }

    if (showArchived) {
      queryData.showSoftDeleted = 'inclusive';
    }
    const queryString = qs.stringify(queryData, { encodeValuesOnly: true });

    if (customFilter) {
      let url
      const urlData = queryData;
      delete urlData.filters;
      urlData.s_filter = customFilter.s_filter || {};
      urlData.c_filter = customFilter.c_filter || {};
      queryObjectToQueryString(urlData);
    }
    triggerGetSolidEntities(queryString);
  };

  // handle filter...
  const handleApplyCustomFilter = (transformedFilter: any) => {

    const queryfilter = {
      $and: [
      ]
    }
    if (transformedFilter.s_filter) {
      queryfilter.$and.push(transformedFilter.s_filter)
    }
    if (transformedFilter.c_filter) {
      queryfilter.$and.push(transformedFilter.c_filter)
    }

    const customFilter = transformedFilter;
    const updatedFilter = { ...(filters || {}), ...(queryfilter || {}) };
    setFilters((prevFilters) => ({ ...(prevFilters || {}), ...(queryfilter || {}) }));
    setCustomFilter(customFilter)
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
          type="button"
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
    console.log('useEffect: [recoverIsError, recoverByIdIsError]');
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
    const currentLayout = params.customLayout ? params.customLayout : solidView.layout;

    return currentLayout.children?.map((column: any) => {
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];
      if (!fieldMetadata) {
        return;
      }
      const visibleToRole = column?.attrs?.roles || [];

      if (visibleToRole.length > 0) {
        if (hasAnyRole(user?.user?.roles, visibleToRole)) {
          return SolidListViewColumn({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox });
        } else {
          return null;
        }
      } else {
        return SolidListViewColumn({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox });
      }

    });
  };

  //Note -  Custom Row Action Popup 
  const closeListViewRowActionPopup = () => {
    setListViewRowActionPopupState(false)
  }

  // if (loading || isLoading) {
  //   return <SolidListViewShimmerLoading />;
  // }

  const viewMode = searchParams.get('viewMode');

  if ((loading || isLoading) && params.embeded == false && viewMode !== 'view') {
    return <SolidListViewShimmerLoading />;
  }

  const isListViewEmptyWithoutFilters = !loading && (!filters || Object.keys(filters).length === 0) && listViewData.length === 0;

  // if (isListViewEmptyWithoutFilters) {
  //   return (
  //     <SolidEmptyListViewPlaceholder
  //       createButtonUrl={createButtonUrl}
  //       actionsAllowed={actionsAllowed}
  //       params={params}
  //       solidListViewMetaData={solidListViewMetaData}
  //     />
  //   );
  // }


  const handleFetchUpdatedRecords = () => {
    setQueryString(first, rows, sortField, sortOrder, filters, showArchived);
  }
  const handleOpenSolidXAIPanel = () => {
    setIsOpenSolidXAiPanel(true);
    localStorage.setItem('l_solidxai_open', 'true');
  };

  const handleCloseSolidXAIPanel = () => {
    setIsOpenSolidXAiPanel(false);
    localStorage.setItem('l_solidxai_open', 'false');
  };
  return (
    <div className="page-parent-wrapper flex">
      <div className={`h-full flex-grow-1 ${styles.ListContentWrapper}`}>
        <div className="page-header">
          <Toast ref={toast} />
          <div className="flex gap-3 align-items-center">
            <p className="m-0 view-title">{solidListViewMetaData?.data?.solidView?.displayName}</p>
            {solidListViewLayout?.attrs?.enableGlobalSearch === true && params.embeded === false &&
              <SolidGlobalSearchElement showSaveFilterPopup={showSaveFilterPopup} setShowSaveFilterPopup={setShowSaveFilterPopup} filters={filters} clearFilter={clearFilter} ref={solidGlobalSearchElementRef} viewData={solidListViewMetaData} handleApplyCustomFilter={handleApplyCustomFilter}></SolidGlobalSearchElement>
            }
          </div>
          <div className="flex align-items-center gap-3">
            {solidListViewLayout?.attrs?.headerButtons
              ?.filter(rb => rb.attrs.actionInContextMenu != true)
              ?.map((button: any, index: number) => (
                <SolidListViewHeaderButton
                  key={index}
                  button={button}
                  params={params}
                  solidListViewMetaData={solidListViewMetaData}
                  handleCustomButtonClick={handleCustomButtonClick}
                />
              ))}



            {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewLayout?.attrs?.create !== false && params.embeded !== true && solidListViewMetaData?.data?.solidView?.layout?.attrs.showDefaultAddButton !== false &&
              <SolidCreateButton url={createButtonUrl} solidListViewLayout={solidListViewLayout} />
            }
            {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidListViewLayout?.attrs?.create !== false && params.embeded == true && params.inlineCreate == true && searchParams.get('viewMode') !== "view" &&
              // < SolidCreateButton url={createButtonUrl} />
              <Button type="button" icon={solidListViewLayout?.attrs?.addButtonIcon ? solidListViewLayout?.attrs?.addButtonIcon : "pi pi-plus"} label={solidListViewLayout?.attrs?.addButtonTitle ? solidListViewLayout?.attrs?.addButtonTitle : "Add"} className={`${solidListViewLayout?.attrs?.addButtonClassName}`} size='small'
                onClick={() => params.handlePopUpOpen("new")}
              ></Button>
            }
            {/* Button For Manual Refresh */}
            {params.embeded !== true &&
              <Button
                type="button"
                size="small"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                onClick={() => {
                  setQueryString(first, rows, sortField, sortOrder, filters, showArchived);
                }}
              />
            }
            {showArchived && <Button type="button" icon="pi pi-refresh" label="Recover" size='small' severity="secondary"
              onClick={() => setRecoverDialogVisible(true)}
            ></Button>}

            {params.embeded === false && (solidListViewLayout?.attrs?.configureView !== false) &&
              <SolidListViewConfigure
                listViewMetaData={listViewMetaData}
                solidListViewLayout={solidListViewLayout}
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
                setShowSaveFilterPopup={setShowSaveFilterPopup}
                filters={filters}
                handleFetchUpdatedRecords={handleFetchUpdatedRecords}
              />
            }

          </div>
        </div>
        {isListViewEmptyWithoutFilters ?
          <SolidEmptyListViewPlaceholder
            createButtonUrl={createButtonUrl}
            actionsAllowed={actionsAllowed}
            params={params}
            solidListViewMetaData={solidListViewMetaData}
          />
          :
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
              rowsPerPageOptions={solidListViewLayout?.attrs?.pageSizeOptions}
              dataKey="id"
              emptyMessage={solidListViewMetaData?.data?.solidView?.model?.description || 'No Entities found.'}
              filterDisplay="menu"
              totalRecords={totalRecords}
              first={first}
              onPage={onPageChange}
              onSort={(e: DataTableStateEvent) => onSort(e)}
              sortField={sortField}
              sortOrder={sortOrder === 1 || sortOrder === -1 ? sortOrder : 0}
              loading={false}
              // loading={loading || isLoading}
              // loadingIcon="pi pi-spinner"
              selection={params.embeded === true ? null : [...selectedRecords, ...selectedRecoverRecords]}
              onSelectionChange={params.embeded === true ? undefined : onSelectionChange}
              selectionMode={params.embeded === true ? null : "checkbox"}
              removableSort
              filterIcon={<FilterIcon />}
              tableClassName="solid-data-table"
              paginatorClassName="solid-paginator"
              paginatorTemplate="RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink"
              currentPageReportTemplate="{first} - {last} of {totalRecords}"

              onRowClick={(e) => {
                const rowData = e.data;

                if (solidListViewLayout?.attrs.disableRowClick === true) return;

                const hasFindPermission = actionsAllowed.includes(findPermission(params.modelName));
                const hasUpdatePermission =
                  actionsAllowed.includes(updatePermission(params.modelName)) &&
                  solidListViewLayout?.attrs?.edit !== false;

                if (!(hasFindPermission || hasUpdatePermission)) return;

                if (params.embeded === true) {
                  params.handlePopUpOpen(rowData?.id);
                } else {
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("fromView", "list");
                  }
                  router.push(`${editButtonUrl}/${rowData?.id}?viewMode=view`);
                }
              }}
            >
              {params.embeded === true ? null :
                <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
              }
              {renderColumnsDynamically(listViewMetaData)}
              {solidListViewLayout?.attrs?.rowButtons &&
                solidListViewLayout?.attrs?.rowButtons.filter((rb: any) => {
                  const roles = rb?.attrs?.roles || [];
                  const isInContextMenu = rb.attrs.actionInContextMenu === true;

                  // Only check hasAnyRole if roles are provided
                  const isAllowed = roles.length === 0 || hasAnyRole(user?.user?.roles, roles);

                  return !isInContextMenu && isAllowed;
                })
                  .map((button: any, index: number) => {

                    // const hasRole = button.attrs.roles && button.attrs.roles.length > 0 ? useHasAnyRole(button.attrs.roles) : true;
                    // if (!hasRole) return null;

                    return (
                      <Column
                        key={index}
                        header={button.attrs.label}
                        body={(rowData) => {
                          return (
                            <Button
                              type="button"
                              icon={button?.attrs?.icon ? button?.attrs?.icon : "pi pi-pencil"}
                              className={`w-full text-left gap-2 ${button?.attrs?.className ? button?.attrs?.className : ''}`}
                              label={button.attrs.showLabel !== false ? button.attrs.label : ''}
                              size="small"
                              iconPos="left"
                              onClick={() => {
                                const event = {
                                  params,
                                  rowData: rowData,
                                  solidListViewMetaData: solidListViewMetaData.data
                                }
                                handleCustomButtonClick(button.attrs, event)
                              }}
                            />
                          )
                        }} />
                    );
                  })}

              {actionsAllowed.includes(`${updatePermission(params.modelName)}`) && solidListViewLayout?.attrs?.edit !== false && solidListViewLayout?.attrs?.showRowEditInContextMenu === false &&
                <Column
                  header="Edit"
                  body={(rowData) => {
                    return (
                      <Button
                        text
                        type="button"
                        severity="secondary"
                        className=""
                        label=""
                        size="small"
                        iconPos="left"
                        icon={"pi pi-pencil"}
                        onClick={() => {
                          if (params.embeded == true) {
                            params.handlePopUpOpen(rowData?.id);
                          } else {
                            router.push(`${editButtonUrl}/${rowData?.id}?viewMode=edit`)
                          }
                        }}
                      />
                    )
                  }} />
              }

              {actionsAllowed.includes(`${deletePermission(params.modelName)}`) && solidListViewLayout?.attrs?.delete !== false && solidListViewLayout?.attrs?.showRowDeleteInContextMenu === false &&
                <Column
                  header="Delete"
                  body={(rowData) => {
                    return (
                      <Button
                        text
                        type="button"
                        className=""
                        size="small"
                        iconPos="left"
                        severity="danger"
                        icon={'pi pi-trash'}
                        onClick={() => {
                          setSelectedSolidViewData(rowData); setDeleteEntity(true)
                        }}
                      />
                    )
                  }} />
              }

              {actionsAllowed.includes(`${updatePermission(params.modelName)}`) && solidListViewLayout?.attrs?.edit !== false &&
                <Column frozen alignFrozen="right" body={(rowData) => (
                  rowData?.deletedAt ? (
                    <a onClick={(event) => { event.stopPropagation(); recoverById(rowData.id) }} className="retrieve-button">
                      <i className="pi pi-refresh" style={{ fontSize: "1rem" }} />
                    </a>
                  ) :
                    <>
                      {solidListViewLayout?.attrs?.showRowContextMenu !== false &&
                        <>
                          {detailsBodyTemplate(rowData)}
                          <OverlayPanel ref={op} className="solid-custom-overlay" style={{ top: 10, minWidth: 120 }}>
                            <div className="flex flex-column gap-1 p-1">
                              {solidListViewLayout?.attrs.showDefaultEditButton !== false && solidListViewLayout?.attrs.showRowEditInContextMenu !== false &&
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
                                      router.push(`${editButtonUrl}/${selectedSolidViewData?.id}?viewMode=edit`)
                                    }
                                  }}
                                />
                              }

                              {actionsAllowed.includes(`${deletePermission(params.modelName)}`) && solidListViewLayout?.attrs?.delete !== false && solidListViewLayout?.attrs.showRowDeleteInContextMenu !== false &&
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
                              {solidListViewLayout?.attrs?.rowButtons
                                ?.filter(rb => rb.attrs.actionInContextMenu === true)
                                .map((button: any, index: number) => (
                                  <SolidListViewRowButtonContextMenu
                                    key={index}
                                    button={button}
                                    params={params}
                                    selectedSolidViewData={selectedSolidViewData}
                                    solidListViewMetaData={solidListViewMetaData}
                                    handleCustomButtonClick={handleCustomButtonClick}
                                  />
                                ))}

                            </div>
                          </OverlayPanel>
                        </>
                      }
                    </>

                )}></Column>
              }
            </DataTable>
          </div>
        }
      </div>
      {process.env.NEXT_PUBLIC_ENABLE_SOLIDX_AI === 'true' && params.embeded !== true && (
        <div className={`chatter-section ${isOpenSolidXAiPanel === false ? 'collapsed' : ''}`} style={{ width: chatterWidth }}>
          {isOpenSolidXAiPanel && (
            <div
              style={{
                width: 5,
                cursor: 'col-resize',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                height: '100%',
                zIndex: 9,
              }}
              onMouseDown={() => setIsResizing(true)}
            />
          )}
          {isOpenSolidXAiPanel &&
            <Button
              icon="pi pi-angle-double-right"
              size="small"
              text
              className="chatter-collapse-btn"
              style={{ width: 30, height: 30, aspectRatio: '1/1' }}
              onClick={handleCloseSolidXAIPanel}
            />
          }

          {isOpenSolidXAiPanel === false ?
            <div className="flex flex-column gap-2 justify-content-center p-2">
              <div className="chatter-collapsed-content" onClick={handleOpenSolidXAIPanel}>
                <div className="flex gap-2"> <SolidXAIIcon /> SolidX AI </div>
              </div>
              <Button
                icon="pi pi-chevron-left"
                size="small"
                className="px-0"
                style={{ width: 30 }}
                onClick={handleOpenSolidXAIPanel}
              />
            </div>
            :
            <SolidXAIModule showHeader inListView />
          }
        </div>
      )}
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

      {
        listViewRowActionData &&
        <Dialog
          visible={listViewRowActionPopupState}
          modal
          onHide={closeListViewRowActionPopup}
        >
          <ListViewRowActionPopup context={listViewRowActionData}></ListViewRowActionPopup>
        </Dialog>
      }
      <Dialog header={`Delete ${params?.modelName}`} headerClassName="py-2" contentClassName="px-0 pb-0" visible={deleteEntity} style={{ width: '20vw' }} onHide={() => { if (!deleteEntity) return; setDeleteEntity(false); }}>
        <Divider className="m-0" />
        <div className="p-4">
          <p className="m-0 solid-primary-title" style={{ fontSize: 16 }}>
            {`Are you sure you want to delete this ${params?.modelName}?`}
          </p>
          {/* <p className="" style={{ color: 'var{--solid-grey-500}' }}>{selectedSolidViewData?.singularName}</p> */}
          <div className="flex align-items-center gap-2 mt-3">
            <Button label="Delete" size="small" onClick={() => { deleteSolidSingleEntiry(selectedSolidViewData?.id); setDeleteEntity(false); }} />
            <Button label="Cancel" size="small" onClick={() => setDeleteEntity(false)} outlined className='bg-primary-reverse' />
          </div>
        </div>
      </Dialog>
      {
        openLightbox &&
        <Lightbox
          open={openLightbox}
          plugins={[Counter, Download]}
          close={() => setOpenLightbox(false)}
          slides={lightboxUrls}
        />
      }
    </div >
  );
};