import { getCollectionViewPermissionNames, permissionExpression } from "../../../helpers/permissions";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "../../../redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "../../../redux/api/userApi";
import qs from "qs";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useSession } from "../../../hooks/useSession";
import { resolveActiveUserId, resolveSavedFilterVariables } from "../../../helpers/resolveActiveUserId";
import { SolidLightbox } from "../../shad-cn-ui/SolidLightbox";
import type { SolidLightboxSlide } from "../../shad-cn-ui/SolidLightbox";
import { getMediaTypeFromUrl } from "../../../helpers/mediaType";
import { useDispatch, useSelector } from "react-redux";
import { showNavbar, toggleNavbar } from "../../../redux/features/navbarSlice";
import { usePathname } from "../../../hooks/usePathname";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { SolidHeaderRequestStatus } from "../../common/SolidHeaderRequestStatus";
import { useGetSolidSettingsQuery } from "../../../redux/api/solidSettingsApi";
import { getSettingsMap, resolveRecordClickAction } from "../../../helpers/settingsPayload";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import { SolidEmptyListViewPlaceholder } from "../list/SolidEmptyListViewPlaceholder";
import { getFilterObjectFromLocalStorage,hasMeaningfulPersistedFilter,hasStoredFilterPredicates, setFilterObjectToLocalStorage} from "../common/globalSearchPersistence";
import { normalizeSolidListTreeKanbanActionPath } from "../../../helpers/routePaths";
import { SolidCardViewConfigure } from "./SolidCardViewConfigure";
import { CardGrid } from "./CardGrid";
import { CardUserViewLayout } from "./CardUserViewLayout";
import {
  SolidButton,
  SolidConfirmDialog,
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidIcon,
  SolidSelect,
} from "../../shad-cn-ui";
import { showToast } from "../../../redux/features/toastSlice";
import { isButtonVisibleInCurrentEnv } from "../../../helpers/buttonEnvironment";
import { useHandleListCustomButtonClick } from "../../common/useHandleListCustomButtonClick";
import { SolidListViewHeaderButton } from "../list/SolidListViewHeaderButton";

type SolidCardViewParams = {
  moduleName: string;
  modelName: string;
  embeded: boolean;
  customFilter?: any;
};

type SolidCardFilterInput = {
  custom_filter_predicate?: any;
  search_predicate?: any;
  saved_filter_predicate?: any;
  predefined_search_predicate?: any;
};

export type SolidCardViewHandle = {
  refresh: () => void;
  clearFilters: () => void;
  applyFilter: (filter: SolidCardFilterInput) => void;
  getSavedFilters: () => any[];
  applySavedFilter: (name: string, variables?: Record<string, any>) => boolean;
  setPagination: (nextFirst: number, nextRows: number) => void;
  setShowArchived: (value: boolean) => void;
  getState: () => {
    first: number;
    rows: number;
    showArchived: boolean;
    filters: any;
    filterPredicates: any;
    cards: any[];
    totalRecords: number;
    loading: boolean;
  };
};

const DEFAULT_RECORD_SORT = ["id:desc"];

const deriveCardViewConfig = (solidCardViewMetaData: any) => {
  const solidView = solidCardViewMetaData?.data?.solidView;
  const solidFieldsMetadata = solidCardViewMetaData?.data?.solidFieldsMetadata || {};
  const layoutAttrs = solidView?.layout?.attrs || {};
  const toPopulate: string[] = [];
  const toPopulateMedia: string[] = [];

  const findCardNode = (nodes: any[] = []): any => {
    for (const node of nodes) {
      if (!node) continue;
      if (node.type === "card") return node;
      if (Array.isArray(node.children) && node.children.length > 0) {
        const nestedCard = findCardNode(node.children);
        if (nestedCard) return nestedCard;
      }
    }

    return null;
  };

  const extractFields = (nodes: any, result: any[] = []) => {
    if (!nodes) return result;

    if (Array.isArray(nodes)) {
      nodes.forEach((node: any) => extractFields(node, result));
      return result;
    }

    if (nodes.type === "field") {
      result.push(nodes);
    }
    if (Array.isArray(nodes.children)) {
      nodes.children.forEach((child: any) => extractFields(child, result));
    }
    return result;
  };

  const cardNode = findCardNode(solidView?.layout?.children || []);
  const fieldSource = cardNode?.children?.length ? cardNode.children : solidView?.layout?.children || [];
  const layoutFields = extractFields(fieldSource);
  layoutFields.forEach((column: any) => {
    const fieldMetadata = solidFieldsMetadata[column?.attrs?.name];
    if (!fieldMetadata) return;

    if (fieldMetadata.type === "relation") {
      toPopulate.push(fieldMetadata.name);
    }
    if (fieldMetadata.type === "mediaSingle" || fieldMetadata.type === "mediaMultiple") {
      toPopulateMedia.push(fieldMetadata.name);
    }
  });

  return {
    rows: layoutAttrs.pageSize || 24,
    pageSizeOptions: layoutAttrs.pageSizeOptions || [12, 24, 48],
    toPopulate,
    toPopulateMedia,
  };
};

export const SolidCardView = forwardRef<SolidCardViewHandle, SolidCardViewParams>((params, ref) => {
  const session = useSession();
  const user = session?.data?.user;
  const visibleNavbar = useSelector((state: any) => state.navbarState?.visibleNavbar);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const solidGlobalSearchElementRef = useRef<any>();
  const { data: solidSettingsData } = useGetSolidSettingsQuery(undefined);
  const solidSettingsMap = getSettingsMap(solidSettingsData);

  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
  const [showGlobalSearchElement, setShowGlobalSearchElement] = useState(false);
  const [filterPredicates, setFilterPredicates] = useState<any>(null);
  const [viewModes, setViewModes] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({ $and: [] });
  const [cards, setCards] = useState<any[]>([]);
  const [toPopulate, setToPopulate] = useState<string[]>([]);
  const [toPopulateMedia, setToPopulateMedia] = useState<string[]>([]);
  const [rows, setRows] = useState(24);
  const [rowsPerPageOptions, setRowsPerPageOptions] = useState<any[]>([12, 24, 48]);
  const [first, setFirst] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSaveFilterPopup, setShowSaveFilterPopup] = useState(false);
  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();
  const [createActionQueryParams, setCreateActionQueryParams] = useState<Record<string, string>>({});
  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxUrls, setLightboxUrls] = useState<any[]>([]);
  const [isLayoutDialogVisible, setLayoutDialogVisible] = useState(false);
  const [queryDataLoaded, setQueryDataLoaded] = useState(false);
  const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCardForDelete, setSelectedCardForDelete] = useState<any>(null);
  const [isDeleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const handleCustomButtonClick = useHandleListCustomButtonClick();

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

  const entityApi = createSolidEntityApi(params.modelName);
  const { useDeleteSolidEntityMutation, useLazyGetSolidEntitiesQuery, useLazyRecoverSolidEntityByIdQuery } = entityApi;
  const [triggerGetSolidEntities, { data: solidEntityCardViewData }] = useLazyGetSolidEntitiesQuery();
  const [deleteSolidEntity, { isLoading: isDeletingRecord }] = useDeleteSolidEntityMutation();
  const [triggerRecoverSolidEntityById, { isLoading: recoverByIdIsLoading }] = useLazyRecoverSolidEntityByIdQuery();

  const menuItemId = searchParams.get("menuItemId");
  const menuItemName = searchParams.get("menuItemName");
  const actionId = searchParams.get("actionId");
  const actionName = searchParams.get("actionName");

  const cardViewMetaDataQs = qs.stringify(
    {
      modelName: params.modelName,
      moduleName: params.moduleName,
      viewType: "card",
      menuItemId,
      menuItemName,
      actionId,
      actionName,
    },
    {
      encodeValuesOnly: true,
    }
  );

  const {data: solidCardViewMetaDataResponse,isLoading: solidCardViewMetaDataIsLoading,} = useGetSolidViewLayoutQuery(cardViewMetaDataQs);
  const visibleHeaderButtons = (solidCardViewMetaDataResponse?.data?.solidView?.layout?.attrs?.headerButtons ?? [])
    .filter((button: any) => isButtonVisibleInCurrentEnv(button?.attrs));

  const editBaseUrl = normalizeSolidListTreeKanbanActionPath(pathname, editButtonUrl || "form");
  const recordClickAction = resolveRecordClickAction(solidSettingsMap, {
    isSystemModule: solidCardViewMetaDataResponse?.data?.solidView?.module?.isSystem === true,
  });
  const rowsOptions = rowsPerPageOptions && rowsPerPageOptions.length > 0 ? rowsPerPageOptions : [12, 24, 48];
  const paginationStart = totalRecords === 0 ? 0 : first + 1;
  const paginationEnd = Math.min(first + rows, totalRecords);
  const totalPages = rows > 0 ? Math.max(1, Math.ceil(totalRecords / rows)) : 1;
  const currentPage = rows > 0 ? Math.floor(first / rows) + 1 : 1;
  const paginationReport = `${paginationStart} - ${paginationEnd} of ${totalRecords}`;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleRowsChange = (value: number) => {
    const nextRows = Number(value);
    setRows(nextRows);
    setFirst(0);
  };

  const handlePrevPage = () => {
    if (!canGoPrev) return;
    setFirst(Math.max(0, first - rows));
  };

  const handleNextPage = () => {
    if (!canGoNext) return;
    setFirst(Math.min((totalPages - 1) * rows, first + rows));
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!params.modelName) return;

      const permissionNames = getCollectionViewPermissionNames(params.modelName, {
        includeDeleteMany: false,
        includeFindOne: false,
        includeInsertMany: false,
      });

      const queryString = qs.stringify(
        { permissionNames },
        { encodeValuesOnly: true }
      );
      const response = await triggerCheckIfPermissionExists(queryString);
      setActionsAllowed(response.data?.data || []);
    };

    fetchPermissions();
  }, [params.modelName]);

  useEffect(() => {
    if (!solidCardViewMetaDataResponse) return;

    setViewModes(solidCardViewMetaDataResponse?.data?.viewModes || []);

    const { rows, pageSizeOptions, toPopulate, toPopulateMedia } = deriveCardViewConfig(solidCardViewMetaDataResponse);
    const persistedFilterObject = typeof window !== "undefined" ? getFilterObjectFromLocalStorage() : null;
    const restoredFilter = { $and: [] as any[] };

    if (persistedFilterObject?.custom_filter_predicate) {
      restoredFilter.$and.push(persistedFilterObject.custom_filter_predicate);
    }
    if (persistedFilterObject?.search_predicate) {
      restoredFilter.$and.push(persistedFilterObject.search_predicate);
    }
    if (persistedFilterObject?.saved_filter_predicate) {
      restoredFilter.$and.push(resolveSavedFilterVariables(
        persistedFilterObject.saved_filter_predicate,
        user?.id,
        persistedFilterObject.saved_filter_variables || {}
      ).value);
    }
    if (persistedFilterObject?.predefined_search_predicate) {
      restoredFilter.$and.push(persistedFilterObject.predefined_search_predicate);
    }

    setRows(Number(persistedFilterObject?.limit) || rows);
    setRowsPerPageOptions(pageSizeOptions);
    setFirst(Number(persistedFilterObject?.offset) || 0);
    setShowArchived(
      persistedFilterObject?.showArchived === true ||
      persistedFilterObject?.showArchived === "true" ||
      persistedFilterObject?.showSoftDeleted === "inclusive"
    );
    setToPopulate(toPopulate);
    setToPopulateMedia(toPopulateMedia);
    setFilters(restoredFilter.$and.length > 0 ? restoredFilter : { $and: [] });
    setQueryDataLoaded(true);

    const layoutAttrs = solidCardViewMetaDataResponse?.data?.solidView?.layout?.attrs;
    const createActionUrl = layoutAttrs?.createAction && layoutAttrs?.createAction?.type === "custom"
      ? layoutAttrs?.createAction?.customComponent
      : "form/new";
    const editActionUrl = layoutAttrs?.editAction && layoutAttrs?.editAction?.type === "custom"
      ? layoutAttrs?.editAction?.customComponent
      : "form";

    if (layoutAttrs?.createAction) {
      setCreateActionQueryParams({
        actionName: layoutAttrs.createAction.name,
        actionType: layoutAttrs.createAction.type,
        actionContext: layoutAttrs.createAction.context,
      });
    }

    setCreateButtonUrl(createActionUrl);
    setEditButtonUrl(editActionUrl);
  }, [solidCardViewMetaDataResponse]);

  const loadCards = async (nextFilters = filters) => {
    if (!queryDataLoaded || !solidCardViewMetaDataResponse) return;

    setLoading(true);

    const queryData: any = {
      offset: first,
      limit: rows,
      sort: DEFAULT_RECORD_SORT,
      populate: toPopulate,
      populateMedia: toPopulateMedia,
      filters: nextFilters,
    };
    if (showArchived) {
      queryData.showSoftDeleted = "inclusive";
    }

    try {
      const data: any = await triggerGetSolidEntities(
        qs.stringify(queryData, { encodeValuesOnly: true })
      ).unwrap();

      setCards(data?.records || []);
      setTotalRecords(data?.meta?.totalRecords || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCards(filters);
  }, [filters, first, queryDataLoaded, rows, showArchived, solidCardViewMetaDataResponse, toPopulate, toPopulateMedia]);

  useEffect(() => {
    if (!solidEntityCardViewData) return;

    setCards(solidEntityCardViewData?.records || []);
    setTotalRecords(solidEntityCardViewData?.meta?.totalRecords || 0);
  }, [solidEntityCardViewData]);

  useEffect(() => {
    if (!queryDataLoaded) return;

    const persistedFilterObject = typeof window !== "undefined" ? (getFilterObjectFromLocalStorage() || {}) : {};
    const nextPersistedFilterObject: Record<string, any> = {
      ...persistedFilterObject,
      offset: first,
      limit: rows,
      showArchived,
    };

    if (showArchived) {
      nextPersistedFilterObject.showSoftDeleted = "inclusive";
    } else {
      delete nextPersistedFilterObject.showSoftDeleted;
    }

    setFilterObjectToLocalStorage(nextPersistedFilterObject);
  }, [first, queryDataLoaded, rows, showArchived]);

  const handleApplyCustomFilter = async (filterPredicates: any) => {
    const updatedFilter = { $and: [] as any[] };

    if (filterPredicates.custom_filter_predicate) {
      updatedFilter.$and.push(filterPredicates.custom_filter_predicate);
    }
    if (filterPredicates.search_predicate) {
      updatedFilter.$and.push(filterPredicates.search_predicate);
    }
    if (filterPredicates.saved_filter_predicate) {
      updatedFilter.$and.push(filterPredicates.resolved_saved_filter_predicate ||
        resolveActiveUserId(filterPredicates.saved_filter_predicate, user?.id));
    }
    if (filterPredicates.predefined_search_predicate) {
      updatedFilter.$and.push(filterPredicates.predefined_search_predicate);
    }

    setFirst(0);
    setFilterPredicates(structuredClone(filterPredicates));
    setFilters(updatedFilter);
    setFilterObjectToLocalStorage({
      offset: 0,
      limit: rows,
      showArchived,
      ...(showArchived ? { showSoftDeleted: "inclusive" } : {}),
      custom_filter_predicate: filterPredicates.custom_filter_predicate || {},
      search_predicate: filterPredicates.search_predicate || {},
      saved_filter_predicate: filterPredicates.saved_filter_predicate || {},
      saved_filter_variables: filterPredicates.saved_filter_variables || {},
      saved_filter_id: filterPredicates.saved_filter_id || null,
      saved_filter_system_key: filterPredicates.saved_filter_system_key || null,
      saved_filter_name: filterPredicates.saved_filter_name || null,
      predefined_search_predicate: filterPredicates.predefined_search_predicate || {},
      predefined_search_chip: filterPredicates.predefined_search_chip || null,
    });
  };

  const handleFetchUpdatedRecords = async () => {
    if (hasAnyActiveFilters) {
      solidGlobalSearchElementRef.current?.clearAppliedFilters?.();
      return;
    }

    await loadCards(filters);
  };

  const cloneCards = () => {
    if (typeof structuredClone === "function") return structuredClone(cards);
    return JSON.parse(JSON.stringify(cards));
  };

  useImperativeHandle(ref, () => ({
    refresh: () => {
      void loadCards(filters);
    },
    clearFilters: () => {
      setFirst(0);
      setFilters(params.customFilter || { $and: [] });
      setFilterPredicates(null);
      solidGlobalSearchElementRef.current?.clearFilter?.();
    },
    applyFilter: (filter) => {
      void handleApplyCustomFilter(filter);
    },
    getSavedFilters: () => solidGlobalSearchElementRef.current?.getSavedFilters?.() ?? [],
    applySavedFilter: (name, variables) =>
      solidGlobalSearchElementRef.current?.applySavedFilterByName?.(name, variables) ?? false,
    setPagination: (nextFirst, nextRows) => {
      setFirst(nextFirst);
      setRows(nextRows);
    },
    setShowArchived: (value) => {
      setShowArchived(value);
    },
    getState: () => ({
      first,
      rows,
      showArchived,
      filters,
      filterPredicates,
      cards: cloneCards(),
      totalRecords,
      loading,
    }),
  }), [first, rows, showArchived, filters, filterPredicates, cards, totalRecords, loading]);

  const handleRecoverRecord = async (record: any) => {
    if (!record?.id) return;

    try {
      const response: any = await triggerRecoverSolidEntityById(record.id).unwrap();
      dispatch(showToast({
        severity: "success",
        summary: "Success",
        detail: response?.data?.message || "Record recovered successfully.",
        life: 3000,
      }));
      await loadCards(filters);
    } catch (error: any) {
      dispatch(showToast({
        severity: "error",
        summary: "Recover Failed",
        detail: error?.data?.message || error?.message || "Unable to recover the selected record.",
        life: 4000,
      }));
    }
  };

  const handleOpenDeleteDialog = (record: any) => {
    setSelectedCardForDelete(record);
    setDeleteDialogVisible(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogVisible(false);
    setSelectedCardForDelete(null);
  };

  const handleDeleteRecord = async () => {
    if (!selectedCardForDelete?.id) return;

    try {
      const response: any = await deleteSolidEntity(selectedCardForDelete.id).unwrap();
      dispatch(showToast({
        severity: "success",
        summary: "Deleted",
        detail: response?.data?.message || "Record deleted successfully.",
        life: 3000,
      }));
      handleCloseDeleteDialog();
      await loadCards(filters);
    } catch (error: any) {
      dispatch(showToast({
        severity: "error",
        summary: "Delete Failed",
        detail: error?.data?.message || error?.message || "Unable to delete the selected record.",
        life: 4000,
      }));
    }
  };

  const toggleBothSidebars = () => {
    if (visibleNavbar) {
      dispatch(toggleNavbar());
    } else {
      dispatch(showNavbar());
    }
  };

  const cardViewTitle = solidCardViewMetaDataResponse?.data?.solidView?.displayName;
  const entityDisplayName = solidCardViewMetaDataResponse?.data?.solidView?.model?.displayName || params.modelName;
  const canDeleteCards = actionsAllowed.includes(`${permissionExpression(params.modelName, "delete")}`) &&
    solidCardViewMetaDataResponse?.data?.solidView?.layout?.attrs?.delete !== false &&
    solidCardViewMetaDataResponse?.data?.solidView?.layout?.attrs?.showRowDeleteInContextMenu !== false;
  const isCardViewMetaDataReady = Boolean(solidCardViewMetaDataResponse?.data?.solidView);
  const showCardBodyLoadingPlaceholder = solidCardViewMetaDataIsLoading || (isCardViewMetaDataReady && (!queryDataLoaded || (loading && cards.length === 0)));
  const hasFilterPredicatesApplied = hasStoredFilterPredicates(filterPredicates);
  const hasActiveFilters = hasMeaningfulPersistedFilter(filters);
  const hasAnyActiveFilters = hasActiveFilters || hasFilterPredicatesApplied;
  const hasStoredFilterState = hasStoredFilterPredicates(getFilterObjectFromLocalStorage());
  const showEmptyState = !loading && cards.length === 0 && !hasActiveFilters;
  const showFilteredEmptyState = !loading && cards.length === 0 && hasActiveFilters;
  const filteredEmptyMessage = solidCardViewMetaDataResponse?.data?.solidView?.model?.description || "No Entities found";
  const headerRequestStatusLabel = isDeletingRecord
    ? "Deleting..."
    : recoverByIdIsLoading
      ? "Recovering..."
      : loading || !queryDataLoaded
        ? "Loading..."
        : null;

  useEffect(() => {
    if (params.embeded === false) {
      setShowGlobalSearchElement(hasAnyActiveFilters || hasStoredFilterState);
    }
  }, [hasAnyActiveFilters, hasStoredFilterState, params.embeded]);

  return (
    <div className="page-parent-wrapper solid-list-page-wrapper flex h-full min-h-0 overflow-hidden">
      <div className="solid-list-content h-full flex way to  flex-grow-1">
        <div className="solid-list-surface solid-card-surface flex flex-col flex-1 min-h-0">
          <div className="page-header solid-list-toolbar solid-card-toolbar flex-col lg:flex-row">
            <div className="flex w-full flex-col-reverse  lg:flex-row lg:items-center  items-end">
              <div className="flex gap-4 items-center w-full solid-list-toolbar-left lg:min-w-0 lg:flex-1">
                {/* {params.embeded !== true && (
                  <div className="apps-icon block md:hidden cursor-pointer" onClick={toggleBothSidebars}>
                    <SolidIcon name="si-th-large" aria-hidden />
                  </div>
                )} */}
                {/* <p className="m-0 view-title solid-text-wrapper">{cardViewTitle}</p> */}
                {/* Base `hidden` must be avoided here: the consuming app's Tailwind CSS loads after this
                    library's generated CSS, so the app's base `.hidden` would override our media-scoped
                    `lg:flex`. Only media-scoped visibility classes are safe on this element. */}
                <div className={`${showGlobalSearchElement ? "flex" : "max-lg:hidden lg:flex"} w-full mt-3 lg:mt-0 lg:min-w-0`}>
                  <SolidGlobalSearchElement
                    viewType="card"
                    showSaveFilterPopup={showSaveFilterPopup}
                    setShowSaveFilterPopup={setShowSaveFilterPopup}
                    ref={solidGlobalSearchElementRef}
                    viewData={solidCardViewMetaDataResponse}
                    handleApplyCustomFilter={handleApplyCustomFilter}
                    filterPredicates={filterPredicates}
                  />
                </div>
              </div>

              <div className="flex items-center solid-header-buttons-wrapper solid-list-toolbar-actions lg:ml-auto">
                <SolidHeaderRequestStatus label={headerRequestStatusLabel} />
                <div className="solid-list-search-toggle">
                  <SolidButton
                    type="button"
                    variant="outline"
                    size="sm"
                    className="solid-icon-button"
                    onClick={() => setShowGlobalSearchElement(!showGlobalSearchElement)}
                    aria-label="Toggle search"
                    leftIcon={<SolidIcon name="si-search" aria-hidden />}
                  />
                </div>

                <div className="solid-header-buttons-wrapper hidden items-center lg:flex">
                  {visibleHeaderButtons
                    .filter((button: any) => button?.attrs?.actionInContextMenu !== true)
                    .map((button: any, index: number) => (
                      <SolidListViewHeaderButton
                        key={button?.attrs?.action ?? index}
                        button={button}
                        params={params}
                        solidListViewMetaData={solidCardViewMetaDataResponse}
                        handleCustomButtonClick={handleCustomButtonClick}
                        selectedRecords={[]}
                        filters={filters}
                      />
                    ))}
                </div>

                {actionsAllowed.includes(`${permissionExpression(params.modelName, "create")}`) &&
                  solidCardViewMetaDataResponse?.data?.solidView?.layout?.attrs?.create !== false && (
                    <SolidCreateButton
                      createButtonUrl={createButtonUrl}
                      createActionQueryParams={createActionQueryParams}
                      responsiveIconOnly={true}
                    />
                  )}

                <SolidButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="solid-icon-button"
                  onClick={() => handleFetchUpdatedRecords()}
                  aria-label="Refresh cards"
                  leftIcon={<SolidIcon name="si-refresh" aria-hidden />}
                />

                <SolidCardViewConfigure
                  solidCardViewMetaData={solidCardViewMetaDataResponse}
                  modelName={params.modelName}
                  actionsAllowed={actionsAllowed}
                  viewModes={viewModes}
                  setShowArchived={setShowArchived}
                  showArchived={showArchived}
                  setLayoutDialogVisible={setLayoutDialogVisible}
                  setShowSaveFilterPopup={setShowSaveFilterPopup}
                  filters={filters}
                  hasAnyActiveFilters={hasAnyActiveFilters}
                  handleRefreshView={handleFetchUpdatedRecords}
                  params={params}
                  headerButtons={visibleHeaderButtons}
                  handleCustomButtonClick={handleCustomButtonClick}
                />
              </div>
            </div>
          </div>

          <div className="solid-card-view-content">
            {showCardBodyLoadingPlaceholder ? (
              <div className="solid-view-loading-body-spacer flex-1 min-h-0" />
            ) : (
              <div className="solid-card-view-body">
                {showEmptyState ? (
                <SolidEmptyListViewPlaceholder
                  createButtonUrl={createButtonUrl}
                  createActionQueryParams={createActionQueryParams}
                  actionsAllowed={actionsAllowed}
                  params={params}
                  solidListViewMetaData={solidCardViewMetaDataResponse}
                  handleFetchUpdatedRecords={handleFetchUpdatedRecords}
                />
                ) : showFilteredEmptyState ? (
                  <div className="flex min-h-[240px] items-center justify-center rounded-md border border-border/60 bg-background px-6 py-10 text-center text-muted-foreground">
                    {filteredEmptyMessage}
                  </div>
                ) : (
                  <CardGrid
                    records={cards}
                    solidCardViewMetaData={solidCardViewMetaDataResponse?.data}
                    editButtonUrl={editBaseUrl}
                    recordClickAction={recordClickAction}
                    onDelete={canDeleteCards ? handleOpenDeleteDialog : undefined}
                    onRecover={handleRecoverRecord}
                    setLightboxUrls={setLightboxUrls}
                    setOpenLightbox={setOpenLightbox}
                    showArchived={showArchived}
                    params={params}
                    handleCustomButtonClick={handleCustomButtonClick}
                  />
                )}
              </div>
            )}

            {totalRecords > 0 && (
              <div className="solid-card-view-pagination">
                <div className="solid-card-view-pagination-bar solid-table-paginator flex items-center justify-center gap-3 text-sm rounded-md border border-border/60 px-3 py-1.5 bg-background">
                  <div className="solid-paginator-meta flex items-center gap-2">
                    <span className="solid-paginator-label">Records</span>
                    <SolidSelect
                      value={rows}
                      className="solid-paginator-select"
                      options={rowsOptions.map((option) => ({ label: String(option), value: option }))}
                      native={false}
                      onChange={(event) => handleRowsChange(Number(event.value))}
                    />
                    <span className="solid-paginator-report">{paginationReport}</span>
                  </div>
                  <div className="solid-paginator-actions flex items-center gap-2">
                    <button
                      type="button"
                      className="solid-paginator-btn"
                      onClick={handlePrevPage}
                      disabled={!canGoPrev}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="solid-paginator-btn"
                      onClick={handleNextPage}
                      disabled={!canGoNext}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {openLightbox && (
        <SolidLightbox
          open={openLightbox}
          slides={lightboxSlides}
          onClose={() => setOpenLightbox(false)}
        />
      )}

      <SolidConfirmDialog
        open={isDeleteDialogVisible}
        onCancel={handleCloseDeleteDialog}
        onConfirm={handleDeleteRecord}
        className="solid-shadcn-confirm-dialog solid-delete-confirm-dialog"
        headerClassName="solid-shadcn-dialog-head"
        bodyClassName="solid-shadcn-dialog-body"
        footerClassName="solid-shadcn-dialog-actions"
        separatorClassName="solid-shadcn-dialog-sep"
        showSeparator
        title={`Delete ${entityDisplayName}`}
        message={
          <p className="solid-shadcn-dialog-text">
            {`Are you sure you want to delete this ${entityDisplayName} record?`}
          </p>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <SolidDialog
        open={isLayoutDialogVisible}
        onOpenChange={setLayoutDialogVisible}
        className="solid-kanban-layout-dialog"
        style={{ width: "min(800px, calc(100vw - 32px))" }}
      >
        <SolidDialogHeader>
          <SolidDialogTitle>Change Card Layout</SolidDialogTitle>
          <SolidDialogClose />
        </SolidDialogHeader>
        <SolidDialogSeparator />
        <SolidDialogBody className="solid-kanban-layout-dialog-body">
          <CardUserViewLayout solidCardViewMetaData={solidCardViewMetaDataResponse} setLayoutDialogVisible={setLayoutDialogVisible} />
        </SolidDialogBody>
      </SolidDialog>
    </div>
  );
});
