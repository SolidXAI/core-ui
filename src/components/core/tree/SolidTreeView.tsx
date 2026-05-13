import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, EllipsisVertical, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { showToast } from "../../../redux/features/toastSlice";
import { useDispatch, useSelector } from "react-redux";
import { showNavbar, toggleNavbar } from "../../../redux/features/navbarSlice";
import { useGetSolidViewLayoutQuery } from "../../../redux/api/solidViewApi";
import qs from "qs";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import { permissionExpression } from "../../../helpers/permissions";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { AggregationRule, GroupingRule } from "../common/GroupingComponent";
import { SolidListViewColumn } from "../list/SolidListViewColumn";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { useSession } from "../../../hooks/useSession";
import { useLazyCheckIfPermissionExistsQuery } from "../../../redux/api/userApi";
import { SolidListViewConfigure } from "../list/SolidListViewConfigure";
import CompactImage from '../../../resources/images/layout/images/compact.png';
import CozyImage from '../../../resources/images/layout/images/cozy.png';
import ComfortableImage from '../../../resources/images/layout/images/comfortable.png';
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { getFilterObjectFromLocalStorage, setFilterObjectToLocalStorage } from "../list/SolidListView";
import { SolidBeforeTreeNodeLoad } from "../../../types";
import { getExtensionFunction } from "../../../helpers/registry";
import { SolidTreeLoad, SolidTreeUiEventResponse } from "../../../types/solid-core";
import { useRouter } from "../../../hooks/useRouter";
import { normalizeSolidListTreeKanbanActionPath } from "../../../helpers/routePaths";
import { usePathname } from "../../../hooks/usePathname";
import { useHandleListCustomButtonClick } from "../../../components/common/useHandleListCustomButtonClick";
import { SolidButton, SolidDialog, SolidDialogBody, SolidDialogDescription, SolidDialogFooter, SolidDialogHeader, SolidDialogSeparator, SolidDialogTitle, SolidDropdownMenu, SolidDropdownMenuContent, SolidDropdownMenuItem, SolidDropdownMenuSeparator, SolidDropdownMenuTrigger, SolidIcon } from "../../shad-cn-ui";
import { SolidHeaderRequestStatus } from "../../common/SolidHeaderRequestStatus";
import { Column as SolidTreeColumn, SolidTreeNode as TreeNode, SolidTreeSelectionKeys, SolidTreeTable } from "./SolidTreeTable";

// ─── Types ────────────────────────────────────────────────────────────────────

type SolidTreeViewParams = {
  moduleName: string;
  modelName: string;
  inlineCreate?: boolean;
  handlePopUpOpen?: any;
  embeded?: boolean;
  customLayout?: any;
  customFilter?: any;
};

export type SolidTreeViewHandle = {
  refresh: () => void;
  clearFilters: () => void;
  applyFilter: (filter: {
    custom_filter_predicate?: any;
    search_predicate?: any;
    saved_filter_predicate?: any;
    predefined_search_predicate?: any;
  }) => void;
  setPagination: (nextFirst: number, nextRows: number) => void;
  setSort: (nextSortField: string, nextSortOrder: 1 | -1 | 0) => void;
  setShowArchived: (value: boolean) => void;
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

type GroupPathItem = {
  ruleIndex: number;
  fieldName: string;
  filterField: string;
  value: any;
  dateGranularity?: string | null;
};

type NodeMeta = {
  nodeType: "group" | "record";
  ruleIndex: number;
  groupLabel?: string;
  idCount?: number | string;
  aggregates?: Record<string, any>;
  groupPath: GroupPathItem[];
};

type TreeRowData = Record<string, any> & {
  __treeMeta?: NodeMeta;
};

/**
 * Pagination entry stored per node key.
 * - "root" is used for the top-level group list.
 * - Any other node.key is used for its children (groups or records).
 */
type PaginationEntry = {
  offset: number;   // current page start
  limit: number;    // page size
  total: number;    // total items returned from API (used to determine hasNext)
};

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const resolveDefaultPageSize = (options: number[]) => (
  options.includes(DEFAULT_PAGE_SIZE) ? DEFAULT_PAGE_SIZE : options[0]
);

// ─── Component ────────────────────────────────────────────────────────────────

export const SolidTreeView = forwardRef<SolidTreeViewHandle, SolidTreeViewParams>((params, ref) => {
  const dispatch = useDispatch();
  const visibleNavbar = useSelector((state: any) => state.navbarState?.visibleNavbar);
  const searchParams = useSearchParams();

  const session = useSession();
  const router = useRouter()
  const user = session?.data?.user;

  const pathname = usePathname();
  const solidGlobalSearchElementRef = useRef<any>(null);

  const [showSaveFilterPopup, setShowSaveFilterPopup] = useState<boolean>(false);
  const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);
  const [toPopulate, setToPopulate] = useState<string[]>([]);
  const [toPopulateMedia, setToPopulateMedia] = useState<string[]>([]);
  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
  const [createActionQueryParams, setCreateActionQueryParams] = useState<Record<string, string>>({});
  const [editActionQueryParams, setEditActionQueryParams] = useState<Record<string, string>>({});

  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [selectedRecoverRecords, setSelectedRecoverRecords] = useState<any[]>([]);


  const [groupingRules, setGroupingRules] = useState<GroupingRule[]>([]);
  const [aggregationRules, setAggregationRules] = useState<AggregationRule[]>([]);

  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [selectedNodeKeys, setSelectedNodeKeys] = useState<SolidTreeSelectionKeys>({});
  const [expandedKeys, setExpandedKeys] = useState<any>({});
  const [treeLoading, setTreeLoading] = useState<boolean>(false);

  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);

  const [pageSizeOptions, setPageSizeOptions] = useState<number[]>([10, 25, 50]);
  const [globalLimit, setGlobalLimit] = useState<number>(25);

  const [isDeleteRecordsDialogVisible, setDeleteRecordsDialogVisible] = useState(false);
  const [isRecoverDialogVisible, setRecoverDialogVisible] = useState(false);
  const [showArchived, setShowArchived] = useState(false);


  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();
  const [isDraftPublishWorkflowEnabled, setIsDraftPublishWorkflowEnabled] = useState(false);





  const sizeOptions = [
    { label: "Compact", value: "small", image: CompactImage },
    { label: "Cozy", value: "normal", image: CozyImage },
    { label: "Comfortable", value: "large", image: ComfortableImage },
  ];

  const [size, setSize] = useState<string | any>(sizeOptions[1].value);
  const [viewModes, setViewModes] = useState<any>([]);

  const headerRequestStatusLabel = treeLoading ? "Loading..." : null;


  // ── Pagination state ──────────────────────────────────────────────────────
  /**
   * Key: "root" for top-level group list; node.key (string) for any other node.
   * Value: { offset, limit, total }
   */
  const [paginationMap, setPaginationMap] = useState<Record<string, PaginationEntry>>({});

  const getPagination = (key: string, map = paginationMap): PaginationEntry =>
    map[key] ?? { offset: 0, limit: globalLimit, total: 0 };

  const setPagination = (key: string, entry: Partial<PaginationEntry>) =>
    setPaginationMap((prev) => {
      const current = getPagination(key, prev);
      return {
        ...prev,
        [key]: { ...current, ...entry },
      };
    });

  // ── Pagination helpers ────────────────────────────────────────────────────

  const hasPrev = (key: string) => getPagination(key).offset > 0;

  const hasNext = (key: string) => {
    const { offset, limit, total } = getPagination(key);
    // total here is the count of records returned by the last fetch for that node.
    // We consider "has next" when we received a full page (i.e. there might be more).
    return offset + limit < total;
  };

  // ─────────────────────────────────────────────────────────────────────────

  const menuItemId = searchParams.get("menuItemId");
  const menuItemName = searchParams.get("menuItemName");
  const actionId = searchParams.get("actionId");
  const actionName = searchParams.get("actionName");

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

  const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

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



  const treeViewMetaDataQs = qs.stringify(
    {
      modelName: params.modelName,
      moduleName: params.moduleName,
      viewType: "tree",
      menuItemId,
      menuItemName,
      actionId,
      actionName,
    },
    { encodeValuesOnly: true }
  );

  const { data: solidTreeViewMetaData } = useGetSolidViewLayoutQuery(treeViewMetaDataQs);
  const solidTreeViewLayout = params.customLayout || solidTreeViewMetaData?.data?.solidView?.layout;

  const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();

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


  // set layout and actions for create and edit buttons and view modes
  useEffect(() => {
    if (solidTreeViewLayout) {
      const listLayoutAttrs = solidTreeViewLayout.attrs;
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
      setViewModes(solidTreeViewMetaData?.data?.viewModes);
      if (createActionUrl) {
        setCreateButtonUrl(createActionUrl);
      }
      if (editActionUrl) {
        setEditButtonUrl(editActionUrl);
      }
      setIsDraftPublishWorkflowEnabled(solidTreeViewMetaData?.data?.solidView?.model?.draftPublishWorkflow === true);
    }
  }, [solidTreeViewLayout]);



  const editBaseUrl = useMemo(
    () => normalizeSolidListTreeKanbanActionPath(pathname, editButtonUrl || "form"),
    [editButtonUrl, pathname]
  );

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



  const treeViewTitle = solidTreeViewMetaData?.data?.solidView?.displayName;

  const toggleBothSidebars = () => {
    if (visibleNavbar) {
      dispatch(toggleNavbar());
    } else {
      dispatch(showNavbar());
    }
  };

  const [filters, setFilters] = useState<any>(null);
  const [filterPredicates, setFilterPredicates] = useState<any>(null);

  const latestFiltersRef = useRef<any>(filters);
  const latestFilterPredicatesRef = useRef<any>(filterPredicates);

  const activeGroupingRules = useMemo(
    () => (groupingRules || []).filter((rule) => !!rule?.fieldName),
    [groupingRules]
  );

  useEffect(() => { latestFiltersRef.current = filters; }, [filters]);
  useEffect(() => { latestFilterPredicatesRef.current = filterPredicates; }, [filterPredicates]);

  useEffect(() => {
    if (solidTreeViewMetaData) {
      setViewModes(solidTreeViewMetaData?.data?.viewModes);
    }
  }, [solidTreeViewMetaData]);

  useEffect(() => {
    const solidFieldsMetadata = solidTreeViewMetaData?.data?.solidFieldsMetadata;
    const queryObject = getFilterObjectFromLocalStorage();

    const layoutPageSizeOptions = solidTreeViewMetaData?.data?.solidView?.layout?.attrs?.pageSizeOptions;
    const currentOptions = (Array.isArray(layoutPageSizeOptions) && layoutPageSizeOptions.length > 0)
      ? layoutPageSizeOptions
      : DEFAULT_PAGE_SIZE_OPTIONS;

    setPageSizeOptions(currentOptions);

    if (queryObject) {
      setToPopulate(queryObject.populate || []);
      setToPopulateMedia(queryObject.populateMedia || []);
      setSortField(queryObject.sortField || "");
      setSortOrder(queryObject.sortOrder || 0);

      const savedLimit = queryObject.limit;
      if (savedLimit && currentOptions.includes(savedLimit)) {
        setGlobalLimit(savedLimit);
      } else {
        setGlobalLimit(resolveDefaultPageSize(currentOptions));
      }
    }
    else {
      if (!solidTreeViewLayout || !solidFieldsMetadata) {
        setToPopulate([]);
        setToPopulateMedia([]);
        setGlobalLimit(resolveDefaultPageSize(currentOptions));
        return;
      }

      const nextPopulate: string[] = [];
      const nextPopulateMedia: string[] = [];

      for (const column of solidTreeViewLayout?.children || []) {
        const fieldMetadata = solidFieldsMetadata?.[column?.attrs?.name];
        if (!fieldMetadata) continue;

        if (fieldMetadata.type === "relation" && fieldMetadata.relationType === "many-to-one") {
          if (!nextPopulate.includes(fieldMetadata.name)) nextPopulate.push(fieldMetadata.name);
        }
        if (fieldMetadata.type === "mediaSingle" || fieldMetadata.type === "mediaMultiple") {
          if (!nextPopulateMedia.includes(fieldMetadata.name)) nextPopulateMedia.push(fieldMetadata.name);
        }
      }

      setToPopulate(nextPopulate);
      setToPopulateMedia(nextPopulateMedia);
      setGlobalLimit(resolveDefaultPageSize(currentOptions));
    }
  }, [solidTreeViewLayout, solidTreeViewMetaData]);

  useEffect(() => {

    // event invocation is not tested
    if (solidTreeViewMetaData && solidTreeViewMetaData?.data) {
      const handleDynamicFunction = async () => {
        const dynamicHeader = solidTreeViewMetaData?.data?.solidView?.layout?.onTreeLoad;
        let dynamicExtensionFunction = null;
        let treeLayout = solidTreeViewMetaData?.data?.solidView?.layout;
        let treeViewNodes = treeNodes;
        if (params.customLayout) {
          treeLayout = params.customLayout;
        }
        const event: SolidTreeLoad = {
          fieldsMetadata: solidTreeViewMetaData?.data?.solidFieldsMetadata,
          type: "onTreeLoad",
          nodes: treeViewNodes,
          viewMetadata: solidTreeViewMetaData?.data?.solidView,
          treeViewLayout: treeLayout,
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
            const updatedListData: SolidTreeUiEventResponse = await dynamicExtensionFunction(event);

            if (updatedListData && updatedListData?.dataChanged && updatedListData?.newNodes) {
              treeViewNodes = updatedListData.newNodes;
            }
            if (updatedListData && updatedListData?.layoutChanged && updatedListData?.newLayout) {
              treeLayout = updatedListData.newLayout;
            }
          }
          if (treeViewNodes) {
            setTreeNodes(treeViewNodes);
          }
          if (treeLayout) {
            solidTreeViewLayout(treeLayout);
          }
        }
      };
      handleDynamicFunction();
    }

  }, [treeNodes]);


  // ─── Field / filter helpers ───────────────────────────────────────────────

  const getFieldMetadata = (fieldName: string) =>
    solidTreeViewMetaData?.data?.solidFieldsMetadata?.[fieldName];

  const getResolvedGroupField = (fieldName: string) => {
    const fieldMetadata = getFieldMetadata(fieldName);
    if (
      fieldMetadata?.type === "relation" &&
      fieldMetadata?.relationType === "many-to-one" &&
      fieldMetadata?.relationModel?.userKeyField?.name
    ) {
      return `${fieldName}.${fieldMetadata.relationModel.userKeyField.name}`;
    }
    return fieldName;
  };

  const toGroupByParam = (rule: GroupingRule) => {
    const fieldName = String(rule.fieldName);
    const resolvedField = getResolvedGroupField(fieldName);
    if (!rule.dateGrouping) return resolvedField;
    if (rule.dateGrouping === "YYYY") return `${resolvedField}:year:YYYY`;
    if (rule.dateGrouping === "MMM") return `${resolvedField}:month:MMM`;
    if (rule.dateGrouping === "YYYY-MM") return `${resolvedField}:month:YYYY-MM`;
    if (rule.dateGrouping === "YYYY-MM-DD") return `${resolvedField}:day:YYYY-MM-DD`;
    return resolvedField;
  };

  // const dateTimeImplicitFilter = (rule: GroupingRule) => {
  //   const fieldMetadata = getFieldMetadata(String(rule.fieldName));
  //   return !!rule.dateGrouping && ["date", "datetime"].includes(fieldMetadata?.type);
  // };

  const getDateGranularity = (rule: GroupingRule) => {
    const fieldMetadata = getFieldMetadata(String(rule.fieldName));
    if (rule.dateGrouping && ["date", "datetime"].includes(fieldMetadata?.type)) {
      switch (rule.dateGrouping) {
        case "YYYY":
          return "year";
        case "MMM":
          return "month";
        case "YYYY-MM":
          return "month";
        case "YYYY-MM-DD":
          return "day";
      }
    }
    return null;
  }

  const buildNestedEqCondition = (fieldPath: string, value: any, dateGranularity: any) => {
    const parts = fieldPath.split(".").filter(Boolean);
    if (parts.length === 0) return {};
    if (dateGranularity) {
      return { [`${parts[0]}:${dateGranularity}`]: { $eq: value } };
    }
    return parts.reduceRight((acc: any, part: string) => ({ [part]: acc }), { $eq: value });
  };

  const buildImplicitFiltersFromPath = (groupPath: GroupPathItem[]) =>
    groupPath
      // .filter((item) => !item.skipImplicitFilter)
      .map((item) => buildNestedEqCondition(item.filterField, item.value, item.dateGranularity));

  const mergeFiltersWithImplicit = (implicitFilters: any[]) => {
    const baseFilters = latestFiltersRef.current;
    const hasBaseFilters = baseFilters && Object.keys(baseFilters).length > 0;
    if (!hasBaseFilters && implicitFilters.length === 0) return null;
    const merged = hasBaseFilters ? structuredClone(baseFilters) : { $and: [] };
    if (implicitFilters.length === 0) return merged;
    if (Array.isArray(merged.$and)) {
      merged.$and.push(...implicitFilters);
      return merged;
    }
    return { $and: [merged, ...implicitFilters] };
  };

  const buildAggregates = () => {
    const derivedAggregates = (aggregationRules || [])
      .filter((rule) => !!rule?.fieldName && !!rule?.operator)
      .map((rule) => `${rule.fieldName}:${rule.operator}`);
    return derivedAggregates.length > 0 ? derivedAggregates : ["id:count"];
  };

  const extractGroupCount = (groupMeta: any) => {
    if (groupMeta?.id_count !== undefined) return groupMeta.id_count;
    const countKey = Object.keys(groupMeta || {}).find((key) => key.endsWith("_count"));
    if (countKey) return groupMeta[countKey];
    return undefined;
  };

  const normalizeRecord = (record: any) => {
    const newRecord = { ...record };
    Object.entries(newRecord).forEach(([key, value]) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) newRecord[key] = parsed.join(", ");
        } catch {
          if (/^\[.*\]$/.test(value)) newRecord[key] = value.replace(/[\[\]"]+/g, "");
        }
      }
    });
    return newRecord;
  };

  const formatHeader = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getSortParam = (ruleIndex: number) => {
    if (!sortField || !sortOrder) return null;

    const dir = sortOrder === 1 ? "ASC" : "DESC";

    // 1. Sorting by the "Group" column
    if (sortField === "__group") {
      const rule = activeGroupingRules[ruleIndex];
      if (!rule) return null;
      // At this level, sort by the field we are grouping by
      return `${toGroupByParam(rule)}:${dir}`;
    }

    // 2. Sorting by an aggregate column
    const isAggregate = aggregationRules.some((rule) => {
      const responseKey = `${rule.fieldName}:${rule.operator}`;
      return responseKey === sortField || `${rule.fieldName}_${rule.operator}` === sortField;
    });

    if (isAggregate) {
      const [field, op] = sortField.includes(":") ? sortField.split(":") : sortField.split("_");

      // For leaf level: only field:DIR
      if (ruleIndex >= activeGroupingRules.length) {
        return `${field}:${dir}`;
      }

      // For group levels: field:operator:DIR
      return `${field}:${op}:${dir}`;
    }

    // 3. Sorting by a leaf column (regular record field)
    return `${sortField}:${dir}`;
  };

  // ─── API fetch helpers (now accept offset + limit) ────────────────────────

  const runGroupedQuery = async (
    ruleIndex: number,
    groupPath: GroupPathItem[],
    offset: number,
    limit: number
  ) => {
    const rule = activeGroupingRules[ruleIndex];
    if (!rule?.fieldName) return { response: null };

    let queryData: any = {
      offset,
      limit,
      groupBy: [toGroupByParam(rule)],
      aggregates: buildAggregates(),
    };

    const sortParam = getSortParam(ruleIndex);
    if (sortParam) queryData.sort = [sortParam];

    const implicitFilters = buildImplicitFiltersFromPath(groupPath);
    const mergedFilters = mergeFiltersWithImplicit(implicitFilters);
    if (mergedFilters) queryData.filters = mergedFilters;

    // event invocation is not tested
    const dynamicHeader = solidTreeViewMetaData?.data?.solidView?.layout?.onBeforeTreeDataLoad;
    let dynamicExtensionFunction = null;
    const event: SolidBeforeTreeNodeLoad = {
      type: "onBeforeTreeDataLoad",
      level: ruleIndex,
      levelFieldName: rule.fieldName,
      fieldsMetadata: solidTreeViewMetaData?.data?.solidFieldsMetadata,
      viewMetadata: solidTreeViewMetaData?.data?.solidView,
      treeViewLayout: solidTreeViewMetaData?.data.solidView.layout,
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
          const updatedListData: SolidTreeUiEventResponse = await dynamicExtensionFunction(event);
          if (updatedListData && updatedListData?.filterApplied && updatedListData?.newFilter) {
            queryData = updatedListData?.newFilter;
          }
        } catch (err) {
          console.error("Error executing onBeforeTreeDataLoad extension:", err);
        }
      }
    }

    const queryString = qs.stringify(queryData, { encodeValuesOnly: true });

    const response = await triggerGetSolidEntities(queryString).unwrap();
    return { queryData, queryString, response };
  };

  const runLeafQuery = async (
    groupPath: GroupPathItem[],
    offset: number,
    limit: number
  ) => {
    let queryData: any = {
      offset,
      limit,
      sort: getSortParam(groupPath.length) ? [getSortParam(groupPath.length)] : ["id:desc"],
      populate: toPopulate,
      populateMedia: toPopulateMedia,
    };

    const implicitFilters = buildImplicitFiltersFromPath(groupPath);
    const mergedFilters = mergeFiltersWithImplicit(implicitFilters);
    if (mergedFilters) queryData.filters = mergedFilters;


    // event invocation is not tested
    const dynamicHeader = solidTreeViewMetaData?.data?.solidView?.layout?.onBeforeTreeDataLoad;
    let dynamicExtensionFunction = null;
    const event: SolidBeforeTreeNodeLoad = {
      type: "onBeforeTreeDataLoad",
      level: groupPath.length,
      levelFieldName: groupPath[groupPath.length - 1].fieldName,
      fieldsMetadata: solidTreeViewMetaData?.data?.solidFieldsMetadata,
      viewMetadata: solidTreeViewMetaData?.data?.solidView,
      treeViewLayout: solidTreeViewMetaData?.data.solidView.layout,
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
          const updatedListData: SolidTreeUiEventResponse = await dynamicExtensionFunction(event);
          if (updatedListData && updatedListData?.filterApplied && updatedListData?.newFilter) {
            queryData = updatedListData?.newFilter;
          }
        } catch (err) {
          console.error("Error executing onBeforeTreeDataLoad extension:", err);
        }
      }
    }



    const queryString = qs.stringify(queryData, { encodeValuesOnly: true });




    const response = await triggerGetSolidEntities(queryString).unwrap();
    return { queryData, queryString, response };
  };

  // ─── Node builders ────────────────────────────────────────────────────────

  const buildGroupNodes = (
    groupMetaRows: any[],
    ruleIndex: number,
    parentPath: GroupPathItem[],
    parentKey: string
  ): TreeNode[] => {
    const rule = activeGroupingRules[ruleIndex];
    if (!rule?.fieldName) return [];

    const fieldName = String(rule.fieldName);
    const filterField = getResolvedGroupField(fieldName);
    // const dateGranularity = dateTimeImplicitFilter(rule);
    const dateGranularity = getDateGranularity(rule);
    return (groupMetaRows || []).map((groupMeta, index) => {
      const groupLabel = groupMeta?.groupName ?? "(empty)";
      const groupValue = groupMeta?.groupValue ?? "(empty)";
      const idCount = extractGroupCount(groupMeta);

      const groupPath: GroupPathItem[] = [
        ...parentPath,
        { ruleIndex, fieldName, filterField, value: groupValue, dateGranularity },
      ];

      return {
        key: `${parentKey}-g-${ruleIndex}-${index}`,
        data: {
          __treeMeta: {
            nodeType: "group",
            ruleIndex,
            groupLabel,
            idCount,
            aggregates: groupMeta,
            groupPath,
          },
        } as TreeRowData,
        children: [],
        leaf: false,
      };
    });
  };

  const buildRecordNodes = (
    records: any[],
    parentKey: string,
    groupPath: GroupPathItem[]
  ): TreeNode[] => {
    return (records || []).map((record: any, index: number) => {
      const normalizedRecord = normalizeRecord(record);
      return {
        key: `${parentKey}-r-${record?.id ?? index}`,
        data: {
          ...normalizedRecord,
          __treeMeta: {
            nodeType: "record",
            ruleIndex: groupPath.length,
            groupPath,
          },
        } as TreeRowData,
        leaf: true,
      };
    });
  };

  const updateNodeChildren = (
    nodes: TreeNode[],
    targetKey: string | number,
    children: TreeNode[]
  ): TreeNode[] => {
    return nodes.map((node) => {
      if (node.key === targetKey) {
        return { ...node, children, leaf: children.length === 0 };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateNodeChildren(node.children, targetKey, children) };
      }
      return node;
    });
  };

  // ─── Root group load / paginate ───────────────────────────────────────────

  const loadRootGroups = async (offset = 0) => {
    if (!solidTreeViewMetaData || activeGroupingRules.length === 0) {
      setTreeNodes([]);
      setExpandedKeys({});

      const queryObject = getFilterObjectFromLocalStorage();
      if (queryObject) {
        delete queryObject.grouping_rules;
        delete queryObject.aggregation_rules;
        setFilterObjectToLocalStorage(queryObject);
      }

      return;
    }

    const limit = globalLimit || DEFAULT_PAGE_SIZE;
    setTreeLoading(true);
    try {
      const { response } = await runGroupedQuery(0, [], offset, limit);
      const rootNodes = buildGroupNodes(response?.groupMeta || [], 0, [], "root");
      setTreeNodes(rootNodes);
      setExpandedKeys({});
      setSelectedNodeKeys({});
      // Collapse expanded keys since data changed
      const total = response?.meta.totalRecords ?? 0;
      setPagination("root", { offset, total: total, limit });

      if (latestFilterPredicatesRef.current && latestFilterPredicatesRef.current.persistFilter) {
        let queryData: any = {
          offset: offset,
          limit: limit,
          populate: toPopulate,
          populateMedia: toPopulateMedia,
          sortField: sortField,
          sortOrder: sortOrder,
          custom_filter_predicate: latestFilterPredicatesRef.current.custom_filter_predicate || null,
          search_predicate: latestFilterPredicatesRef.current.search_predicate || null,
          saved_filter_predicate: latestFilterPredicatesRef.current.saved_filter_predicate || null,
          predefined_search_predicate: latestFilterPredicatesRef.current.predefined_search_predicate || null,
          grouping_rules: latestFilterPredicatesRef.current.grouping_rules || null,
          aggregation_rules: latestFilterPredicatesRef.current.aggregation_rules || null,
        };

        setFilterObjectToLocalStorage(queryData);
      }

    } catch (error: any) {
      setTreeNodes([]);
      dispatch(showToast({ severity: "error", summary: "Failed to load tree", detail: error?.data?.message || error?.message || "Unable to load grouped data", life: 4000 }));
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    // Reset root pagination on data dependencies change
    setPaginationMap({});
    if (filters && filterPredicates) {
      loadRootGroups(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solidTreeViewMetaData, params.modelName, activeGroupingRules, aggregationRules, filters, sortField, sortOrder, globalLimit]);

  // ─── Expand handler ───────────────────────────────────────────────────────

  const loadNodeChildren = async (node: TreeNode, offset: number) => {
    const meta = (node.data as TreeRowData)?.__treeMeta;
    if (!meta || meta.nodeType !== "group") return;

    const nodeKey = String(node.key);
    const limit = getPagination(nodeKey).limit || globalLimit || DEFAULT_PAGE_SIZE;
    const nextRuleIndex = meta.ruleIndex + 1;

    setTreeLoading(true);
    try {
      let children: TreeNode[] = [];
      let total = 0;

      if (nextRuleIndex < activeGroupingRules.length) {

        const { response } = await runGroupedQuery(
          nextRuleIndex,
          meta.groupPath || [],
          offset,
          limit
        );
        children = buildGroupNodes(
          response?.groupMeta || [],
          nextRuleIndex,
          meta.groupPath || [],
          nodeKey
        );
        total = response?.meta.totalRecords ?? 0;
      } else {
        const { response } = await runLeafQuery(meta.groupPath || [], offset, limit);
        children = buildRecordNodes(response?.records || [], nodeKey, meta.groupPath || []);
        total = response?.meta.totalRecords ?? 0;
      }

      setTreeNodes((prev) => updateNodeChildren(prev, nodeKey, children));
      setPagination(node.key as string, { offset, total: total, limit });
      setSelectedNodeKeys((prevKeys) => {
        const next = { ...prevKeys };
        Object.keys(next).forEach((key) => {
          if (key !== nodeKey && key.startsWith(`${nodeKey}-`)) {
            delete next[key];
          }
        });

        if (prevKeys?.[nodeKey]?.checked) {
          children.forEach((child) => {
            next[String(child.key)] = {
              ...next[String(child.key)],
              checked: true,
              partialChecked: false,
              nodeType: child.data?.__treeMeta?.nodeType,
            };
          });
        }

        return next;
      });

      // Collapse all immediate children's expanded state so stale
      // sub-trees don't appear open with no data after pagination.
      if (offset !== 0 || children.length > 0) {
        setExpandedKeys((prevKeys: any) => {
          const next = { ...prevKeys };
          Object.keys(next).forEach((k) => {
            if (k !== nodeKey && k.startsWith(`${nodeKey}-`)) {
              delete next[k];
            }
          });
          return next;
        });

        // Also wipe pagination state for all descendant keys so page
        // counters don't carry over to the newly loaded children.
        setPaginationMap((prevMap) => {
          const next = { ...prevMap };
          Object.keys(next).forEach((k) => {
            if (k !== nodeKey && k.startsWith(`${nodeKey}-`)) {
              delete next[k];
            }
          });
          return next;
        });
      }
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: "Failed to expand node", detail: error?.data?.message || error?.message || "Unable to load children", life: 4000 }));
      setTreeNodes((prev) => updateNodeChildren(prev, nodeKey, []));
    } finally {
      setTreeLoading(false);
    }
  };

  const handleNodeExpand = async (event: any) => {
    const node: TreeNode | undefined = event?.node;
    if (!node) return;
    const nodeKey = String(node.key);

    // If already loaded (has children) don't re-fetch, just expand
    const alreadyLoaded = node.children && node.children.length > 0;

    if (!alreadyLoaded) {
      await loadNodeChildren(node, 0);
    }


    // If this node is checked, propagate selection to its freshly loaded children.
    const isChecked = selectedNodeKeys?.[nodeKey]?.checked === true;
    if (!isChecked) return;

    // Use setTreeNodes callback to read the latest tree state after loadNodeChildren
    // has updated it, then select all immediate children.
    setTreeNodes((currentNodes) => {
      const parentNode = findNodeByKey(currentNodes, nodeKey);
      if (!parentNode?.children?.length) return currentNodes;

      setSelectedNodeKeys((prevKeys: any) => {
        const next = { ...prevKeys };
        parentNode.children!.forEach((child) => {
          next[String(child.key)] = {
            checked: true,
            partialChecked: false,
            nodeType: child.data?.__treeMeta?.nodeType,  // already on the node
          };
        });
        return next;
      });


      return currentNodes; // tree shape unchanged, we only need the read
    });

  };

  // ─── Pagination click handlers ────────────────────────────────────────────

  /**
   * Navigate root-level groups to next/prev page.
   */
  const handleRootPageChange = async (direction: "prev" | "next") => {
    const { offset, limit } = getPagination("root");
    const nextOffset = direction === "prev"
      ? Math.max(0, offset - limit)
      : offset + limit;
    await loadRootGroups(nextOffset);
  };

  /**
   * Navigate a node's children to next/prev page.
   * We need to find the node in the tree by key to call loadNodeChildren.
   */
  const findNodeByKey = (nodes: TreeNode[], key: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const handleNodePageChange = async (nodeKey: string, direction: "prev" | "next") => {
    const { offset, limit } = getPagination(nodeKey);
    const nextOffset = direction === "prev"
      ? Math.max(0, offset - limit)
      : offset + limit;

    const node = findNodeByKey(treeNodes, nodeKey);
    if (!node) return;

    await loadNodeChildren(node, nextOffset);
  };

  useEffect(() => {
    const checkedRecords: any[] = [];

    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        const key = String(node.key);
        const nodeMeta = (node.data as TreeRowData)?.__treeMeta;

        if (selectedNodeKeys?.[key]?.checked && nodeMeta?.nodeType === "record") {
          checkedRecords.push(node.data);
        }

        if (node.children?.length) {
          walk(node.children);
        }
      });
    };

    walk(treeNodes);
    setSelectedRecords(checkedRecords);
    setSelectedRecoverRecords(checkedRecords);
  }, [treeNodes, selectedNodeKeys]);

  // ─── Filter handler ───────────────────────────────────────────────────────

  const handleApplyCustomFilter = (nextFilterPredicates: any, persistFilter = false) => {
    const queryfilter = structuredClone(params.customFilter) || { $and: [] };

    if (nextFilterPredicates?.custom_filter_predicate) queryfilter.$and.push(nextFilterPredicates.custom_filter_predicate);
    if (nextFilterPredicates?.search_predicate) queryfilter.$and.push(nextFilterPredicates.search_predicate);
    if (nextFilterPredicates?.saved_filter_predicate) queryfilter.$and.push(nextFilterPredicates.saved_filter_predicate);
    if (nextFilterPredicates?.predefined_search_predicate) queryfilter.$and.push(nextFilterPredicates.predefined_search_predicate);

    latestFiltersRef.current = queryfilter;

    const updatedFilterPredicates = structuredClone(nextFilterPredicates || {});
    updatedFilterPredicates.persistFilter = persistFilter;
    latestFilterPredicatesRef.current = updatedFilterPredicates;

    setFilters(queryfilter);
    setFilterPredicates(updatedFilterPredicates);

    const grouping_rules = updatedFilterPredicates.grouping_rules;
    const aggregation_rules = updatedFilterPredicates.aggregation_rules;

    setGroupingRules(Array.isArray(grouping_rules) ? grouping_rules : []);
    setAggregationRules(Array.isArray(aggregation_rules) ? aggregation_rules : []);
  };

  // ─── Bulk delete ──────────────────────────────────────────────────────────


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
        setDeleteRecordsDialogVisible(false);
      })
      .catch((error) => {
        dispatch(showToast({ severity: 'error', summary: 'Delete Failed', detail: error?.data?.message, life: 4000 }));
      });
  };

  // handle closing of the delete dialog...
  const onDeleteClose = () => {
    setDeleteRecordsDialogVisible(false);
    setSelectedRecords([]);
    setSelectedRecoverRecords([]);
  };


  const recoverAll = () => {
    let recoverList: any = [];
    selectedRecoverRecords.forEach((element: any) => {
      recoverList.push(element.id);
    });
    triggerRecoverSolidEntities(recoverList);
    setRecoverDialogVisible(false);
  };


  const handleFetchUpdatedRecords = () => {
    // setQueryString();
  };

  // ─── Column rendering ─────────────────────────────────────────────────────

  const renderColumnsDynamically = () => {
    if (!solidTreeViewMetaData?.data || !solidTreeViewLayout) return null;

    const solidFieldsMetadata = solidTreeViewMetaData.data.solidFieldsMetadata;
    if (!solidFieldsMetadata) return null;

    return solidTreeViewLayout.children?.map((column: any) => {
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];
      if (!fieldMetadata) return null;

      const visibleToRole = column?.attrs?.roles || [];
      if (visibleToRole.length > 0 && !hasAnyRole(user?.roles, visibleToRole)) return null;

      const listColumn = SolidListViewColumn({
        solidListViewMetaData: solidTreeViewMetaData,
        fieldMetadata,
        column,
        setLightboxUrls: () => { },
        setOpenLightbox: () => { },
      });

      if (!React.isValidElement(listColumn)) return null;

      const originalBody = (listColumn as any)?.props?.body;
      const originalProps = (listColumn as any)?.props || {};
      const mergedColumnStyle = {
        minWidth: "12rem",
        ...(originalProps.style || {}),
      };

      return (
        <SolidTreeColumn
          key={`tree-col-${fieldMetadata.name}`}
          field={originalProps.field ?? fieldMetadata.name}
          header={originalProps.header}
          sortable={originalProps.sortable}
          style={mergedColumnStyle}
          className={originalProps.className}
          headerClassName={originalProps.headerClassName}
          bodyClassName={originalProps.bodyClassName}
          align={originalProps.align}
          alignHeader={originalProps.alignHeader}
          body={(node: any, options: any) => {
            const rowData = node?.data ?? node;
            const nodeMeta = rowData?.__treeMeta;

            if (nodeMeta?.nodeType === "group") return <span>&nbsp;</span>;

            if (typeof originalBody === "function") return originalBody(rowData, options);

            return rowData?.[fieldMetadata.name] ?? <span>&nbsp;</span>;
          }}
        />
      );
    });
  };

  const renderAggregateColumns = () => {
    if (activeGroupingRules.length === 0) return null;

    const derivedAggregates = buildAggregates();
    // derivedAggregates is an array like ["id:count", "price:sum"]
    // We want to render columns for each of these.

    return derivedAggregates.map((agg) => {
      const [field, operator] = agg.split(":");
      const responseKey = `${field}_${operator}`;
      const fieldMeta = getFieldMetadata(field);
      const fieldLabel = fieldMeta?.displayName ?? formatHeader(field);
      const operatorLabel = operator.toUpperCase();
      const fullHeader = `${fieldLabel} ${operatorLabel}`;

      return (
        <SolidTreeColumn
          key={`agg-col-${agg}`}
          field={responseKey}
          header={(
            <div className="solid-tree-aggregate-header" title={fullHeader}>
              <span className="solid-tree-aggregate-header-field">{fieldLabel}</span>
              <span className="solid-tree-aggregate-header-op">{operatorLabel}</span>
            </div>
          )}
          sortable
          frozen
          alignFrozen="right"
          align="right"
          alignHeader="right"
          style={{ width: "7rem", minWidth: "7rem", maxWidth: "7rem" }}
          headerClassName="solid-tree-aggregate-header-cell"
          bodyClassName="solid-tree-aggregate-body-cell"
          body={(node: any) => {
            const rowData = node?.data ?? node;
            const nodeMeta = rowData?.__treeMeta;

            if (nodeMeta?.nodeType !== "group") return <span>&nbsp;</span>;

            const value = nodeMeta?.aggregates?.[responseKey];
            return <span className="solid-tree-aggregate-value">{value ?? 0}</span>;
          }}
        />
      );
    });
  };

  // ─── Group column body: label + child pagination controls ─────────────────

  const groupColumnBody = (node: TreeNode) => {
    const rowData = node?.data as TreeRowData;
    const nodeMeta = rowData?.__treeMeta;

    if (nodeMeta?.nodeType !== "group") return <span>&nbsp;</span>;

    const label = nodeMeta.groupLabel ?? "";
    return (
      <div className="solid-tree-group-label">
        <span className="font-semibold solid-tree-group-label-text">{label}</span>
      </div>
    );
  };

  // ─── Root pagination bar ──────────────────────────────────────────────────

  const RootPaginationBar = () => {
    if (activeGroupingRules.length === 0) return null;

    const { offset, limit, total } = getPagination("root");
    const rootHasPrev = hasPrev("root");
    const rootHasNext = hasNext("root");
    const start = total === 0 ? 0 : offset + 1;
    const end = total === 0 ? 0 : Math.min(offset + limit, total);

    return (
      <div className="w-full solid-table-paginator solid-table-paginator-align-end flex items-center justify-end gap-3 text-sm rounded-md border border-border/60 px-3 py-1.5 bg-background">
        <div className="solid-paginator-meta flex items-center gap-2 ml-auto">
          <span className="solid-paginator-label">Rows</span>
          <select
            value={limit}
            onChange={(event) => {
              setGlobalLimit(Number(event.target.value));
            }}
            className="solid-paginator-select"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="solid-paginator-report">{start} - {end} of {total}</span>
        </div>
        <div className="solid-paginator-actions flex items-center gap-2">
          <button
            type="button"
            className="solid-paginator-btn"
            onClick={() => { void handleRootPageChange("prev"); }}
            disabled={!rootHasPrev || treeLoading}
          >
            Previous
          </button>
          <button
            type="button"
            className="solid-paginator-btn"
            onClick={() => { void handleRootPageChange("next"); }}
            disabled={!rootHasNext || treeLoading}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const openGroupingBuilder = () => {
    solidGlobalSearchElementRef.current?.openGroupingDialog?.();
  };

  // ─── Imperative handle ────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    refresh: () => { void loadRootGroups(getPagination("root").offset); },
    clearFilters: () => {
      setFilters(params.customFilter || { $and: [] });
      solidGlobalSearchElementRef.current?.clearFilter?.();
    },
    applyFilter: (filter) => { handleApplyCustomFilter(filter); },
    setPagination: (nextFirst: number, nextRows: number) => {
      const currentLimit = getPagination("root").limit;
      if (nextRows !== currentLimit) {
        setGlobalLimit(nextRows);
        void loadRootGroups(0);
        return;
      }
      void loadRootGroups(nextFirst);
    },
    setSort: (nextSortField: string, nextSortOrder: 1 | -1 | 0) => {
      setSortField(nextSortField);
      setSortOrder(nextSortOrder);
    },
    setShowArchived: () => { /* archived toggle for grouped tree will be wired later */ },
    getState: () => ({
      first: getPagination("root").offset,
      rows: getPagination("root").limit,
      sortField,
      sortOrder: sortOrder as any,
      showArchived: false,
      filters,
      filterPredicates,
      listData: treeNodes,
      totalRecords: getPagination("root").total,
      loading: treeLoading,
    }),
  }), [filters, filterPredicates, params.customFilter, treeLoading, treeNodes, paginationMap]);


  const handleCustomButtonClick = useHandleListCustomButtonClick();

  const [selectedSolidViewData, setSelectedSolidViewData] = useState<any>();
  const [deleteEntity, setDeleteEntity] = useState(false);
  const openRowForEdit = (rowData: any, viewMode: "edit" | "view") => {
    try {
      sessionStorage.setItem("fromView", "tree");
      sessionStorage.setItem("fromViewUrl", window.location.pathname + window.location.search);
    } catch (e) { }

    router.push(
      `${editBaseUrl}/${rowData?.id}?viewMode=${viewMode}&${new URLSearchParams(editActionQueryParams).toString()}`
    );
  };

  const canEditRow = (rowData: any, inContextMenu = false) =>
    actionsAllowed.includes(permissionExpression(params.modelName, "update")) &&
    solidTreeViewLayout?.attrs?.edit !== false &&
    (!inContextMenu || solidTreeViewLayout?.attrs?.showDefaultEditButton !== false) &&
    (!inContextMenu || solidTreeViewLayout?.attrs?.showRowEditInContextMenu !== false) &&
    !(isDraftPublishWorkflowEnabled && rowData?.publishedAt);

  const canDeleteRow = (rowData: any, inContextMenu = false) =>
    actionsAllowed.includes(permissionExpression(params.modelName, "delete")) &&
    solidTreeViewLayout?.attrs?.delete !== false &&
    (!inContextMenu
      ? params.embeded ||
      (solidTreeViewLayout?.attrs?.showRowDeleteInContextMenu !== undefined &&
        solidTreeViewLayout?.attrs?.showRowDeleteInContextMenu !== true)
      : solidTreeViewLayout?.attrs?.showRowDeleteInContextMenu !== false) &&
    !(isDraftPublishWorkflowEnabled && rowData?.publishedAt);

  const getContextMenuButtons = (rowData: any) =>
    (solidTreeViewLayout?.attrs?.rowButtons || []).filter((rb: any) => {
      const roles = rb?.attrs?.roles || [];
      return (
        rb?.attrs?.actionInContextMenu === true &&
        rb?.attrs?.visible !== false &&
        (roles.length === 0 || hasAnyRole(user?.roles, roles))
      );
    });


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
        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.DELETE_FAIELD, detail: response?.error?.data?.error, sticky: true }));
      }
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.DELETE_FAIELD, detail: ERROR_MESSAGES.SOMETHING_WRONG, sticky: true }));
    }
  };

  const renderRowActions = (rowData: any) => {
    const customContextMenuButtons = getContextMenuButtons(rowData);
    const hasAnyContextMenuActions =
      canEditRow(rowData, true) ||
      canDeleteRow(rowData, true) ||
      customContextMenuButtons.length > 0;

    return (
      <div className="flex align-items-center justify-content-end gap-1" onClick={(event) => event.stopPropagation()}>

        {/* ---------------- CUSTOM ROW BUTTONS ---------------- */}
        {solidTreeViewLayout?.attrs?.rowButtons &&
          solidTreeViewLayout?.attrs?.rowButtons
            .filter((rb: any) => {
              const roles = rb?.attrs?.roles || [];
              const isInContextMenu = rb.attrs.actionInContextMenu === true;

              const isAllowed =
                roles.length === 0 || hasAnyRole(user?.roles, roles);

              const isVisible = rb?.attrs?.visible !== false;

              return !isInContextMenu && isAllowed && isVisible;
            })
            .map((button: any, index: number) => (
              <SolidButton
                key={index}
                type="button"
                icon={button?.attrs?.icon ?? "pi pi-pencil"}
                className={`gap-2 ${button?.attrs?.className ?? ""}`}
                label={
                  button.attrs.showLabel !== false
                    ? button.attrs.label
                    : ""
                }
                size="sm"
                iconPos="left"
                onClick={() => {
                  const event = {
                    params,
                    rowData: rowData,
                    solidListViewMetaData: solidTreeViewMetaData?.data,
                  };
                  handleCustomButtonClick(button.attrs, event);
                }}
              />
            ))}

        {/* ---------------- EDIT BUTTON ---------------- */}
        {actionsAllowed.includes(
          `${permissionExpression(params.modelName, "update")}`
        ) &&
          solidTreeViewLayout?.attrs?.edit !== false &&
          solidTreeViewLayout?.attrs?.showRowEditInContextMenu === false && (
            <SolidButton
              variant="ghost"
              size="sm"
              leftIcon={<Pencil size={14} />}
              className="solid-tree-row-action-icon"
              onClick={() => openRowForEdit(rowData, "edit")}
            />
          )}

        {/* ---------------- DELETE BUTTON ---------------- */}
        {actionsAllowed.includes(
          `${permissionExpression(params.modelName, "delete")}`
        ) &&
          solidTreeViewLayout?.attrs?.delete !== false &&
          (params.embeded ||
            (solidTreeViewLayout?.attrs?.showRowDeleteInContextMenu !==
              undefined &&
              solidTreeViewLayout?.attrs?.showRowDeleteInContextMenu !==
              true)) && (
            <SolidButton
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              className="solid-tree-row-action-icon is-danger"
              onClick={() => {
                setSelectedSolidViewData(rowData);
                setDeleteEntity(true);
              }}
            />
          )}

        {/* ---------------- CONTEXT MENU ---------------- */}
        {hasAnyContextMenuActions && (
          <SolidDropdownMenu>
            <SolidDropdownMenuTrigger asChild>
              <button
                type="button"
                className="solid-tree-row-menu-trigger"
                aria-label="Open row actions"
                data-no-row-click="true"
              >
                <EllipsisVertical size={16} />
              </button>
            </SolidDropdownMenuTrigger>
            <SolidDropdownMenuContent className="solid-tree-row-menu">
              {canEditRow(rowData, true) ? (
                <SolidDropdownMenuItem onSelect={() => openRowForEdit(rowData, "edit")}>
                  <Pencil size={14} />
                  <span>Edit</span>
                </SolidDropdownMenuItem>
              ) : null}
              {canDeleteRow(rowData, true) && !params.embeded ? (
                <SolidDropdownMenuItem
                  className="is-danger"
                  onSelect={() => {
                    setSelectedSolidViewData(rowData);
                    setDeleteEntity(true);
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </SolidDropdownMenuItem>
              ) : null}
              {customContextMenuButtons.length > 0 &&
                (canEditRow(rowData, true) || (canDeleteRow(rowData, true) && !params.embeded)) ? (
                <SolidDropdownMenuSeparator />
              ) : null}
              {customContextMenuButtons.map((button: any, index: number) => (
                <SolidDropdownMenuItem
                  key={`${rowData?.id || "row"}-${button?.attrs?.label || index}`}
                  onSelect={() => {
                    const event = {
                      params,
                      rowData,
                      solidListViewMetaData: solidTreeViewMetaData?.data,
                    };
                    handleCustomButtonClick(button.attrs, event);
                  }}
                >
                  {button?.attrs?.icon ? <i className={button.attrs.icon} aria-hidden="true" /> : <Pencil size={14} />}
                  <span>{button?.attrs?.label}</span>
                </SolidDropdownMenuItem>
              ))}
            </SolidDropdownMenuContent>
          </SolidDropdownMenu>
        )}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-parent-wrapper solid-list-page-wrapper solid-tree-page-wrapper flex h-full min-h-0 overflow-hidden">
      <div className="solid-list-content h-full flex flex-column flex-grow-1">
        <div className="solid-list-surface solid-tree-surface flex flex-column flex-1 min-h-0">
          {/* ── Header ── */}
          <div className="page-header solid-list-toolbar solid-tree-toolbar flex-column lg:flex-row">
            <div className="flex justify-content-between w-full">
              <div className="flex gap-3 align-items-center w-full solid-list-toolbar-left">
                <div className="flex align-items-center gap-2">
                  {params.embeded !== true && (
                    <div className="apps-icon block md:hidden cursor-pointer" onClick={toggleBothSidebars}>
                      <SolidIcon name="si-th-large" />
                    </div>
                  )}
                  <p className="m-0 view-title solid-text-wrapper">{treeViewTitle}</p>
                </div>

                {solidTreeViewMetaData?.data?.solidView?.layout?.attrs.enableGlobalSearch === true && (
                  <div className="hidden lg:flex">
                    <SolidGlobalSearchElement
                      viewType="tree"
                      showSaveFilterPopup={showSaveFilterPopup}
                      setShowSaveFilterPopup={setShowSaveFilterPopup}
                      ref={solidGlobalSearchElementRef}
                      viewData={solidTreeViewMetaData}
                      handleApplyCustomFilter={handleApplyCustomFilter}
                    />
                  </div>
                )}
              </div>

              <div className="flex align-items-center solid-header-buttons-wrapper solid-list-toolbar-actions">
                {headerRequestStatusLabel ? <SolidHeaderRequestStatus label={headerRequestStatusLabel} /> : null}

                {solidTreeViewMetaData?.data?.solidView?.layout?.attrs.enableGlobalSearch === true && (
                  <div className="flex lg:hidden">
                    <SolidButton
                      type="button"
                      size="sm"
                      variant="outline"
                      leftIcon={<Search size={14} />}
                      className="solid-icon-button"
                      onClick={() => setShowGlobalSearchElement(!showGlobalSearchElement)}
                    />
                  </div>
                )}

                {actionsAllowed.includes(`${permissionExpression(params.modelName, "create")}`) &&
                  solidTreeViewMetaData?.data?.solidView?.layout?.attrs.create !== false && (
                    <SolidCreateButton
                      createButtonUrl={createButtonUrl}
                      createActionQueryParams={createActionQueryParams}
                      responsiveIconOnly={true}
                    />
                  )}

                {actionsAllowed.includes(`${permissionExpression(params.modelName, "delete")}`) &&
                  solidTreeViewMetaData?.data?.solidView?.layout?.attrs.delete !== false &&
                  selectedRecords.length > 0 && (
                    <SolidButton
                      type="button"
                      label="Delete"
                      size="sm"
                      onClick={() => setDeleteRecordsDialogVisible(true)}
                      className="small-button"
                      severity="danger"
                    />
                  )}

                <SolidButton
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<RefreshCw size={14} />}
                  className="solid-icon-button"
                  onClick={() => { void loadRootGroups(getPagination("root").offset); }}
                />
                {showArchived && (
                  <SolidButton
                    type="button"
                    label="Recover"
                    size="sm"
                    variant="outline"
                    leftIcon={<RefreshCw size={14} />}
                    className="hidden lg:flex solid-icon-button "
                    onClick={() => setRecoverDialogVisible(true)}
                  />
                )}

                {params.embeded === false &&
                  solidTreeViewLayout?.attrs?.configureView !== false && (
                    <SolidListViewConfigure
                      listViewMetaData={solidTreeViewMetaData}
                      solidListViewLayout={solidTreeViewLayout}
                      setShowArchived={setShowArchived}
                      showArchived={showArchived}
                      viewData={solidTreeViewMetaData}
                      sizeOptions={sizeOptions}
                      setSize={setSize}
                      size={size}
                      viewModes={viewModes}
                      params={params}
                      actionsAllowed={actionsAllowed}
                      selectedRecords={selectedRecords}
                      setDialogVisible={setDeleteRecordsDialogVisible}
                      setShowSaveFilterPopup={setShowSaveFilterPopup}
                      filters={filters}
                      handleFetchUpdatedRecords={handleFetchUpdatedRecords}
                      setRecoverDialogVisible={setRecoverDialogVisible}
                    />
                  )}
              </div>
            </div>

            {solidTreeViewMetaData?.data?.solidView?.layout?.attrs.enableGlobalSearch === true &&
              showGlobalSearchElement && (
                <div className="flex lg:hidden">
                  <SolidGlobalSearchElement
                    viewType="tree"
                    showSaveFilterPopup={showSaveFilterPopup}
                    setShowSaveFilterPopup={setShowSaveFilterPopup}
                    ref={solidGlobalSearchElementRef}
                    viewData={solidTreeViewMetaData}
                    handleApplyCustomFilter={handleApplyCustomFilter}
                  />
                </div>
              )}
          </div>

          {/* ── Tree table ── */}
          <div className="solid-datatable-wrapper solid-list-table-area solid-tree-table-area flex-1 min-h-0 overflow-hidden">
            {activeGroupingRules.length === 0 ? (
              <div className="solid-empty-listview-placeholder-container solid-tree-empty-state">
                <div className="solid-empty-listview-placeholder-panel">
                  <div className="solid-empty-listview-header">
                    <div className="solid-empty-listview-header-title">{treeViewTitle || "Tree View"}</div>
                    <div className="solid-empty-listview-header-subtitle">
                      Build a grouping structure to explore your data in hierarchical levels.
                    </div>
                  </div>

                  <div className="solid-empty-listview-body">
                    <div className="solid-empty-listview-title">
                      No grouping rules applied
                    </div>
                    <div className="solid-empty-listview-actions">
                      <SolidButton
                        type="button"
                        variant="primary"
                        size="small"
                        leftIcon={<Plus size={14} />}
                        onClick={openGroupingBuilder}
                      >
                        Create Groups
                      </SolidButton>
                    </div>

                    <div className="solid-empty-listview-description">
                      Start by adding grouping rules and optional aggregations for this tree view.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <SolidTreeTable
                value={treeNodes}
                loading={treeLoading}
                expandedKeys={expandedKeys}
                onToggle={(event: any) => setExpandedKeys(event.value)}
                onExpand={handleNodeExpand}
                tableStyle={{ minWidth: "max-content" }}
                tableClassName="solid-data-table"
                selectionMode="checkbox"
                selectionKeys={selectedNodeKeys}
                sortField={sortField}
                sortOrder={sortOrder as any}
                removableSort
                onSort={(e) => {
                  setSortField(e.sortField || "");
                  setSortOrder((e.sortOrder as any) || 0);
                }}
                onRowClick={(e) => {
                  if (e.node.leaf !== true) return;
                  const rowData = e.node.data;

                  if (solidTreeViewLayout?.attrs?.disableRowClick === true) return;

                  const hasFindPermission = actionsAllowed.includes(
                    permissionExpression(params.modelName, 'findOne')
                  );
                  const hasUpdatePermission =
                    actionsAllowed.includes(permissionExpression(params.modelName, 'update')) &&
                    solidTreeViewLayout?.attrs?.edit !== false;

                  if (!(hasFindPermission || hasUpdatePermission)) return;

                  // if (params.embeded === true) {
                  // params.handleEditClickForEmbeddedView(rowData?.id);
                  // } else {
                  if (typeof window !== "undefined") {
                    // store a simple marker for the caller

                    // also store the full current URL so Back can restore exact state (including action params)
                    try {
                      sessionStorage.setItem("fromView", "tree");
                      sessionStorage.setItem("fromViewUrl", window.location.pathname + window.location.search);
                    } catch (e) {
                      // ignore storage errors
                    }
                  }
                  router.push(`${editBaseUrl}/${rowData?.id}?viewMode=view&${new URLSearchParams(editActionQueryParams).toString()}`);
                  // }
                }
                }
                onSelectionChange={(e) => {
                  e.originalEvent.stopPropagation?.();
                  const incoming = e.value as SolidTreeSelectionKeys;

                  setSelectedNodeKeys((prev: SolidTreeSelectionKeys) => {
                    const next: SolidTreeSelectionKeys = {};

                    Object.keys(incoming).forEach((key) => {
                      // Find the node to get its type
                      const node = findNodeByKey(treeNodes, key);
                      next[key] = {
                        ...incoming[key],                              // checked, partialChecked from PrimeReact
                        nodeType: node?.data?.__treeMeta?.nodeType     // add type from tree
                          ?? prev[key]?.nodeType,                      // fallback to prev if node not found
                      };
                    });

                    return next;
                  });
                }}

              >
                <SolidTreeColumn
                  key="tree-group-column"
                  field="__group"
                  header="Group"
                  sortable
                  frozen
                  alignFrozen="left"
                  expander={(node: any) => node?.data?.__treeMeta?.nodeType === "group"}
                  body={groupColumnBody}
                  headerClassName="solid-tree-group-header-cell"
                  bodyClassName="solid-tree-group-body-cell"
                  style={{ width: "max-content", minWidth: "20rem" }}
                />

                {renderColumnsDynamically()}
                {renderAggregateColumns()}

                <SolidTreeColumn
                  key="tree-last-frozen-column"
                  header=""
                  frozen
                  alignFrozen="right"
                  style={{ width: "9rem", minWidth: "9rem", maxWidth: "9rem" }}
                  className="solid-tree-actions-cell"
                  headerClassName="solid-tree-actions-cell"
                  body={(node: any) => {
                    const rowData = node?.data as TreeRowData;
                    const nodeMeta = rowData?.__treeMeta;

                    // ---------------- NORMAL ROW ----------------
                    if (nodeMeta?.nodeType !== "group") {
                      return renderRowActions(rowData);
                    }

                    // ---------------- GROUP ROW ----------------
                    const nodeKey = String(node.key);
                    const isExpanded = expandedKeys[nodeKey];
                    const childrenLoaded = isExpanded && node.children && node.children.length > 0;
                    if (!childrenLoaded) return <span>&nbsp;</span>;

                    const canPrev = hasPrev(nodeKey);
                    const canNext = hasNext(nodeKey);

                    return (
                      <div
                        className="solid-tree-node-paginator"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SolidButton
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<ChevronLeft size={14} />}
                          disabled={!canPrev || treeLoading}
                          className="solid-tree-paginator-btn"
                          onClick={() => handleNodePageChange(nodeKey, "prev")}
                        />
                        <SolidButton
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<ChevronRight size={14} />}
                          disabled={!canNext || treeLoading}
                          className="solid-tree-paginator-btn"
                          onClick={() => handleNodePageChange(nodeKey, "next")}
                        />
                      </div>
                    );
                  }}
                />
              </SolidTreeTable>
            )}
          </div>

          {/* ── Root-level pagination bar ── */}
          <RootPaginationBar />
        </div>
      </div>

      <SolidDialog
        open={deleteEntity}
        onOpenChange={(open) => {
          if (!open) setDeleteEntity(false);
        }}
        contentClassName="solid-confirm-dialog solid-tree-confirm-dialog"
        showHeader={false}
      >
        <SolidDialogHeader>
          <SolidDialogTitle>
            Delete {solidTreeViewMetaData?.data?.solidView?.model?.displayName || params?.modelName}
          </SolidDialogTitle>
        </SolidDialogHeader>
        <SolidDialogSeparator />
        <SolidDialogBody>
          <SolidDialogDescription className="m-0">
            {`Are you sure you want to delete this ${solidTreeViewMetaData?.data?.solidView?.model?.displayName || params?.modelName}?`}
          </SolidDialogDescription>
        </SolidDialogBody>
        <SolidDialogFooter>
          <SolidButton label="Cancel" size="sm" variant="outline" onClick={() => setDeleteEntity(false)} />
          <SolidButton label="Delete" size="sm" severity="danger" onClick={handleDeleteEntity} />
        </SolidDialogFooter>
      </SolidDialog>

      <SolidDialog
        open={isDeleteRecordsDialogVisible}
        onOpenChange={(open) => {
          if (!open) setDeleteRecordsDialogVisible(false);
        }}
        contentClassName="solid-confirm-dialog solid-tree-confirm-dialog"
        showHeader={false}
      >
        <SolidDialogHeader>
          <SolidDialogTitle>Confirm Delete</SolidDialogTitle>
        </SolidDialogHeader>
        <SolidDialogSeparator />
        <SolidDialogBody>
          <SolidDialogDescription className="m-0">
            Are you sure you want to delete the selected records?
          </SolidDialogDescription>
        </SolidDialogBody>
        <SolidDialogFooter>
          <SolidButton label="Cancel" size="sm" variant="outline" onClick={onDeleteClose} />
          <SolidButton label="Delete" size="sm" severity="danger" onClick={deleteBulk} />
        </SolidDialogFooter>
      </SolidDialog>

      <SolidDialog
        open={isRecoverDialogVisible}
        onOpenChange={(open) => {
          if (!open) setRecoverDialogVisible(false);
        }}
        contentClassName="solid-confirm-dialog solid-tree-confirm-dialog"
        showHeader={false}
      >
        <SolidDialogHeader>
          <SolidDialogTitle>Confirm Recover</SolidDialogTitle>
        </SolidDialogHeader>
        <SolidDialogSeparator />
        <SolidDialogBody>
          <SolidDialogDescription className="m-0">
            Are you sure you want to recover all records?
          </SolidDialogDescription>
        </SolidDialogBody>
        <SolidDialogFooter>
          <SolidButton label="No" size="sm" variant="outline" onClick={() => setRecoverDialogVisible(false)} />
          <SolidButton label="Yes" size="sm" severity="danger" onClick={recoverAll} />
        </SolidDialogFooter>
      </SolidDialog>

    </div>
  );
});

SolidTreeView.displayName = "SolidTreeView";
