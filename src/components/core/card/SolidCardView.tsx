import { permissionExpression } from "../../../helpers/permissions";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "../../../redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "../../../redux/api/userApi";
import qs from "qs";
import { useEffect, useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { Paginator } from "primereact/paginator";
import { useDispatch, useSelector } from "react-redux";
import { showNavbar, toggleNavbar } from "../../../redux/features/navbarSlice";
import { usePathname } from "../../../hooks/usePathname";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import { SolidEmptyListViewPlaceholder } from "../list/SolidEmptyListViewPlaceholder";
import { getFilterObjectFromLocalStorage, setFilterObjectToLocalStorage } from "../list/SolidListView";
import { normalizeSolidListTreeKanbanActionPath } from "../../../helpers/routePaths";
import { SolidCardViewConfigure } from "./SolidCardViewConfigure";
import { CardGrid } from "./CardGrid";
import { CardUserViewLayout } from "./CardUserViewLayout";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "../../shad-cn-ui";

type SolidCardViewParams = {
  moduleName: string;
  modelName: string;
  embeded: boolean;
};

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

export const SolidCardView = (params: SolidCardViewParams) => {
  const visibleNavbar = useSelector((state: any) => state.navbarState?.visibleNavbar);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const solidGlobalSearchElementRef = useRef<any>();

  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
  const [showGlobalSearchElement, setShowGlobalSearchElement] = useState(false);
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
  const [lightboxUrls, setLightboxUrls] = useState({});
  const [isLayoutDialogVisible, setLayoutDialogVisible] = useState(false);
  const [queryDataLoaded, setQueryDataLoaded] = useState(false);
  const [solidCardViewMetaData, setSolidCardViewMetaData] = useState<any>();
  const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();

  const entityApi = createSolidEntityApi(params.modelName);
  const { useLazyGetSolidEntitiesQuery } = entityApi;
  const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

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

  const { data: solidCardViewMetaDataResponse } = useGetSolidViewLayoutQuery(cardViewMetaDataQs);

  const editBaseUrl = normalizeSolidListTreeKanbanActionPath(pathname, editButtonUrl || "form");

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!params.modelName) return;

      const permissionNames = [
        permissionExpression(params.modelName, "create"),
        permissionExpression(params.modelName, "update"),
        permissionExpression(params.modelName, "findMany"),
        permissionExpression("importTransaction", "create"),
        permissionExpression("exportTransaction", "create"),
        permissionExpression("userViewMetadata", "create"),
        permissionExpression("savedFilters", "create"),
      ];

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

    setSolidCardViewMetaData(solidCardViewMetaDataResponse);
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
      restoredFilter.$and.push(persistedFilterObject.saved_filter_predicate);
    }
    if (persistedFilterObject?.predefined_search_predicate) {
      restoredFilter.$and.push(persistedFilterObject.predefined_search_predicate);
    }

    setRows(Number(persistedFilterObject?.limit) || rows);
    setRowsPerPageOptions(pageSizeOptions);
    setFirst(Number(persistedFilterObject?.offset) || 0);
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

  useEffect(() => {
    const fetchCards = async () => {
      if (!queryDataLoaded || !solidCardViewMetaDataResponse) return;

      setLoading(true);

      const queryData = {
        offset: first,
        limit: rows,
        populate: toPopulate,
        populateMedia: toPopulateMedia,
        filters,
      };

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

    fetchCards();
  }, [queryDataLoaded, first, rows, toPopulate, toPopulateMedia, filters, solidCardViewMetaDataResponse]);

  const handleApplyCustomFilter = async (filterPredicates: any) => {
    const updatedFilter = { $and: [] as any[] };

    if (filterPredicates.custom_filter_predicate) {
      updatedFilter.$and.push(filterPredicates.custom_filter_predicate);
    }
    if (filterPredicates.search_predicate) {
      updatedFilter.$and.push(filterPredicates.search_predicate);
    }
    if (filterPredicates.saved_filter_predicate) {
      updatedFilter.$and.push(filterPredicates.saved_filter_predicate);
    }
    if (filterPredicates.predefined_search_predicate) {
      updatedFilter.$and.push(filterPredicates.predefined_search_predicate);
    }

    setFirst(0);
    setFilters(updatedFilter);
    setFilterObjectToLocalStorage({
      offset: 0,
      limit: rows,
      custom_filter_predicate: filterPredicates.custom_filter_predicate || {},
      search_predicate: filterPredicates.search_predicate || {},
      saved_filter_predicate: filterPredicates.saved_filter_predicate || {},
      predefined_search_predicate: filterPredicates.predefined_search_predicate || {},
    });
  };

  const handleFetchUpdatedRecords = () => {
    setQueryDataLoaded((current) => !current);
  };

  const toggleBothSidebars = () => {
    if (visibleNavbar) {
      dispatch(toggleNavbar());
    } else {
      dispatch(showNavbar());
    }
  };

  const cardViewTitle = solidCardViewMetaDataResponse?.data?.solidView?.displayName;
  const enableGlobalSearch = solidCardViewMetaDataResponse?.data?.solidView?.layout?.attrs?.enableGlobalSearch === true;
  const showEmptyState = !loading && cards.length === 0;

  return (
    <div className="page-parent-wrapper solid-list-page-wrapper flex h-full min-h-0 overflow-hidden">
      <div className="solid-list-content h-full flex flex-column flex-grow-1">
        <div className="solid-list-surface solid-card-surface flex flex-column flex-1 min-h-0">
          <div className="page-header solid-list-toolbar solid-card-toolbar flex-column lg:flex-row">
            <div className="flex justify-content-between w-full solid-list-toolbar-row">
              <div className="flex gap-3 align-items-center w-full solid-list-toolbar-left">
                {params.embeded !== true && (
                  <div className="apps-icon block md:hidden cursor-pointer" onClick={toggleBothSidebars}>
                    <i className="pi pi-th-large"></i>
                  </div>
                )}
                <p className="m-0 view-title solid-text-wrapper">{cardViewTitle}</p>
                {enableGlobalSearch && (
                  <div className="hidden lg:flex">
                    <SolidGlobalSearchElement
                      viewType="card"
                      showSaveFilterPopup={showSaveFilterPopup}
                      setShowSaveFilterPopup={setShowSaveFilterPopup}
                      ref={solidGlobalSearchElementRef}
                      viewData={solidCardViewMetaDataResponse}
                      handleApplyCustomFilter={handleApplyCustomFilter}
                    />
                  </div>
                )}
              </div>

              <div className="flex align-items-center solid-header-buttons-wrapper solid-list-toolbar-actions">
                {enableGlobalSearch && (
                  <div className="flex lg:hidden">
                    <SolidButton
                      type="button"
                      variant="outline"
                      size="sm"
                      className="solid-icon-button"
                      onClick={() => setShowGlobalSearchElement(!showGlobalSearchElement)}
                    >
                      <i className="pi pi-search" />
                    </SolidButton>
                  </div>
                )}

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
                >
                  <i className="pi pi-refresh" />
                </SolidButton>

                <SolidCardViewConfigure
                  solidCardViewMetaData={solidCardViewMetaDataResponse}
                  modelName={params.modelName}
                  actionsAllowed={actionsAllowed}
                  viewModes={viewModes}
                  setLayoutDialogVisible={setLayoutDialogVisible}
                  setShowSaveFilterPopup={setShowSaveFilterPopup}
                  filters={filters}
                  handleRefreshView={handleFetchUpdatedRecords}
                />
              </div>
            </div>

            {enableGlobalSearch && showGlobalSearchElement && (
              <div className="flex lg:hidden">
                <SolidGlobalSearchElement
                  viewType="card"
                  showSaveFilterPopup={showSaveFilterPopup}
                  setShowSaveFilterPopup={setShowSaveFilterPopup}
                  ref={solidGlobalSearchElementRef}
                  viewData={solidCardViewMetaDataResponse}
                  handleApplyCustomFilter={handleApplyCustomFilter}
                />
              </div>
            )}
          </div>

          <div className="solid-card-view-body flex-1 min-h-0 overflow-auto">
            {showEmptyState ? (
              <SolidEmptyListViewPlaceholder
                createButtonUrl={createButtonUrl}
                createActionQueryParams={createActionQueryParams}
                actionsAllowed={actionsAllowed}
                params={params}
                solidListViewMetaData={solidCardViewMetaDataResponse}
                handleFetchUpdatedRecords={handleFetchUpdatedRecords}
              />
            ) : (
              <CardGrid
                records={cards}
                solidCardViewMetaData={solidCardViewMetaDataResponse?.data}
                editButtonUrl={editBaseUrl}
                setLightboxUrls={setLightboxUrls}
                setOpenLightbox={setOpenLightbox}
              />
            )}
          </div>

          {totalRecords > 0 && (
            <div className="solid-card-view-pagination">
              <Paginator
                first={first}
                rows={rows}
                totalRecords={totalRecords}
                rowsPerPageOptions={rowsPerPageOptions}
                onPageChange={(event) => {
                  setFirst(event.first);
                  setRows(event.rows);
                }}
                template="RowsPerPageDropdown CurrentPageReport PrevPageLink NextPageLink"
                currentPageReportTemplate="{first} - {last} of {totalRecords}"
              />
            </div>
          )}
        </div>
      </div>

      {openLightbox && (
        <Lightbox
          open={openLightbox}
          plugins={[Counter, Download]}
          close={() => setOpenLightbox(false)}
          slides={lightboxUrls as any}
        />
      )}

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
};
