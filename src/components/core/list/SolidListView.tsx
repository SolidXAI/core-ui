import { forwardRef, useState, useEffect, useRef, useMemo, useImperativeHandle } from "react";
import { SolidDataTable as DataTable, DataTableStateEvent, Column } from "./SolidDataTable";
import qs from "qs";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "../../../redux/api/solidViewApi";
import { SolidListViewColumn } from "./SolidListViewColumn";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import { useLazyCheckIfPermissionExistsQuery } from "../../../redux/api/userApi";
import { permissionExpression } from "../../../helpers/permissions";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { ListViewRowActionPopup } from "./ListViewRowActionPopup";
import { showToast } from "../../../redux/features/toastSlice";
import CompactImage from '../../../resources/images/layout/images/compact.png';
import CozyImage from '../../../resources/images/layout/images/cozy.png';
import ComfortableImage from '../../../resources/images/layout/images/comfortable.png';
import { SolidLightbox } from "../../shad-cn-ui/SolidLightbox";
import type { SolidLightboxSlide } from "../../shad-cn-ui/SolidLightbox";
import { SolidListViewConfigure } from "./SolidListViewConfigure";
import { SolidEmptyListViewPlaceholder } from "./SolidEmptyListViewPlaceholder";
import { useHandleListCustomButtonClick } from "../../../components/common/useHandleListCustomButtonClick";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { SolidListViewHeaderButton } from "./SolidListViewHeaderButton";
import { useDispatch, useSelector } from "react-redux";
import styles from "./SolidListViewWrapper.module.css";
import { SolidBeforeListDataLoad, SolidListUiEventResponse, SolidLoadList } from "../../../types/solid-core";
import { getExtensionFunction } from "../../../helpers/registry";
import { useSession } from "../../../hooks/useSession";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
// import { SolidAiMainWrapper } from "../solid-ai/SolidAiMainWrapper"; // moved to SolidX Studio panel
import { showNavbar, toggleNavbar } from "../../../redux/features/navbarSlice";
import { normalizeSolidListTreeKanbanActionPath } from "../../../helpers/routePaths";
import { getMediaTypeFromUrl } from "../../../helpers/mediaType";
import { SolidListViewRowActionsMenu } from "./SolidListViewRowActionsMenu";
import { SolidHeaderRequestStatus } from "../../common/SolidHeaderRequestStatus";
import {
  SolidButton,
  SolidConfirmDialog,
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "../../shad-cn-ui";
import { FilterMatchMode } from "../filter/filterMatchMode";
import { LayoutGrid, Pencil, Plus, RefreshCw, RotateCcw, Search, SquarePen, Trash2 } from "lucide-react";
// import { ERROR_MESSAGES } from "../../../constants/error-messages";

const RETURN_OFFSET_PARAM = "listOffset";
const RETURN_LIMIT_PARAM = "listLimit";
const RETURN_SORT_FIELD_PARAM = "listSortField";
const RETURN_SORT_ORDER_PARAM = "listSortOrder";

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getFilterObjectFromLocalStorage = () => {
  const currentPageUrl = window.location.pathname; // Get the current page URL
  const encodedQueryString = localStorage.getItem(currentPageUrl); // Retrieve the encoded query string from local storage

  if (encodedQueryString) {
    try {
      const decodedQueryString = atob(encodedQueryString); // Base64 decode the string
      const parsedParams = JSON.parse(decodedQueryString); // Parse the decoded string into an object
      return parsedParams;
    } catch (error) {
      console.error(
        ERROR_MESSAGES.ERROR_DECODING,
        error
      );
    }
  }
};


export const getFilterObjectFromLocalStorageByUrl = (url: string) => {
  const currentPageUrl = url; // Get the current page URL
  const encodedQueryString = localStorage.getItem(currentPageUrl); // Retrieve the encoded query string from local storage

  if (encodedQueryString) {
    try {
      const decodedQueryString = atob(encodedQueryString); // Base64 decode the string
      const parsedParams = JSON.parse(decodedQueryString); // Parse the decoded string into an object
      return parsedParams;
    } catch (error) {
      console.error(
        ERROR_MESSAGES.ERROR_DECODING,
        error
      );
    }
  }
};

export const setFilterObjectToLocalStorage = (queryObject: any) => {
  if (queryObject) {
    const stringifiedObject = JSON.stringify(queryObject);
    // const stringifiedObject = qs.stringify(queryObject, { encodeValuesOnly: true, arrayFormat: "brackets" });
    const encodedQueryString = btoa(stringifiedObject); // Base64 encode the stringified object
    const currentPageUrl = window.location.pathname; // Get the current page URL
    localStorage.setItem(currentPageUrl, encodedQueryString); // Store in local storage with the URL as the key
    return encodedQueryString;
  }
  return null;
};


export const setFilterObjectToLocalStorageByUrl = (url: string, queryObject: any) => {
  if (queryObject) {
    const stringifiedObject = JSON.stringify(queryObject);
    // const stringifiedObject = qs.stringify(queryObject, { encodeValuesOnly: true, arrayFormat: "brackets" });
    const encodedQueryString = btoa(stringifiedObject); // Base64 encode the stringified object
    const currentPageUrl = url; // Get the current page URL
    localStorage.setItem(currentPageUrl, encodedQueryString); // Store in local storage with the URL as the key
    return encodedQueryString;
  }
  return null;
};

type SolidListViewParams = {
  moduleName: string;
  modelName: string;
  inlineCreate?: boolean;
  handleAddClickForEmbeddedView?: any;
  handleEditClickForEmbeddedView?: any;
  embeded?: boolean;
  embededFieldRelationType?: string;
  customLayout?: any;
  customFilter?: any;
  handleDeleteClick?: any;
};

export type SolidListViewHandle = {
  /**
   * Re-runs the list fetch using the current internal state
   * (filters, pagination, sorting, archived toggle, and populate config).
   * Use this after external side-effects that may have changed list data
   * but do not require changing list state first.
   */
  refresh: () => void;
  /**
   * Resets list filters to the default state and also clears the
   * global search UI state through the existing search element ref.
   * Use this for a full "Reset filters" action.
   */
  clearFilters: () => void;
  /**
   * Applies transformed filter predicates in the same shape used by
   * SolidGlobalSearchElement -> handleApplyCustomFilter.
   * Use this when external code wants to programmatically drive
   * search/custom/saved/predefined filters.
   * eg custom_filter_predicate : {$and: [{displayName: {$containsi: "test"}}]}
   */
  applyFilter: (filter: {
    custom_filter_predicate?: any;
    search_predicate?: any;
    saved_filter_predicate?: any;
    predefined_search_predicate?: any;
  }) => void;
  /**
   * Updates pagination state directly.
   * Use this when a caller needs to jump to a specific page window
   * or enforce a new page size.
   */
  setPagination: (nextFirst: number, nextRows: number) => void;
  /**
   * Updates sorting state and resets page offset to the first page.
   * Use this for programmatic sort controls to match DataTable behavior.
   */
  setSort: (nextSortField: string, nextSortOrder: 1 | -1 | 0) => void;
  /**
   * Toggles inclusion of archived/soft-deleted records.
   * Use this to switch between active-only and inclusive list views.
   */
  setShowArchived: (value: boolean) => void;
  /**
   * Returns a snapshot of current list state for orchestration/debugging.
   * Includes a cloned listData array to avoid accidental external mutation.
   */
  getState: () => {
    first: number;
    rows: number;
    sortField: string;
    sortOrder: 1 | -1 | 0;
    showArchived: boolean;
    filters: any;
    filterPredicates: any;
    listData: any[];
    totalRecords: number;
    loading: boolean;
  };
};

export const SolidListView = forwardRef<SolidListViewHandle, SolidListViewParams>((params, ref) => {
  const session = useSession();
  const user = session?.data?.user;
  const dispatch = useDispatch();
  const visibleNavbar = useSelector((state: any) => state.navbarState?.visibleNavbar);

  const pathname = usePathname();
  const solidGlobalSearchElementRef = useRef<any>();

  const router = useRouter();
  const searchParams = useSearchParams();
  const localeName = searchParams.get("locale");


  const [solidListViewMetaData, setSolidListViewMetaData] = useState<any>(null);
  const [solidListViewLayout, setSolidListViewLayout] = useState<any>(null);
  const [isDraftPublishWorkflowEnabled, setIsDraftPublishWorkflowEnabled] = useState(false);

  // Filter query realted states
  const [filters, setFilters] = useState<any>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(solidListViewLayout?.attrs?.defaultPageSize ? solidListViewLayout?.attrs?.defaultPageSize : 10);
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<1 | -1 | 0>(-1);
  const [toPopulate, setToPopulate] = useState<string[]>([]);
  const [toPopulateMedia, setToPopulateMedia] = useState<string[]>([]);


  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);


  // All list view state.
  const [listViewData, setListViewData] = useState<any[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [selectedRecoverRecords, setSelectedRecoverRecords] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isRecoverDialogVisible, setRecoverDialogVisible] = useState(false);

  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();

  const [createActionQueryParams, setCreateActionQueryParams] = useState<Record<string, string>>({});
  const [editActionQueryParams, setEditActionQueryParams] = useState<Record<string, string>>({});

  const [showArchived, setShowArchived] = useState(false);

  const [queryDataLoaded, setQueryDataLoaded] = useState(false);
  const [filterPredicates, setFilterPredicates] = useState<any>(null);
  const [showSaveFilterPopup, setShowSaveFilterPopup] = useState<boolean>(false);
  const [showGlobalSearchElement, setShowGlobalSearchElement] = useState(false);
  const isInitialListHydrationRef = useRef(true);

  const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();

  const handleCustomButtonClick = useHandleListCustomButtonClick();

  const editBaseUrl = useMemo(
    () => normalizeSolidListTreeKanbanActionPath(pathname, editButtonUrl || "form"),
    [editButtonUrl, pathname]
  );

  const rememberListReturnState = () => {
    if (typeof window === "undefined") return;
    try {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set(RETURN_OFFSET_PARAM, String(first));
      returnUrl.searchParams.set(RETURN_LIMIT_PARAM, String(rows));
      if (sortField && (sortOrder === 1 || sortOrder === -1)) {
        returnUrl.searchParams.set(RETURN_SORT_FIELD_PARAM, sortField);
        returnUrl.searchParams.set(RETURN_SORT_ORDER_PARAM, String(sortOrder));
      } else {
        returnUrl.searchParams.delete(RETURN_SORT_FIELD_PARAM);
        returnUrl.searchParams.delete(RETURN_SORT_ORDER_PARAM);
      }

      const currentQueryObject = {
        offset: first,
        limit: rows,
        filters: latestFiltersRef.current ?? { $and: [] },
        populate: toPopulate,
        populateMedia: toPopulateMedia,
        sort:
          sortField && (sortOrder === 1 || sortOrder === -1)
            ? [`${sortField}:${sortOrder === 1 ? "asc" : "desc"}`]
            : ["id:desc"],
        custom_filter_predicate: latestFilterPredicatesRef.current?.custom_filter_predicate || null,
        search_predicate: latestFilterPredicatesRef.current?.search_predicate || null,
        saved_filter_predicate: latestFilterPredicatesRef.current?.saved_filter_predicate || null,
        predefined_search_predicate: latestFilterPredicatesRef.current?.predefined_search_predicate || null,
      };
      setFilterObjectToLocalStorage(currentQueryObject);
      sessionStorage.setItem("fromView", "list");
      sessionStorage.setItem("fromViewUrl", `${returnUrl.pathname}${returnUrl.search}`);
    } catch (e) {
      // ignore storage errors
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      if (params.modelName) {
        const permissionNames = [
          permissionExpression(params.modelName, 'create'),
          permissionExpression(params.modelName, 'delete'),
          permissionExpression(params.modelName, 'update'),
          permissionExpression(params.modelName, 'deleteMany'),
          permissionExpression(params.modelName, 'findOne'),
          permissionExpression(params.modelName, 'findMany'),
          permissionExpression(params.modelName, 'insertMany'),
          permissionExpression('importTransaction', 'create'),
          permissionExpression('exportTransaction', 'create'),
          permissionExpression('userViewMetadata', 'create'),
          permissionExpression('savedFilters', 'create')
        ];
        const queryData = {
          permissionNames: permissionNames,
        };
        const queryString = qs.stringify(queryData, {
          encodeValuesOnly: true,
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
    useRecoverSolidEntityMutation,
  } = entityApi;

  const menuItemId = searchParams.get("menuItemId");
  const menuItemName = searchParams.get("menuItemName");
  const actionId = searchParams.get("actionId");
  const actionName = searchParams.get("actionName");
  // Get the list view layout & metadata first.
  const listViewMetaDataQs = qs.stringify(
    {
      modelName: params.modelName,
      moduleName: params.moduleName,
      viewType: "list",
      menuItemId: menuItemId,
      menuItemName: menuItemName,
      actionId: actionId,
      actionName: actionName,
    },
    {
      encodeValuesOnly: true,
    }
  );

  const {
    data: solidListViewInitialMetaData,
    error: solidListViewMetaDataError,
    isLoading: solidListViewMetaDataIsLoading,
    isError: solidListViewMetaDataIsError,
    refetch,
  } = useGetSolidViewLayoutQuery(listViewMetaDataQs);

  const initialFilterMethod = () => {
    const solidView = solidListViewMetaData?.data?.solidView;
    const solidFieldsMetadata =
      solidListViewMetaData?.data?.solidFieldsMetadata;

    const initialFilters: any = {};
    const toPopulate: string[] = [];
    const toPopulateMedia: string[] = [];
    const currentLayout = params.customLayout ? params.customLayout : solidView?.layout;
    for (let i = 0; i < currentLayout?.children.length; i++) {
      const column = currentLayout?.children[i];
      const fieldMetadata = solidFieldsMetadata?.[column.attrs.name];
      if (!fieldMetadata?.type) {
        showFieldError(ERROR_MESSAGES.FIELD_NOT_IN_METADATA(column.attrs.label));
        // return;
      }
      if (fieldMetadata) {
        // Form the initial filters after iterating over the columns and field metadata.
        if (
          ["int", "bigint", "float", "decimal"].includes(fieldMetadata?.type)
        ) {
          // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
          initialFilters[column.attrs.name] = {
            value: null,
            matchMode: FilterMatchMode.EQUALS,
          };
        } else if (
          ["date", "datetime", "time", "boolean"].includes(fieldMetadata?.type)
        ) {
          // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
          initialFilters[column.attrs.name] = {
            value: null,
            matchMode: FilterMatchMode.EQUALS,
          };
        } else if (
          ["relation", "selectionStatic", "selectionDynamic"].includes(
            fieldMetadata?.type
          )
        ) {
          initialFilters[column.attrs.name] = {
            value: null,
            matchMode: FilterMatchMode.IN,
          };
        } else {
          // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
          initialFilters[column.attrs.name] = {
            value: null,
            matchMode: FilterMatchMode.STARTS_WITH,
          };
        }

        if (column.attrs.name === "id") {
          initialFilters[column.attrs.name] = {
            value: null,
            matchMode: FilterMatchMode.IN,
          };
        }

        // Form the "toPopulate" array.
        if (fieldMetadata.type === "relation" && fieldMetadata?.relationType === 'many-to-one') {
          if (!toPopulate.includes(fieldMetadata.name)) {
            toPopulate.push(fieldMetadata.name);
          }
        }
        if (
          fieldMetadata.type === "mediaSingle" ||
          fieldMetadata.type === "mediaMultiple"
        ) {
          if (!toPopulateMedia.includes(fieldMetadata.name)) {
            toPopulateMedia.push(fieldMetadata.name);
          }
        }
      }
    }
    const populate = toPopulate;
    const populateMedia = toPopulateMedia;
    const rows = currentLayout?.attrs?.defaultPageSize ?? 25;
    const sortField = "id";
    const sortOrder: 1 | -1 = -1;
    return { sortField, sortOrder, rows, populate, populateMedia };
  };



  // Set the initial filter state based on the metadata.
  useEffect(() => {
    // refetch();
    if (solidListViewInitialMetaData) {
      if (params.customLayout) {
        setSolidListViewLayout(params.customLayout);
      } else {
        setSolidListViewLayout(solidListViewInitialMetaData?.data.solidView.layout);
      }
      setSolidListViewMetaData(solidListViewInitialMetaData);
      setIsDraftPublishWorkflowEnabled(solidListViewInitialMetaData?.data?.solidView?.model?.draftPublishWorkflow === true);
    }
  }, [solidListViewInitialMetaData]);


  // set layout and actions for create and edit buttons and view modes
  useEffect(() => {
    if (solidListViewLayout) {
      const listLayoutAttrs = solidListViewLayout.attrs;
      const createActionUrl = listLayoutAttrs?.createAction && listLayoutAttrs?.createAction?.type === "custom" ? listLayoutAttrs?.createAction?.customComponent : "form/new";
      const editActionUrl = listLayoutAttrs?.editAction && listLayoutAttrs?.editAction?.type === "custom" ? listLayoutAttrs?.editAction?.customComponent : "form";

      if (listLayoutAttrs?.createAction) {
        setCreateActionQueryParams({
          actionName: listLayoutAttrs.createAction.name,
          actionType: listLayoutAttrs.createAction.type,
          actionContext: listLayoutAttrs.createAction.context,
        });
      }
      if (listLayoutAttrs?.editAction) {
        setEditActionQueryParams({
          actionName: listLayoutAttrs.editAction.name,
          actionType: listLayoutAttrs.editAction.type,
          actionContext: listLayoutAttrs.editAction.context,
        });
      }

      // const viewModes = listLayoutAttrs?.allowedViews && listLayoutAttrs?.allowedViews.length > 0 && listLayoutAttrs?.allowedViews.map((view: any) => { return { label: capitalize(view), value: view }; });
      setViewModes(solidListViewInitialMetaData?.data?.viewModes);
      if (createActionUrl) {
        setCreateButtonUrl(createActionUrl);
      }
      if (editActionUrl) {
        setEditButtonUrl(editActionUrl);
      }
    }
  }, [solidListViewLayout]);



  const sizeOptions = [
    { label: "Compact", value: "small", image: CompactImage },
    { label: "Cozy", value: "normal", image: CozyImage },
    { label: "Comfortable", value: "large", image: ComfortableImage },
  ];

  // const viewModes = [
  //   { label: 'List ', value: 'list', image: ListImage },
  //   { label: 'Kanban', value: 'kanban', image: KanbanImage },
  // ]

  const [size, setSize] = useState<string | any>(sizeOptions[1].value);
  const [viewModes, setViewModes] = useState<any>([]);

  // Custom Row Action
  const [listViewRowActionPopupState, setListViewRowActionPopupState] = useState(false);
  const [listViewRowActionData, setListRowActionData] = useState<any>();

  // Get the list view data.
  const [triggerGetSolidEntities, { data: solidEntityListViewData, isLoading, error },] = useLazyGetSolidEntitiesQuery();

  const [
    triggerRecoverSolidEntitiesById,
    {
      data: recoverByIdData,
      isLoading: recoverByIdIsLoading,
      error: recoverByIdError,
      isError: recoverByIdIsError,
      isSuccess: recoverByIdIsSuccess,
    },
  ] = useLazyRecoverSolidEntityByIdQuery();

  const [
    triggerRecoverSolidEntities,
    {
      data: recoverByData,
      isLoading: recoverByIsLoading,
      error: recoverError,
      isError: recoverIsError,
      isSuccess: recoverByIsSuccess,
    },
  ] = useRecoverSolidEntityMutation();

  // After data is fetched populate the list view state so as to be able to render the data.
  useEffect(() => {
    if (solidEntityListViewData) {
      setLoading(true);
      const cleanedRecords = solidEntityListViewData.records.map((record: any) => {
        const newRecord = { ...record };

        Object.entries(newRecord).forEach(([key, value]) => {
          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) {
                newRecord[key] = parsed.join(", ");
              }
            } catch {
              // If not valid JSON array, optionally strip brackets/quotes
              if (/^\[.*\]$/.test(value)) {
                newRecord[key] = value.replace(/[\[\]"]+/g, "");
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
      isInitialListHydrationRef.current = false;
    }
  }, [solidEntityListViewData]);

  const [
    deleteSolidSingleEntiry,
    { isSuccess: isDeleteSolidSingleEntitySuccess },
  ] = useDeleteSolidEntityMutation();

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
    setQueryDataLoaded(false)
    if (solidListViewMetaData && solidListViewLayout) {
      const queryObject = getFilterObjectFromLocalStorage();
      const offsetFromUrl = searchParams.get(RETURN_OFFSET_PARAM);
      const limitFromUrl = searchParams.get(RETURN_LIMIT_PARAM);
      const sortFieldFromUrl = searchParams.get(RETURN_SORT_FIELD_PARAM);
      const sortOrderFromUrl = searchParams.get(RETURN_SORT_ORDER_PARAM);
      const hasPaginationFromUrl = offsetFromUrl !== null || limitFromUrl !== null;
      const hasSortFromUrl = sortFieldFromUrl !== null && sortOrderFromUrl !== null;

      if (queryObject || hasPaginationFromUrl || hasSortFromUrl) {
        const normalizedOffset = hasPaginationFromUrl
          ? Number(offsetFromUrl ?? queryObject?.offset ?? 0)
          : Number(queryObject?.offset ?? 0);
        const normalizedLimit = hasPaginationFromUrl
          ? Number(limitFromUrl ?? queryObject?.limit ?? 25)
          : Number(queryObject?.limit ?? 25);

        const queryData = {
          offset: normalizedOffset,
          limit: normalizedLimit,
          populate: queryObject?.populate,
          populateMedia: queryObject?.populateMedia,
          sort: queryObject?.sort,
          filters: queryObject?.filters,
        };

        setRows(Number(queryData.limit));
        setFirst(Number(queryData?.offset));
        let restoredSortField = "id";
        let restoredSortOrder: 1 | -1 | 0 = -1;
        if (hasSortFromUrl) {
          restoredSortField = String(sortFieldFromUrl);
          restoredSortOrder = sortOrderFromUrl === "1" ? 1 : sortOrderFromUrl === "-1" ? -1 : -1;
        } else if (Array.isArray(queryData.sort) && queryData.sort.length > 0) {
          const [field, order] = String(queryData.sort[0]).split(":");
          restoredSortField = field || "id";
          restoredSortOrder = order === "asc" ? 1 : -1;
        } else if (queryObject?.sortField) {
          restoredSortField = String(queryObject.sortField);
          restoredSortOrder = queryObject.sortOrder === 1 || queryObject.sortOrder === -1 ? queryObject.sortOrder : -1;
        }
        setSortField(restoredSortField);
        setSortOrder(restoredSortOrder);
        const { populate, populateMedia } = initialFilterMethod();
        setToPopulate(populate);
        setToPopulateMedia(populateMedia);
      } else {
        const { sortField, sortOrder, rows, populate, populateMedia } = initialFilterMethod();
        setRows(rows);
        setSortField(sortField);
        setSortOrder(sortOrder);
        setToPopulate(populate);
        setToPopulateMedia(populateMedia);
        setFirst(0);
      }
      //below line was added to handle state stale issue when we converted boilerplate to vite 
      //since now we dont need it becuase our component is remounted on every router change
      if (params.embeded === true || solidListViewLayout?.attrs?.enableGlobalSearch === false) {
        setFilters(params.customFilter || { $and: [] });
        setFilterPredicates(null);
      }
      setSelectedRecords([]);
      setSelectedRecoverRecords([]);
      setQueryDataLoaded(true);
    }
  }, [
    isDeleteSolidEntitiesSucess,
    isDeleteSolidSingleEntitySuccess,
    recoverByIdIsSuccess,
    recoverByIsSuccess,
    solidListViewMetaData,
    solidListViewLayout
  ]);

  useEffect(() => {
    if (solidListViewMetaData && solidListViewMetaData?.data && !loading) {
      const handleDynamicFunction = async () => {
        const dynamicHeader = solidListViewMetaData?.data?.solidView?.layout?.onListLoad;
        let dynamicExtensionFunction = null;
        let listViewRecords = listViewData;
        let listLayout = solidListViewMetaData?.data?.solidView?.layout;
        if (params.customLayout) {
          listLayout = params.customLayout;
        }
        const event: SolidLoadList = {
          fieldsMetadata: solidListViewMetaData?.data?.solidFieldsMetadata,
          listData: listViewData,
          totalRecords: totalRecords,
          type: "onListLoad",
          viewMetadata: solidListViewMetaData?.data?.solidView,
          listViewLayout: listLayout,
          queryParams: {
            menuItemId: menuItemId,
            menuItemName: menuItemName,
            actionId: actionId,
            actionName: actionName,
          },
          user: user,
          session: session.data,
          params: params
        };

        if (dynamicHeader) {
          dynamicExtensionFunction = getExtensionFunction(dynamicHeader);
          if (dynamicExtensionFunction) {
            const updatedListData: SolidListUiEventResponse = await dynamicExtensionFunction(event);

            if (updatedListData && updatedListData?.dataChanged && updatedListData?.newListData) {
              listViewRecords = updatedListData.newListData;
            }
            if (updatedListData && updatedListData?.layoutChanged && updatedListData?.newLayout) {
              listLayout = updatedListData.newLayout;
            }
          }
          if (listViewRecords) {
            setListViewData(listViewRecords);
          }
          if (listLayout) {
            setSolidListViewLayout(listLayout);
          }
        }
      };
      handleDynamicFunction();
    }
  }, [solidListViewMetaData, loading]);



  // Create a ref that always has the latest filters
  const latestFiltersRef = useRef<any>(filters);
  const latestFilterPredicatesRef = useRef<any>(filterPredicates);
  const latestSortFieldRef = useRef<string>(sortField);
  const latestSortOrderRef = useRef<1 | -1 | 0>(sortOrder);

  useEffect(() => {
    latestSortFieldRef.current = sortField;
  }, [sortField]);

  useEffect(() => {
    latestSortOrderRef.current = sortOrder;
  }, [sortOrder]);

  // Keep refs in sync
  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    latestFilterPredicatesRef.current = filterPredicates;
  }, [filterPredicates]);


  useEffect(() => {
    if (queryDataLoaded && filters && (filterPredicates || params.embeded == true)) {
      setQueryString();
    }
  }, [
    first,
    rows,
    sortField,
    sortOrder,
    showArchived,
    toPopulate,
    toPopulateMedia,
    queryDataLoaded,
    filters,
    filterPredicates
  ]);

  // Handle pagination event.
  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  // Handle sort event.
  // const onSort = (event: DataTableStateEvent) => {
  //   const { sortField, sortOrder } = event;
  //   const validSortOrder = sortOrder === 1 || sortOrder === -1 ? sortOrder : 0;
  //   setSortField(sortField);
  //   setSortOrder(validSortOrder);
  //   setFirst(0);

  // };

  const onSort = (event: DataTableStateEvent) => {
    const nextSortField = event.sortField ? String(event.sortField) : "";
    const nextSortOrder = event.sortOrder === 1 || event.sortOrder === -1 ? event.sortOrder : 0;
    setSortField(nextSortField);
    setSortOrder(nextSortOrder);
    setFirst(0);
  };

  // handle change in the records which are currently selected...
  const onSelectionChange = (event: any) => {
    const value = event.value;
    const activeRecords = value.filter(
      (record: any) => record.deletedAt === null
    );
    const deletedRecords = value.filter(
      (record: any) => record.deletedAt !== null
    );

    setSelectedRecords(activeRecords);
    setSelectedRecoverRecords(deletedRecords);
  };



  const setQueryString = async () => {
    const solidFieldsMetadata =
      solidListViewMetaData?.data?.solidFieldsMetadata;

    let queryData: any = {
      offset: first,
      limit: rows,
      filters: latestFiltersRef.current ?? latestFiltersRef.current,
      populate: toPopulate,
      populateMedia: toPopulateMedia,
      locale: localeName ? localeName : "en",
    };



    const currentSortField = latestSortFieldRef.current;
    const currentSortOrder = latestSortOrderRef.current;
    if (currentSortField && (currentSortOrder === 1 || currentSortOrder === -1)) {
      const meta = solidFieldsMetadata?.[currentSortField];
      let resolvedField = currentSortField;
      if (meta?.type === "relation" && meta?.relationType === "many-to-one") {
        resolvedField = `${currentSortField}.${meta?.relationModel?.userKeyField?.name}`;
      }
      queryData.sort = [`${resolvedField}:${currentSortOrder === 1 ? "asc" : "desc"}`];
    } else {
      queryData.sort = [`id:desc`];
    }


    if (showArchived) {
      queryData.showSoftDeleted = "inclusive";
    }

    //  SolidBeforeListDataLoad Event that allows filter modification just before api call 
    const dynamicHeader = solidListViewMetaData?.data?.solidView?.layout?.onBeforeListDataLoad;
    let dynamicExtensionFunction = null;
    const event: SolidBeforeListDataLoad = {
      type: "onBeforeListDataLoad",
      fieldsMetadata: solidListViewMetaData?.data?.solidFieldsMetadata,
      viewMetadata: solidListViewMetaData?.data?.solidView,
      listViewLayout: solidListViewMetaData?.data.solidView.layout,
      filter: structuredClone(queryData),
      queryParams: {
        menuItemId: menuItemId,
        menuItemName: menuItemName,
        actionId: actionId,
        actionName: actionName,
      },
      user: user,
      session: session.data,
      params: params
    };

    if (dynamicHeader) {
      dynamicExtensionFunction = getExtensionFunction(dynamicHeader);
      if (dynamicExtensionFunction) {
        try {
          const updatedListData: SolidListUiEventResponse = await dynamicExtensionFunction(event);
          if (updatedListData && updatedListData?.filterApplied && updatedListData?.newFilter) {
            queryData = updatedListData?.newFilter;
          }
        } catch (err) {
          console.error("Error executing onBeforeListDataLoad extension:", err);
        }
      }
    }

    const queryString = qs.stringify(queryData, { encodeValuesOnly: true });

    if (latestFilterPredicatesRef.current && latestFilterPredicatesRef.current.persistFilter) {
      const fileterTobeStored = structuredClone(queryData);
      delete fileterTobeStored.filters;
      fileterTobeStored.custom_filter_predicate = latestFilterPredicatesRef.current.custom_filter_predicate || null;
      fileterTobeStored.search_predicate = latestFilterPredicatesRef.current.search_predicate || null;
      fileterTobeStored.saved_filter_predicate = latestFilterPredicatesRef.current.saved_filter_predicate || null;
      fileterTobeStored.predefined_search_predicate = latestFilterPredicatesRef.current.predefined_search_predicate || null;
      setFilterObjectToLocalStorage(fileterTobeStored);
    }
    triggerGetSolidEntities(queryString);
  };

  // handle filter...
  const handleApplyCustomFilter = (filterPredicates: any, persistFilter: boolean = false) => {
    // we assume that the customfilter will always have $and array
    const queryfilter = structuredClone(params.customFilter) || { $and: [] }

    if (filterPredicates.custom_filter_predicate) {
      queryfilter.$and.push(filterPredicates.custom_filter_predicate);
    }
    if (filterPredicates.search_predicate) {
      queryfilter.$and.push(filterPredicates.search_predicate);
    }
    if (filterPredicates.saved_filter_predicate) {
      queryfilter.$and.push(filterPredicates.saved_filter_predicate);
    }
    if (filterPredicates.predefined_search_predicate) {
      queryfilter.$and.push(filterPredicates.predefined_search_predicate);
    }
    const updatedFilter = queryfilter;

    // Update refs IMMEDIATELY (synchronously)
    latestFiltersRef.current = updatedFilter;
    const updatedFilterPredicates = structuredClone(filterPredicates);
    updatedFilterPredicates.persistFilter = persistFilter;
    latestFilterPredicatesRef.current = updatedFilterPredicates;

    // Then update state
    setFilters(updatedFilter);
    setFilterPredicates(updatedFilterPredicates);
    // During initial hydration (e.g. back navigation restore), avoid snapping to page 1.
    // After the first list payload is loaded, regular filter behavior resets to page 1.
    if (!isInitialListHydrationRef.current) {
      setFirst(0);
    }
    // Force synchronous state updates
  };

  // clear Filter
  const clearFilter = () => {
    if (solidListViewMetaData) {
      const { sortField, sortOrder, rows, populate, populateMedia } = initialFilterMethod();
      setRows(rows);
      setSortField(sortField);
      setSortOrder(sortOrder);
      setToPopulate(populate);
      setToPopulateMedia(populateMedia);
    }
    latestFiltersRef.current = {
      $and: []
    };


    setFilters(params.customFilter || { $and: [] })
    solidGlobalSearchElementRef?.current.clearFilter();
  };

  const cloneListData = () => {
    if (typeof structuredClone === "function") {
      return structuredClone(listViewData);
    }
    return JSON.parse(JSON.stringify(listViewData));
  };

  useImperativeHandle(ref, () => ({
    refresh: () => {
      void setQueryString();
    },
    clearFilters: () => {
      clearFilter();
    },
    applyFilter: (filter) => {
      handleApplyCustomFilter(filter);
    },
    setPagination: (nextFirst, nextRows) => {
      setFirst(nextFirst);
      setRows(nextRows);
    },
    setSort: (nextSortField, nextSortOrder) => {
      setSortField(nextSortField);
      setSortOrder(nextSortOrder);
      setFirst(0);
    },
    setShowArchived: (value) => {
      setShowArchived(value);
    },
    getState: () => ({
      first,
      rows,
      sortField,
      sortOrder,
      showArchived,
      filters,
      filterPredicates,
      listData: cloneListData(),
      totalRecords,
      loading,
    }),
  }), [
    first,
    rows,
    sortField,
    sortOrder,
    showArchived,
    filters,
    filterPredicates,
    totalRecords,
    loading,
    listViewData,
  ]);

  const [selectedSolidViewData, setSelectedSolidViewData] = useState<any>();
  const selectedDataRef = useRef<any>();
  const [deleteEntity, setDeleteEntity] = useState(false);

  // Recover functions
  const recoverById = (id: any) => {
    triggerRecoverSolidEntitiesById(id);
  };

  const recoverAll = () => {
    let recoverList: any = [];
    selectedRecoverRecords.forEach((element: any) => {
      recoverList.push(element.id);
    });
    triggerRecoverSolidEntities(recoverList);
    setRecoverDialogVisible(false);
  };

  useEffect(() => {
    if (recoverByIdIsSuccess && recoverByIdData) {
      dispatch(showToast({ severity: "success", summary: "Success", detail: recoverByIdData.data.message, life: 3000 }));
      return;
    }
    if (recoverByIdIsError && recoverByIdError) {
      showError(recoverByIdError);
      return;
    }

    if (recoverIsError && recoverError) {
      showError(recoverError);
    }
  }, [recoverByIdIsSuccess, recoverByIdData, recoverByIdIsError, recoverByIdError, recoverIsError, recoverError]);

  const showError = async (error: any) => {
    const errorMessages = error?.data?.message;
    const messages = Array.isArray(errorMessages)
      ? errorMessages
      : errorMessages
        ? [errorMessages]
        : [];
    if (messages.length > 0) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.SEND_REPORT, detail: messages.join(', ') }));
    }
  };

  const showFieldError = async (error: any) => {
    if (error) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.SEND_REPORT, detail: String(error), life: 3000 }));
    }
  };

  // handle bulk deletion
  const deleteBulk = () => {
    let deleteList: any = [];
    selectedRecords.forEach((element: any) => {
      deleteList.push(element.id);
    });
    deleteManySolidEntities(deleteList)
      .unwrap()
      .then(() => {
        dispatch(showToast({ severity: 'success', summary: 'Deleted', detail: ERROR_MESSAGES.RECORD_DELETE, life: 3000 }));
        setDialogVisible(false);
      })
      .catch((error) => {
        dispatch(showToast({ severity: 'error', summary: 'Delete Failed', detail: error?.data?.message, life: 4000 }));
      });
  };

  // handle closing of the delete dialog...
  const onDeleteClose = () => {
    setDialogVisible(false);
    setSelectedRecords([]);
    setSelectedRecoverRecords([]);
  };

  const entityDisplayName =
    solidListViewMetaData?.data?.solidView?.model?.displayName || params?.modelName;

  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxUrls, setLightboxUrls] = useState<any[]>([]);

  // Render columns dynamically based on metadata
  const renderColumnsDynamically = (solidListViewMetaData: any, solidListViewLayout: any) => {
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
    const currentLayout = solidListViewLayout;

    return currentLayout.children?.map((column: any) => {
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];
      if (!fieldMetadata) {
        return;
      }
      const visibleToRole = column?.attrs?.roles || [];

      if (visibleToRole.length > 0) {
        if (hasAnyRole(user?.roles, visibleToRole)) {
          return SolidListViewColumn({
            solidListViewMetaData,
            fieldMetadata,
            column,
            setLightboxUrls,
            setOpenLightbox,
          });
        } else {
          return null;
        }
      } else {
        return SolidListViewColumn({
          solidListViewMetaData,
          fieldMetadata,
          column,
          setLightboxUrls,
          setOpenLightbox,
        });
      }
    });
  };

  //Note -  Custom Row Action Popup
  const closeListViewRowActionPopup = () => {
    setListViewRowActionPopupState(false);
  };

  // if (loading || isLoading) {
  //   return <SolidListViewShimmerLoading />;
  // }

  const viewMode = searchParams.get("viewMode");

  // if (
  //   (loading || isLoading) && params.embeded == false && viewMode !== "view"
  // ) {
  //   return <SolidListViewShimmerLoading />;
  // }

  const hasMeaningfulFilterValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    if (Array.isArray(value)) return value.some((item) => hasMeaningfulFilterValue(item));
    if (typeof value === "object") return hasAppliedFilters(value);
    return false;
  };

  const hasAppliedFilters = (filterObject: any): boolean => {
    if (!filterObject || typeof filterObject !== "object") return false;

    if (Array.isArray(filterObject)) {
      return filterObject.some((item) => hasAppliedFilters(item) || hasMeaningfulFilterValue(item));
    }

    return Object.entries(filterObject).some(([key, val]) => {
      if (key === "matchMode" || key === "operator") return false;
      if (key === "value") return hasMeaningfulFilterValue(val);
      if ((key === "$and" || key === "$or") && Array.isArray(val)) {
        return val.some((item) => hasAppliedFilters(item) || hasMeaningfulFilterValue(item));
      }
      if (typeof val === "object") return hasAppliedFilters(val);
      return hasMeaningfulFilterValue(val);
    });
  };

  const hasFilterPredicatesApplied =
    hasAppliedFilters(filterPredicates?.custom_filter_predicate) ||
    hasAppliedFilters(filterPredicates?.search_predicate) ||
    hasAppliedFilters(filterPredicates?.saved_filter_predicate) ||
    hasAppliedFilters(filterPredicates?.predefined_search_predicate);

  const hasAppliedFilterValues = hasAppliedFilters(filters);

  const isListViewEmptyWithoutFilters =
    !loading &&
    !isLoading &&
    listViewData.length === 0 &&
    !hasAppliedFilterValues &&
    !hasFilterPredicatesApplied;

  const headerRequestStatusLabel =
    isSolidEntitiesDeleted
      ? "Deleting..."
      : recoverByIdIsLoading || recoverByIsLoading
        ? "Recovering..."
        : loading || isLoading || solidListViewMetaDataIsLoading || !queryDataLoaded
          ? "Loading..."
          : null;

  const showListBodyLoadingPlaceholder =
    (loading || isLoading || solidListViewMetaDataIsLoading || !queryDataLoaded) &&
    listViewData.length === 0 &&
    params.embeded === false &&
    viewMode !== "view";

  // useEffect(() => {
  //   console.log("[SolidListView] Re-rendering list view with empty-state inputs:", {
  //     loading,
  //     isLoading,
  //     listViewDataLength: listViewData.length,
  //     hasAppliedFilterValues,
  //     hasFilterPredicatesApplied,
  //     isListViewEmptyWithoutFilters,
  //     viewMode,
  //     filters,
  //     filterPredicates,
  //   });
  // }, [
  //   loading,
  //   isLoading,
  //   listViewData.length,
  //   hasAppliedFilterValues,
  //   hasFilterPredicatesApplied,
  //   isListViewEmptyWithoutFilters,
  //   viewMode,
  //   filters,
  //   filterPredicates,
  // ]);

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
    setQueryString();
  };

  const handleDeleteEntity = async () => {
    try {
      if (!selectedSolidViewData?.id) {
        throw new Error(ERROR_MESSAGES.NO_ENTITY_SELECTED);
      }

      const response: any = await deleteSolidSingleEntiry(selectedSolidViewData.id);

      if (response?.data?.statusCode === 200) {
        setDeleteEntity(false);
        dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.DELETED, detail: ERROR_MESSAGES.ENTITY_DELETE, life: 3000 }));
      } else {
        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.DELETE_FAIELD, detail: response?.error?.data?.error }));
      }
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.DELETE_FAIELD, detail: ERROR_MESSAGES.SOMETHING_WRONG }));
    }
  };

  const lightboxSlides: SolidLightboxSlide[] = Array.isArray(lightboxUrls)
    ? lightboxUrls
      .map((item: any) => {
        const src = item?.src || item?.downloadUrl || "";
        if (!src) {
          return null;
        }
        const mediaType = getMediaTypeFromUrl(src);
        const slide: SolidLightboxSlide = { src };
        if (mediaType !== "image") {
          slide.type = mediaType;
        }
        return slide;
      })
      .filter((slide): slide is SolidLightboxSlide => !!slide)
    : [];

  const hasEditInContextMenu = actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
    solidListViewLayout?.attrs?.edit !== false &&
    solidListViewLayout?.attrs?.showDefaultEditButton !== false &&
    solidListViewLayout?.attrs?.showRowEditInContextMenu !== false &&
    !(isDraftPublishWorkflowEnabled && selectedDataRef.current?.publishedAt);

  const hasDeleteInContextMenu = actionsAllowed.includes(`${permissionExpression(params.modelName, 'delete')}`) &&
    solidListViewLayout?.attrs?.delete !== false &&
    solidListViewLayout?.attrs?.showRowDeleteInContextMenu !== false &&
    !(isDraftPublishWorkflowEnabled && selectedDataRef.current?.publishedAt);

  const hasCustomContextMenuButtons =
    solidListViewLayout?.attrs?.rowButtons?.some(
      (rb: any) => rb?.attrs?.actionInContextMenu === true
    );

  const hasAnyContextMenuActions =
    hasEditInContextMenu || hasDeleteInContextMenu || hasCustomContextMenuButtons;

  const toggleBothSidebars = () => {
    if (visibleNavbar) {
      dispatch(toggleNavbar());   // close both
    } else {
      dispatch(showNavbar());     // open both
    }
  };
  return (
    <div className="page-parent-wrapper solid-list-page-wrapper flex h-full min-h-0 overflow-hidden">
      <div className={`solid-list-content h-full flex flex-column flex-grow-1 ${styles.ListContentWrapper}`}>
        <div className="solid-list-surface flex flex-column flex-1 min-h-0">
          {solidListViewInitialMetaData &&
            <div className="page-header solid-list-toolbar flex-column lg:flex-row">
              {/* <div> */}
              <div className="flex justify-content-between w-full">
                <div className="flex gap-3 align-items-center w-full solid-list-toolbar-left">
                  <div className='flex align-items-center gap-2'>
                    {params.embeded !== true &&
                      <div className="apps-icon block md:hidden cursor-pointer" onClick={toggleBothSidebars}>
                        <LayoutGrid size={18} />
                      </div>
                    }
                    <p className="m-0 view-title solid-text-wrapper">
                      {solidListViewMetaData?.data?.solidView?.action?.displayName || solidListViewMetaData?.data?.solidView?.displayName}
                    </p>
                  </div>
                  {params.embeded === false && (
                    <div className="hidden lg:flex">
                      {/* Keep global search mounted for now because list bootstrap/filter hydration still flows through this element. */}
                      <SolidGlobalSearchElement
                        key={params.modelName}
                        viewType="list"
                        showSaveFilterPopup={showSaveFilterPopup}
                        setShowSaveFilterPopup={setShowSaveFilterPopup}
                        ref={solidGlobalSearchElementRef}
                        viewData={solidListViewMetaData}
                        handleApplyCustomFilter={handleApplyCustomFilter}
                        filterPredicates={filterPredicates}
                      >
                      </SolidGlobalSearchElement>
                    </div>
                  )}

                </div>
                <div className="flex align-items-center solid-header-buttons-wrapper solid-list-toolbar-actions">
                  <SolidHeaderRequestStatus label={headerRequestStatusLabel} />
                  {params.embeded === false && (
                    <div className="flex lg:hidden">
                      <SolidButton
                        type="button"
                        size="small"
                        variant="outline"
                        className="solid-icon-button"
                        onClick={() => setShowGlobalSearchElement(!showGlobalSearchElement)}
                        leftIcon={<Search size={14} />}
                      />
                    </div>
                  )}

                  <div className="hidden lg:flex align-items-center solid-header-buttons-wrapper">
                    {solidListViewLayout?.attrs?.headerButtons
                      ?.filter((rb: any) => rb.attrs.actionInContextMenu != true)
                      ?.map((button: any, index: number) => (
                        <SolidListViewHeaderButton
                          key={index}
                          button={button}
                          params={params}
                          solidListViewMetaData={solidListViewMetaData}
                          handleCustomButtonClick={handleCustomButtonClick}
                          selectedRecords={selectedRecords}
                          filters={filters}
                        />
                      ))}
                  </div>

                  {actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
                    solidListViewLayout?.attrs?.create !== false &&
                    params.embeded !== true &&
                    solidListViewMetaData?.data?.solidView?.layout?.attrs
                      .showDefaultAddButton !== false && (
                      <SolidCreateButton
                        createButtonUrl={createButtonUrl}
                        createActionQueryParams={createActionQueryParams}
                        solidListViewLayout={solidListViewLayout}
                        responsiveIconOnly={true}
                      />
                    )}
                  {actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
                    solidListViewLayout?.attrs?.create !== false &&
                    params.embeded == true &&
                    params.inlineCreate == true &&
                    searchParams.get("viewMode") !== "view" && (

                      <SolidButton
                        type="button"
                        icon={solidListViewLayout?.attrs?.addButtonIcon}
                        leftIcon={!solidListViewLayout?.attrs?.addButtonIcon ? <Plus size={14} /> : undefined}
                        className={`${solidListViewLayout?.attrs?.addButtonClassName}`}
                        size="small"
                        onClick={() => params.handleAddClickForEmbeddedView("new")}
                      >
                        {solidListViewLayout?.attrs?.addButtonTitle ? solidListViewLayout?.attrs?.addButtonTitle : "Add"}
                      </SolidButton>
                    )}
                  {/* Button For Manual Refresh */}
                  {params.embeded !== true && (
                    <SolidButton
                      type="button"
                      size="small"
                      variant="outline"
                      className="solid-icon-button "
                      onClick={() => {
                        setQueryString();
                      }}
                      leftIcon={<RefreshCw size={14} />}
                    />
                  )}
                  {showArchived && (
                    <SolidButton
                      type="button"
                      size="small"
                      variant="secondary"
                      className="hidden lg:flex"
                      onClick={() => setRecoverDialogVisible(true)}
                      leftIcon={<RotateCcw size={14} />}
                    >
                      Recover
                    </SolidButton>
                  )}

                  {params.embeded === false &&
                    solidListViewLayout?.attrs?.configureView !== false && (
                      <SolidListViewConfigure
                        listViewMetaData={solidListViewMetaData}
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
                        setRecoverDialogVisible={setRecoverDialogVisible}
                      />
                    )}
                </div>
              </div>
              {/* </div> */}
              {showGlobalSearchElement && params.embeded === false && (
                <div className="flex lg:hidden">
                  <SolidGlobalSearchElement
                    viewType="list"
                    showSaveFilterPopup={showSaveFilterPopup}
                    setShowSaveFilterPopup={setShowSaveFilterPopup}
                    ref={solidGlobalSearchElementRef}
                    viewData={solidListViewMetaData}
                    handleApplyCustomFilter={handleApplyCustomFilter}
                    filterPredicates={filterPredicates}
                  >

                  </SolidGlobalSearchElement>
                </div>

              )}
            </div>
          }

          {showListBodyLoadingPlaceholder ? (
            <div className="solid-view-loading-body-spacer flex-1 min-h-0" />
          ) : (
            <>
              {isListViewEmptyWithoutFilters ? (
                <SolidEmptyListViewPlaceholder
                  createButtonUrl={createButtonUrl}
                  createActionQueryParams={createActionQueryParams}
                  actionsAllowed={actionsAllowed}
                  params={params}
                  solidListViewMetaData={solidListViewMetaData}
                  handleFetchUpdatedRecords={handleFetchUpdatedRecords}
                />

              ) : (
                <div
                  className={`solid-datatable-wrapper solid-list-table-area flex-1 min-h-0 overflow-hidden ${styles.listTableArea}`}
                >
                  <DataTable
                    value={listViewData}
                    viewportHeight={params.embeded === true ? undefined : "calc(100dvh - 128px)"}
                    rowClassName={(rowData) => {
                      return rowData.deletedAt ? "greyed-out-row" : "";
                    }}
                    showGridlines={false}
                    lazy
                    scrollable
                    // scrollHeight="90vh"
                    size={size}
                    resizableColumns
                    columnResizeMode="expand"
                    paginator={true}
                    rows={rows}
                    rowsPerPageOptions={solidListViewLayout?.attrs?.pageSizeOptions}
                    dataKey="id"
                    emptyMessage={
                      solidListViewMetaData?.data?.solidView?.model?.description ||
                      "No Entities found"
                    }
                    filterDisplay="menu"
                    totalRecords={totalRecords}
                    first={first}
                    onPage={onPageChange}
                    onSort={(e: DataTableStateEvent) => onSort(e)}
                    sortField={sortField || undefined}
                    sortOrder={sortOrder}
                    loading={false}
                    // loading={loading || isLoading}
                    selection={
                      params.embeded === true
                        ? []
                        : [...selectedRecords, ...selectedRecoverRecords]
                    }
                    onSelectionChange={
                      params.embeded === true ? undefined : onSelectionChange
                    }
                    selectionMode={params.embeded === true ? null : "checkbox"}
                    removableSort={solidListViewLayout?.attrs?.removableSort ?? true}
                    sortMode="single"
                    paginatorTemplate="RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink"
                    currentPageReportTemplate="{first} - {last} of {totalRecords}"
                    onRowClick={(e) => {
                      const rowData = e.data;

                      if (solidListViewLayout?.attrs?.disableRowClick === true) return;

                      const hasFindPermission = actionsAllowed.includes(
                        permissionExpression(params.modelName, 'findOne')
                      );
                      const hasUpdatePermission =
                        actionsAllowed.includes(permissionExpression(params.modelName, 'update')) &&
                        solidListViewLayout?.attrs?.edit !== false;

                      if (!(hasFindPermission || hasUpdatePermission)) return;

                      if (params.embeded === true) {
                        params.handleEditClickForEmbeddedView(rowData?.id);
                      } else {
                        rememberListReturnState();
                        router.push(`${editBaseUrl}/${rowData?.id}?viewMode=view&${new URLSearchParams(editActionQueryParams).toString()}`);
                      }
                    }
                    }
                  >
                    {params.embeded === true ? null : (
                      <Column
                        selectionMode="multiple"
                        headerStyle={{ width: "3em" }}
                      />
                    )}
                    {solidListViewMetaData && solidListViewLayout && renderColumnsDynamically(solidListViewMetaData, solidListViewLayout)}
                    {solidListViewLayout?.attrs?.rowButtons &&
                      solidListViewLayout?.attrs?.rowButtons
                        .filter((rb: any) => {
                          const roles = rb?.attrs?.roles || [];
                          const isInContextMenu =
                            rb.attrs.actionInContextMenu === true;

                          // Only check hasAnyRole if roles are provided
                          const isAllowed =
                            roles.length === 0 ||
                            hasAnyRole(user?.roles, roles);

                          const isVisible = rb?.attrs?.visible !== false;

                          return !isInContextMenu && isAllowed && isVisible;
                        })
                        .map((button: any, index: number) => {

                          return (
                            <Column
                              key={index}
                              header={button.attrs.label}
                              body={(rowData) => {
                                return (
                                  <SolidButton
                                    type="button"
                                    icon={button?.attrs?.icon}
                                    leftIcon={!button?.attrs?.icon ? <SquarePen size={14} /> : undefined}
                                    className={`solid-inline-row-button w-full text-left gap-2 ${button?.attrs?.className
                                      ? button?.attrs?.className
                                      : ""
                                      }`}
                                    size="small"
                                    variant="ghost"
                                    onClick={() => {
                                      const event = {
                                        params,
                                        rowData: rowData,
                                        solidListViewMetaData:
                                          solidListViewMetaData?.data,
                                      };
                                      handleCustomButtonClick(button.attrs, event);
                                    }}
                                  >
                                    {button.attrs.showLabel !== false
                                      ? button.attrs.label
                                      : ""}
                                  </SolidButton>
                                );
                              }}
                            />
                          );
                        })}

                    {actionsAllowed.includes(
                      `${permissionExpression(params.modelName, 'update')}`
                    ) &&
                      solidListViewLayout?.attrs?.edit !== false &&
                      solidListViewLayout?.attrs?.showRowEditInContextMenu ===
                      false && (
                        <Column
                          header="Edit"
                          body={(rowData) => {
                            const shouldHideEditOrDeleteButton = isDraftPublishWorkflowEnabled && rowData?.publishedAt;
                            return (
                              <>
                                {!shouldHideEditOrDeleteButton && (
                                  <SolidButton
                                    type="button"
                                    variant="ghost"
                                    className="solid-inline-row-button solid-inline-row-button-icon"
                                    size="small"
                                    leftIcon={<Pencil size={14} />}
                                    onClick={() => {
                                      if (params.embeded == true) {
                                        params.handleEditClickForEmbeddedView(rowData?.id);
                                      } else {
                                        rememberListReturnState();
                                        router.push(
                                          `${editBaseUrl}/${rowData?.id}?viewMode=edit&${new URLSearchParams(editActionQueryParams).toString()}`
                                        );
                                      }
                                    }}
                                  />
                                )}
                              </>
                            );
                          }}
                        />
                      )}

                    {actionsAllowed.includes(
                      `${permissionExpression(params.modelName, 'delete')}`
                    ) &&
                      solidListViewLayout?.attrs?.delete !== false &&
                      (params.embeded ||
                        (solidListViewLayout?.attrs?.showRowDeleteInContextMenu !== undefined &&
                          solidListViewLayout?.attrs?.showRowDeleteInContextMenu !== true)
                      )
                      &&
                      (
                        <Column
                          header="Delete"
                          body={(rowData) => {
                            const shouldHideEditOrDeleteButton = isDraftPublishWorkflowEnabled && rowData?.publishedAt;
                            return (
                              <>
                                {(!shouldHideEditOrDeleteButton) && (
                                  <SolidButton
                                    type="button"
                                    className="solid-inline-row-button solid-inline-row-button-icon"
                                    size="small"
                                    variant="ghost"
                                    leftIcon={<Trash2 size={14} />}
                                    onClick={() => {
                                      if (params?.embededFieldRelationType === "many-to-many") {
                                        params?.handleDeleteClick(rowData.id);
                                      } else {
                                        setSelectedSolidViewData(rowData);
                                        setDeleteEntity(true);
                                      }
                                    }}
                                  />
                                )}
                              </>
                            );
                          }}
                        />
                      )}

                    {hasAnyContextMenuActions && (
                      <Column
                        frozen
                        alignFrozen="right"
                        body={(rowData) =>
                          rowData?.deletedAt ? (
                            <a
                              onClick={(event) => {
                                event.stopPropagation();
                                recoverById(rowData.id);
                              }}
                              className="retrieve-button solid-row-menu-trigger"
                            >
                              <RotateCcw size={14} className={styles.retrieveIcon} />
                            </a>
                          ) : (
                            <>
                              {solidListViewLayout?.attrs?.showRowContextMenu !==
                                false && (
                                  <div className="flex justify-content-end" data-no-row-click="true">
                                    <SolidListViewRowActionsMenu
                                      rowData={rowData}
                                      hasEditInContextMenu={hasEditInContextMenu}
                                      hasDeleteInContextMenu={hasDeleteInContextMenu}
                                      hasCustomContextMenuButtons={hasCustomContextMenuButtons}
                                      solidListViewLayout={solidListViewLayout}
                                      solidListViewMetaData={solidListViewMetaData}
                                      params={params}
                                      handleCustomButtonClick={handleCustomButtonClick}
                                      contentClassName={styles.rowActionsOverlay}
                                      onSelectRow={(selectedRow: any) => {
                                        selectedDataRef.current = selectedRow;
                                        setSelectedSolidViewData(selectedRow);
                                      }}
                                      onEdit={(selectedRow: any) => {
                                        if (params.embeded == true) {
                                          params.handleEditClickForEmbeddedView(selectedRow?.id);
                                        } else {
                                          rememberListReturnState();
                                          router.push(
                                            `${editBaseUrl}/${selectedRow?.id}?viewMode=edit&${new URLSearchParams(editActionQueryParams).toString()}`
                                          );
                                        }
                                      }}
                                      onDelete={(selectedRow: any) => {
                                        setSelectedSolidViewData(selectedRow);
                                        setDeleteEntity(true);
                                      }}
                                    />
                                  </div>
                                )}
                            </>
                          )
                        }
                      ></Column>
                    )}
                  </DataTable>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <SolidConfirmDialog
        open={isDialogVisible}
        onCancel={onDeleteClose}
        onConfirm={deleteBulk}
        className="solid-shadcn-confirm-dialog solid-delete-confirm-dialog"
        headerClassName="solid-shadcn-dialog-head"
        bodyClassName="solid-shadcn-dialog-body"
        footerClassName="solid-shadcn-dialog-actions"
        separatorClassName="solid-shadcn-dialog-sep"
        showSeparator
        title="Delete Records"
        message={<p className="solid-shadcn-dialog-text">Are you sure you want to delete the selected records?</p>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
      <SolidDialog
        open={isRecoverDialogVisible}
        onOpenChange={(open) => {
          if (!open) {
            setRecoverDialogVisible(false);
          }
        }}
        className="solid-shadcn-confirm-dialog solid-delete-confirm-dialog"
      >
        <SolidDialogHeader className="solid-shadcn-dialog-head">
          <SolidDialogTitle>Confirm Recover</SolidDialogTitle>
          <SolidDialogClose />
        </SolidDialogHeader>
        <SolidDialogSeparator className="solid-shadcn-dialog-sep" />
        <SolidDialogBody className="solid-shadcn-dialog-body">
          <p className="solid-shadcn-dialog-text">Are you sure you want to recover all records?</p>
        </SolidDialogBody>
        <SolidDialogFooter className="solid-shadcn-dialog-actions">
          <SolidButton variant="destructive" size="sm" autoFocus onClick={recoverAll}>
            Yes
          </SolidButton>
          <SolidButton variant="outline" size="sm" onClick={() => setRecoverDialogVisible(false)}>
            No
          </SolidButton>
        </SolidDialogFooter>
      </SolidDialog>

      {
        listViewRowActionData && (
          <SolidDialog
            open={listViewRowActionPopupState}
            onOpenChange={(open) => {
              if (!open) {
                closeListViewRowActionPopup();
              }
            }}
          >
            <SolidDialogHeader>
              <SolidDialogTitle>{listViewRowActionData?.rowAction?.label || "Action"}</SolidDialogTitle>
              <SolidDialogClose />
            </SolidDialogHeader>
            <SolidDialogSeparator />
            <SolidDialogBody>
            <ListViewRowActionPopup
              context={listViewRowActionData}
            ></ListViewRowActionPopup>
            </SolidDialogBody>
          </SolidDialog>
        )
      }
      <SolidConfirmDialog
        open={deleteEntity}
        onCancel={() => setDeleteEntity(false)}
        onConfirm={handleDeleteEntity}
        className="solid-shadcn-confirm-dialog solid-delete-confirm-dialog"
        headerClassName="solid-shadcn-dialog-head"
        bodyClassName="solid-shadcn-dialog-body"
        footerClassName="solid-shadcn-dialog-actions"
        separatorClassName="solid-shadcn-dialog-sep"
        showSeparator
        title={`Delete ${entityDisplayName}`}
        message={<p className="solid-shadcn-dialog-text">{`Are you sure you want to delete this ${entityDisplayName}?`}</p>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
      {openLightbox && (
        <SolidLightbox
          open={openLightbox}
          slides={lightboxSlides}
          onClose={() => setOpenLightbox(false)}
        />
      )}
    </div >
  );
});

SolidListView.displayName = "SolidListView";
