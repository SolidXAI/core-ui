import { permissionExpression } from "../../../helpers/permissions";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "../../../redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "../../../redux/api/userApi";
import { DropResult } from "@hello-pangea/dnd";
import qs from "qs";
import { useEffect, useRef, useState } from "react";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import KanbanBoard from "./KanbanBoard";
import CompactImage from '../../../resources/images/layout/images/compact.png';
import CozyImage from '../../../resources/images/layout/images/cozy.png';
import ComfortableImage from '../../../resources/images/layout/images/comfortable.png';
import { SolidLightbox } from "../../shad-cn-ui/SolidLightbox";
import type { SolidLightboxSlide } from "../../shad-cn-ui/SolidLightbox";
import { useRouter } from "../../../hooks/useRouter";
import { SolidKanbanViewConfigure } from "./SolidKanbanViewConfigure";
import { KanbanUserViewLayout } from "./KanbanUserViewLayout";
import { useDispatch, useSelector } from "react-redux";
import { setFilterObjectToLocalStorage, getFilterObjectFromLocalStorage } from "../list/SolidListView";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { showNavbar, toggleNavbar } from "../../../redux/features/navbarSlice";
import { normalizeSolidListTreeKanbanActionPath } from "../../../helpers/routePaths";
import { getMediaTypeFromUrl } from "../../../helpers/mediaType";
import { showToast } from "../../../redux/features/toastSlice";
import { usePathname } from "../../../hooks/usePathname";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { SolidHeaderRequestStatus } from "../../common/SolidHeaderRequestStatus";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "../../shad-cn-ui";
import { FilterMatchMode } from "../filter/filterMatchMode";

type SolidKanbanViewParams = {
  moduleName: string;
  modelName: string;
  embeded: boolean;
};


export const SolidKanbanView = (params: SolidKanbanViewParams) => {

  const visibleNavbar = useSelector((state: any) => state.navbarState?.visibleNavbar);
  const dispatch = useDispatch()

  const solidGlobalSearchElementRef = useRef();
  const router = useRouter();
  const searchParams = useSearchParams();
  // TODO: The initial filter state will be created based on the fields which are present on this kanban view. 
  const [filters, setFilters] = useState<any>();
  const [toPopulate, setToPopulate] = useState<string[]>([]);
  const [toPopulateMedia, setToPopulateMedia] = useState<string[]>([]);
  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
  const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState(false);
  const sizeOptions = [
    { label: 'Compact', value: 'small', image: CompactImage },
    { label: 'Cozy', value: 'normal', image: CozyImage },
    { label: 'Comfortable', value: 'large', image: ComfortableImage }
  ]
  const [size, setSize] = useState<string | any>(sizeOptions[1].value);
  const [viewModes, setViewModes] = useState<any>([]);
  const [groupByFieldName, setGroupByFieldName] = useState<string>("");
  const [triggerCheckIfPermissionExists] = useLazyCheckIfPermissionExistsQuery();
  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxUrls, setLightboxUrls] = useState<any[]>([]);
  const [filterQueryString, setFilterQueryString] = useState<any>();
  const [isLayoutDialogVisible, setLayoutDialogVisible] = useState(false);
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

  const pushFiltersToRouter = (filterQueryString: any) => {
    // @ts-ignore
    router.push(`?${filterQueryString}`, undefined, { shallow: true });
  };

  useEffect(() => {
    if (filterQueryString) {
      pushFiltersToRouter(filterQueryString);
    }
  }, [filterQueryString]);



  useEffect(() => {
    const fetchPermissions = async () => {
      if (params.modelName) {
        const permissionNames = [
          permissionExpression(params.modelName, 'create'),
          permissionExpression(params.modelName, 'delete'),
          permissionExpression(params.modelName, 'update'),
          permissionExpression(params.modelName, 'findMany'),
          permissionExpression('importTransaction', 'create'),
          permissionExpression('exportTransaction', 'create'),
          permissionExpression('userViewMetadata', 'create'),
          permissionExpression('savedFilters', 'create')
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


  // Create the RTK slices for this entity
  const entityApi = createSolidEntityApi(params.modelName);
  const {
    useDeleteMultipleSolidEntitiesMutation,
    useLazyGetSolidEntitiesQuery,
    usePatchUpdateSolidEntityMutation
  } = entityApi;

  const menuItemId = searchParams.get("menuItemId");
  const menuItemName = searchParams.get("menuItemName");
  const actionId = searchParams.get("actionId");
  const actionName = searchParams.get("actionName");

  // Get the kanban view layout & metadata first. 
  const kanbanViewMetaDataQs = qs.stringify(
    {
      modelName: params.modelName,
      moduleName: params.moduleName,
      viewType: "kanban",
      menuItemId: menuItemId,
      menuItemName: menuItemName,
      actionId: actionId,
      actionName: actionName,
    },
    {
      encodeValuesOnly: true,
    }
  );
  const [kanbanViewMetaData, setKanbanViewMetaData] = useState<any>({});

  const {
    data: solidKanbanViewMetaData } = useGetSolidViewLayoutQuery(kanbanViewMetaDataQs);



  const initialFilterMethod = () => {

    const solidView = solidKanbanViewMetaData.data.solidView;
    const solidFieldsMetadata = solidKanbanViewMetaData.data.solidFieldsMetadata;

    const initialFilters: any = {};
    const toPopulate: string[] = [];
    const toPopulateMedia: string[] = [];
    function findCardNode(nodes: any[] = []): any {
      for (const node of nodes) {
        if (!node) continue;
        if (node.type === "card") return node;
        if (Array.isArray(node.children) && node.children.length > 0) {
          const nestedCard = findCardNode(node.children);
          if (nestedCard) return nestedCard;
        }
      }

      return null;
    }
    function extractFields(nodes: any, result: any = []) {
      if (!nodes) return result;
      if (Array.isArray(nodes)) {
        nodes.forEach((node: any) => extractFields(node, result));
        return result;
      }
      if (nodes.type === "field") {
        result.push(nodes);
      }
      if (nodes.children) {
        nodes.children.forEach((child: any) => extractFields(child, result));
      }
      return result;
    }

    const cardNode = findCardNode(solidView?.layout?.children || []);
    const fieldSource = cardNode?.children?.length ? cardNode.children : solidView.layout;
    const layoutFields = extractFields(fieldSource);

    for (let i = 0; i < layoutFields.length; i++) {
      const column = layoutFields[i];
      const fieldMetadata = solidFieldsMetadata[column.attrs.name];
      if (fieldMetadata) {

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
        if (fieldMetadata.type === 'relation') {
          toPopulate.push(fieldMetadata.name);
        }
        if (fieldMetadata.type === 'mediaSingle' || fieldMetadata.type === 'mediaMultiple') {
          toPopulateMedia.push(fieldMetadata.name);
        }
      }
    }

    // setFilters(initialFilters);
    const recordsInSwimlane = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.recordsInSwimlane ? solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.recordsInSwimlane : 10;
    // setToPopulate(toPopulate);
    // setToPopulateMedia(toPopulateMedia);
    // setRecordsInSwimlane(recordsInSwimlane);
    // setToPopulate(toPopulate);
    // setToPopulateMedia(toPopulateMedia);
    return { recordsInSwimlane, toPopulate, toPopulateMedia }
  }


  // Initial Filter data 
  useEffect(() => {

    if (solidKanbanViewMetaData) {
      setKanbanViewMetaData(solidKanbanViewMetaData);
      setViewModes(solidKanbanViewMetaData?.data?.viewModes);
      setGroupByFieldName(solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy || "");
    }
  }, [solidKanbanViewMetaData]);

  // All kanban view state.
  const [kanbanViewData, setKanbanViewData] = useState<any>([]);
  const [kanbanLoadMoreData, setKanbanLoadMoreData] = useState<any>({});
  const [recordsInSwimlane, setRecordsInSwimlane] = useState(10);
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();
  const [createActionQueryParams, setCreateActionQueryParams] = useState<Record<string, string>>({});
  const [editActionQueryParams, setEditActionQueryParams] = useState<Record<string, string>>({});
  const [columnsCount, setColumnsCount] = useState(5);
  const [swimLaneCurrentPageNumber, setSwimLaneCurrentPageNumber] = useState(1);
  const [queryDataLoaded, setQueryDataLoaded] = useState(false);
  const [showSaveFilterPopup, setShowSaveFilterPopup] = useState<boolean>(false);
  const [maxSwimLanesCount, setMaxSwimLanesCount] = useState<number>(0);
  const pathname = usePathname();
  // @ts-ignore
  const editBaseUrl = normalizeSolidListTreeKanbanActionPath(pathname, editButtonUrl || "form");
  // Get the kanban view data.
  // const [triggerGetSolidEntitiesForKanban, { data: solidEntityKanbanViewData, isLoading, error }] = useLazyGetSolidKanbanEntitiesQuery();
  const [triggerGetSolidEntities, { data: solidEntityKanbanViewData }] = useLazyGetSolidEntitiesQuery();

  // Delete mutation 
  const [
    deleteManySolidEntities,
    {
      isLoading: isDeleteSolidEntitiesLoading,
      isSuccess: isDeleteSolidEntitiesSucess,
    },
  ] = useDeleteMultipleSolidEntitiesMutation();
  const [
    patchKanbanView,
    {
      isLoading: isPatchKanbanViewLoading,
    },
  ] = usePatchUpdateSolidEntityMutation();

  // After data is fetched populate the kanban view state so as to be able to render the data. 
  useEffect(() => {
    if (solidEntityKanbanViewData) {
      // Merge groupRecords by groupName: update existing, add new
      setMaxSwimLanesCount(solidEntityKanbanViewData?.meta?.totalRecords || 0);
      const groupRecords = solidEntityKanbanViewData?.groupRecords || [];
      const groupMap = new Map((kanbanViewData || []).map((g: any) => [g.groupName, g]));
      groupRecords.forEach((newGroup: any) => {
        groupMap.set(newGroup.groupName, newGroup);
      });
      const latestKanbanGroupData = Array.from(groupMap.values());
      setKanbanViewData(latestKanbanGroupData);
      const loadmoredata = Object.entries(latestKanbanGroupData).reduce((acc: any, [, value]: any) => {
        acc[value.groupName] = {
          offset: (value.groupData.meta.currentPage - 1) * value.groupData.meta.perPage,
          limit: value.groupData.meta.perPage,
          count: value.groupData.meta.totalRecords
        };
        return acc;
      }, {});

      setKanbanLoadMoreData(loadmoredata)
      setLoading(false);
    }
  }, [solidEntityKanbanViewData]);

  useEffect(() => {
    if (solidKanbanViewMetaData) {
      const kanbanViewLayoutAttrs = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs;
      const createActionUrl = kanbanViewLayoutAttrs?.createAction && kanbanViewLayoutAttrs?.createAction?.type === "custom" ? kanbanViewLayoutAttrs?.createAction?.customComponent : "form/new";
      const editActionUrl = kanbanViewLayoutAttrs?.editAction && kanbanViewLayoutAttrs?.editAction?.type === "custom" ? kanbanViewLayoutAttrs?.editAction?.customComponent : "form";

      if (kanbanViewLayoutAttrs?.createAction) {
        setCreateActionQueryParams({
          actionName: kanbanViewLayoutAttrs.createAction.name,
          actionType: kanbanViewLayoutAttrs.createAction.type,
          actionContext: kanbanViewLayoutAttrs.createAction.context,
        });
      }
      if (kanbanViewLayoutAttrs?.editAction) {
        setEditActionQueryParams({
          actionName: kanbanViewLayoutAttrs.editAction.name,
          actionType: kanbanViewLayoutAttrs.editAction.type,
          actionContext: kanbanViewLayoutAttrs.editAction.context,
        });
      }

      if (createActionUrl) {
        setCreateButtonUrl(createActionUrl)
      }
      if (editActionUrl) {
        setEditButtonUrl(editActionUrl)
      }
    }
  }, [solidKanbanViewMetaData])

  // Fetch data after toPopulate has been populated...
  useEffect(() => {

    if (solidKanbanViewMetaData) {

      const swimlanesCount = solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.swimlanesCount || 5;
      if (groupByFieldName) {

        const queryObject = getFilterObjectFromLocalStorage();
        let queryString = "";
        if (queryObject) {
          const filters = {
            $and: []
          }
          if (queryObject.custom_filter_predicate) {
            // @ts-ignore
            filters.$and.push(queryObject.custom_filter_predicate);
          }
          if (queryObject.search_predicate) {
            // @ts-ignore
            filters.$and.push(queryObject.search_predicate);
          }
          // if (queryObject.saved_filter_predicate) {
          //   filters.$and.push(queryObject.saved_filter_predicate);
          // }
          // if (queryObject.predefined_search_predicate) {
          //   filters.$and.push(queryObject.predefined_search_predicate);
          // }

          const queryData = {
            offset: 0,
            limit: Number(queryObject.limit) + Number(queryObject.offset),
            // fields: queryObject.fields || [`${groupByFieldName}`, `count(${groupByFieldName})`],
            groupBy: queryObject.groupBy || groupByFieldName,
            // @ts-ignore
            populateMedia: queryObject.populateMedia || toPopulateMedia,
            populateGroup: queryObject.populateGroup || true,
            groupFilter: {
              limit: Number(queryObject.groupFilter.limit) + Number(queryObject.groupFilter.offset) || kanbanViewMetaData?.data?.solidView?.layout?.attrs?.recordsInSwimlane,
              offset: 0,
              filters: filters,
              // @ts-ignore
              populate: queryObject.groupFilter.populate || toPopulate,
              // @ts-ignore
              populateMedia: queryObject.groupFilter.populateMedia || toPopulateMedia
            }
            // sort: [`id:desc`],
          };


          const { recordsInSwimlane, toPopulate, toPopulateMedia } = initialFilterMethod();
          setToPopulate(toPopulate);
          setToPopulateMedia(toPopulateMedia);
          setRecordsInSwimlane(recordsInSwimlane);
          // setFilters(filters);
          setQueryDataLoaded(true);

          queryString = qs.stringify(queryData, {
            encodeValuesOnly: true
          });

        } else {
          const { recordsInSwimlane, toPopulate, toPopulateMedia } = initialFilterMethod();
          const queryData = {
            offset: 0,
            limit: swimlanesCount,
            // fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
            groupBy: groupByFieldName,
            populateMedia: toPopulateMedia,
            populateGroup: true,
            groupFilter: {
              limit: kanbanViewMetaData?.data?.solidView?.layout?.attrs?.recordsInSwimlane || 10,
              offset: 0,
              filters: filters,
              populate: toPopulate,
              populateMedia: toPopulateMedia
            }
            // sort: [`id:desc`],
          };
          setRecordsInSwimlane(recordsInSwimlane);
          setToPopulate(toPopulate);
          setToPopulateMedia(toPopulateMedia);

          // fields=status&groupBy=status&fields=count(status)&populateGroup=true
          queryString = qs.stringify(queryData, {
            encodeValuesOnly: true
          });

          setQueryDataLoaded(true)
        }

        // triggerGetSolidEntities(queryString);
        setSelectedRecords([]);
      }
    }
  }, [isDeleteSolidEntitiesSucess, groupByFieldName, solidKanbanViewMetaData]);

  // clickable link allowing one to open the detail / form view.

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
  }


  // Individual Swimlane Load More
  const handleLoadMore = async (groupByField: string) => {
    const { offset, limit } = kanbanLoadMoreData[groupByField];
    kanbanLoadMoreData[groupByField].offset = offset + limit;
    try {
      const queryData = {
        offset: offset + limit,
        limit: limit,
        populate: toPopulate,
        populateMedia: toPopulateMedia,
        populateGroup: true,
        filters: {
          [groupByFieldName]: {
            $in: [groupByField],
          },
          ...filters
        }
      }


      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true
      });
      // router.push(`?${queryString}`);
      const data: any = await triggerGetSolidEntities(queryString);
      const newRecords = data.data.records;
      const mergeData = (
        kanbanViewData: any[],
        newRecords: any[],
        groupByField: string
      ) => {
        // Find the group matching the specified groupByField
        const originalData = structuredClone(kanbanViewData);
        const targetGroup = originalData.find(
          (group: any) => group.groupName === groupByField
        );
        if (targetGroup) {
          const { groupData } = targetGroup;

          if (targetGroup.groupData) {
            // Extract existing records
            const existingRecords = targetGroup.groupData.records;
            const updatedRecords = [...existingRecords, ...newRecords];
            targetGroup.groupData.records = updatedRecords


            // Update the meta data (you can adjust this logic as needed)
            groupData.meta.prevPage = groupData.meta.currentPage
            groupData.meta.currentPage = groupData.meta.currentPage + 1
            groupData.meta.nextPage = groupData.meta.currentPage + 1
          }
        }
        return originalData;
      };


      const updatedData = mergeData(kanbanViewData, newRecords, groupByField);
      setKanbanViewData(updatedData);
      const loadmoredata = Object.entries(updatedData).reduce((acc: any, [, value]: any) => {
        acc[value.groupName] = {
          offset: (value.groupData.meta.currentPage - 1) * value.groupData.meta.perPage,
          limit: value.groupData.meta.perPage,
          count: value.groupData.meta.totalRecords
        };
        return acc;
      }, {});
      setKanbanLoadMoreData(loadmoredata)

    } catch (error) {
      console.error(ERROR_MESSAGES.LOAD_MORE_DATA, error);
    }
  };


  // Handle drag-and-drop functionality
  // @ts-ignore
  const onDragEnd = async (result: DropResult): void => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceGroupName = source.droppableId;
    const destinationGroupName = destination.droppableId;

    // Find the source and destination groups
    const sourceGroupIndex = kanbanViewData.findIndex((group: any) => group.groupName === sourceGroupName);
    const destinationGroupIndex = kanbanViewData.findIndex((group: any) => group.groupName === destinationGroupName);

    if (sourceGroupIndex === -1 || destinationGroupIndex === -1) return;

    // If dragging within the same group
    if (sourceGroupName === destinationGroupName) {
      setKanbanViewData((prevData: typeof kanbanViewData) =>
        prevData.map((group: any) => {
          if (group.groupName === sourceGroupName) {
            const updatedRecords = [...group.groupData.records];
            const [movedItem] = updatedRecords.splice(source.index, 1); // Remove the item
            updatedRecords.splice(destination.index, 0, movedItem); // Insert at the new position

            return {
              ...group,
              groupData: {
                ...group.groupData,
                records: updatedRecords,
              },
            };
          }
          return group;
        })
      );
      return;
    }

    // Deep clone the source and destination groups
    const sourceGroup = JSON.parse(JSON.stringify(kanbanViewData[sourceGroupIndex]));
    const destinationGroup = JSON.parse(JSON.stringify(kanbanViewData[destinationGroupIndex]));

    // Clone the records for immutability
    const sourceRecords = [...sourceGroup.groupData.records];
    const destinationRecords = [...destinationGroup.groupData.records];

    // Remove the item from the source
    const [movedItem] = sourceRecords.splice(source.index, 1);

    // Create a mutable copy of the moved item
    const updatedItem = { ...movedItem, status: destinationGroupName };

    // Add the updated item to the destination
    destinationRecords.splice(destination.index, 0, updatedItem);

    // Update the group data
    sourceGroup.groupData.records = sourceRecords;
    destinationGroup.groupData.records = destinationRecords;

    // Update the kanbanViewData state
    const oldkanbanViewData = structuredClone(kanbanViewData);
    try {
      const formData = new FormData();
      formData.append(groupByFieldName, destinationGroupName);
      // Update the kanbanViewData state
      setKanbanViewData((prevData: typeof kanbanViewData) =>
        prevData.map((group: any) => {
          if (group.groupName === sourceGroupName) {
            return sourceGroup;
          }
          if (group.groupName === destinationGroupName) {
            return destinationGroup;
          }
          return group;
        })
      );
      const kanbanUpdateResponse = await patchKanbanView({ id: +movedItem.id, data: formData }).unwrap();

      if (kanbanUpdateResponse?.statusCode === 200) {
        dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.IS_SUCCESS, detail: ERROR_MESSAGES.KANBAN_UPDATED }));
      } else {
        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.DUPLICATE_KEY, detail: kanbanUpdateResponse?.error }));
        // Update the kanbanViewData state
        setKanbanViewData(oldkanbanViewData);
      }
    } catch (error: any) {
      // 6. Handle 500 or network errors
      console.error(ERROR_MESSAGES.API_ERROR, error);
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.SOMETHING_WRONG, detail: error?.data?.message || ERROR_MESSAGES.SOMETHING_WRONG }));
      setKanbanViewData(oldkanbanViewData);
    }
  };


  // Handle SwimLane Pagination
  const handleSwimLanePagination = async () => {

    if (solidKanbanViewMetaData) {

      const swimlanesCount = solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.swimlanesCount || 5;
      const queryData = {
        offset: swimLaneCurrentPageNumber * swimlanesCount,
        limit: swimlanesCount,
        // fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
        groupBy: groupByFieldName,
        populateMedia: toPopulateMedia,
        populate: toPopulate,
        populateGroup: true,
        groupFilter: {
          limit: recordsInSwimlane,
          offset: 0,
          filters: filters,
          populate: toPopulate,
          populateMedia: toPopulateMedia

        }
        // sort: [`id:desc`],
      };
      // fields=status&groupBy=status&fields=count(status)&populateGroup=true
      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true
      });

      const data: any = await triggerGetSolidEntities(queryString);
      if (data && data?.data?.groupRecords.length > 0) {
        const updatedData = [...kanbanViewData, ...data.data.groupRecords];
        setKanbanViewData(updatedData);
      }
      setSwimLaneCurrentPageNumber(swimLaneCurrentPageNumber + 1)
    }
  }


  // Handle the custom filter and Search Filter
  const handleApplyCustomFilter = async (filterPredicates: any, persistFilter: boolean = false) => {

    if (solidKanbanViewMetaData) {
      const queryfilter = {
        $and: [
        ]
      }

      if (filterPredicates.custom_filter_predicate) {
        // @ts-ignore
        queryfilter.$and.push(filterPredicates.custom_filter_predicate);
      }
      if (filterPredicates.search_predicate) {
        // @ts-ignore
        queryfilter.$and.push(filterPredicates.search_predicate);
      }
      if (filterPredicates.saved_filter_predicate) {
        // @ts-ignore
        queryfilter.$and.push(filterPredicates.saved_filter_predicate);
      }
      if (filterPredicates.predefined_search_predicate) {
        // @ts-ignore
        queryfilter.$and.push(filterPredicates.predefined_search_predicate);
      }

      const customFilter = filterPredicates;
      const updatedFilter = { ...(filters || {}), ...(queryfilter || {}) };

      // Then update state
      setFilters(updatedFilter);


      const swimlanesCount = solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.swimlanesCount || 5;
      // const { toPopulate, toPopulateMedia } = initialFilterMethod();

      const queryData = {
        offset: 0,
        limit: swimlanesCount,
        // fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
        groupBy: groupByFieldName,
        populateMedia: toPopulateMedia,
        populateGroup: true,
        groupFilter: {
          limit: recordsInSwimlane,
          offset: 0,
          filters: updatedFilter,
          populate: toPopulate,
          populateMedia: toPopulateMedia
        }
      }
      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true
      });

      // s_filter and c_filter format that needs to be passed to the router
      // only present if handleCustomFilter is applied
      if (customFilter) {
        const urlData = structuredClone(queryData);
        // @ts-ignore
        delete urlData.filters;
        // urlData.s_filter = customFilter.s_filter || {};
        // urlData.c_filter = customFilter.c_filter || {};
        // @ts-ignore
        urlData.custom_filter_predicate = customFilter.custom_filter_predicate || {};
        // @ts-ignore
        urlData.search_predicate = customFilter.search_predicate || {};
        // @ts-ignore
        setFilterObjectToLocalStorage(urlData);
      }


      const data: any = await triggerGetSolidEntities(queryString);

      // Update the kanban view data with the new data based on filter
      setSwimLaneCurrentPageNumber(1);
      if (data && data?.data?.groupRecords.length > 0) {
        const updatedData = [...data.data.groupRecords];
        setKanbanViewData(updatedData);
      }
      setSelectedRecords([]);


    }

  }

  useEffect(() => {
    if (solidKanbanViewMetaData) {
      const createActionUrl = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.createAction && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.createAction?.type === "custom" ? solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.createAction?.customComponent : "form/new";
      const editActionUrl = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.editAction && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.editAction?.type === "custom" ? solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.editAction?.customComponent : "form";
      if (createActionUrl) {
        setCreateButtonUrl(createActionUrl)
      }
      if (editActionUrl) {
        setEditButtonUrl(editActionUrl)
      }
    }
  }, [solidKanbanViewMetaData])

  const kanbanViewTitle = solidKanbanViewMetaData?.data?.solidView?.displayName
  const headerRequestStatusLabel =
    isDeleteSolidEntitiesLoading
      ? "Deleting..."
      : isPatchKanbanViewLoading
        ? "Updating..."
        : loading || !queryDataLoaded
          ? "Loading..."
          : null;


  const toggleBothSidebars = () => {
    if (visibleNavbar) {
      dispatch(toggleNavbar());   // close both
    } else {
      dispatch(showNavbar());     // open both
    }
  };

  return (
    <div className="page-parent-wrapper solid-list-page-wrapper flex h-full min-h-0 overflow-hidden">
      <div className="solid-list-content h-full flex flex-column flex-grow-1">
        <div className="solid-list-surface solid-kanban-surface flex flex-column flex-1 min-h-0">
          <div className="page-header solid-list-toolbar solid-kanban-toolbar flex-column lg:flex-row">
            <div className="flex justify-content-between w-full solid-list-toolbar-row">
              <div className="flex gap-3 align-items-center w-full solid-list-toolbar-left">
                {params.embeded !== true &&
                  <div className="apps-icon block md:hidden cursor-pointer" onClick={toggleBothSidebars}>
                    <i className="pi pi-th-large"></i>
                  </div>
                }

                <p className="m-0 view-title solid-text-wrapper">{kanbanViewTitle}</p>
                {solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.enableGlobalSearch === true &&
                  <div className="hidden lg:flex">
                    <SolidGlobalSearchElement viewType="kanban" showSaveFilterPopup={showSaveFilterPopup} setShowSaveFilterPopup={setShowSaveFilterPopup} ref={solidGlobalSearchElementRef} viewData={solidKanbanViewMetaData} handleApplyCustomFilter={handleApplyCustomFilter}  ></SolidGlobalSearchElement>
                  </div>
                }
              </div>

              <div className="flex align-items-center solid-header-buttons-wrapper solid-list-toolbar-actions">
                <SolidHeaderRequestStatus label={headerRequestStatusLabel} />
                {solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.enableGlobalSearch === true &&
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
                }

                {actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.create !== false &&
                  <SolidCreateButton createButtonUrl={createButtonUrl} createActionQueryParams={createActionQueryParams} responsiveIconOnly={true} />
                }

                {actionsAllowed.includes(`${permissionExpression(params.modelName, 'delete')}`) && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.delete !== false && selectedRecords.length > 0 && <SolidButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDialogVisible(true)}
                >
                  Delete
                </SolidButton>}
                <SolidButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="solid-icon-button"
                  onClick={() => {
                    window.location.reload()
                  }}
                >
                  <i className="pi pi-refresh" />
                </SolidButton>
                <SolidKanbanViewConfigure
                  solidKanbanViewMetaData={solidKanbanViewMetaData}
                  modelName={params.modelName}
                  actionsAllowed={actionsAllowed}
                  viewModes={viewModes}
                  setLayoutDialogVisible={setLayoutDialogVisible}
                  setShowSaveFilterPopup={setShowSaveFilterPopup}
                  filters={filters}
                  handleRefreshView={() => window.location.reload()}
                />
              </div>
            </div>
            {solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.enableGlobalSearch === true && showGlobalSearchElement && (
              <div className="flex lg:hidden">
                <SolidGlobalSearchElement viewType="kanban" showSaveFilterPopup={showSaveFilterPopup} setShowSaveFilterPopup={setShowSaveFilterPopup} ref={solidGlobalSearchElementRef} viewData={solidKanbanViewMetaData} handleApplyCustomFilter={handleApplyCustomFilter}  ></SolidGlobalSearchElement>
              </div>
            )}
          </div>

          <style>{`.p-datatable .p-datatable-loading-overlay {background-color: rgba(0, 0, 0, 0.0);}`}</style>
          {solidKanbanViewMetaData && kanbanViewData &&
            <KanbanBoard groupByFieldName={groupByFieldName} kanbanViewData={kanbanViewData} maxSwimLanesCount={maxSwimLanesCount} solidKanbanViewMetaData={solidKanbanViewMetaData?.data} setKanbanViewData={setKanbanViewData} handleLoadMore={handleLoadMore} onDragEnd={onDragEnd} handleSwimLanePagination={handleSwimLanePagination} setLightboxUrls={setLightboxUrls} setOpenLightbox={setOpenLightbox} editButtonUrl={editBaseUrl}></KanbanBoard>
          }
        </div>
      </div>

      <SolidDialog
        open={isDialogVisible}
        onOpenChange={(open) => {
          if (!open) {
            onDeleteClose();
          }
        }}
        className="solid-shadcn-confirm-dialog solid-delete-confirm-dialog"
      >
        <SolidDialogHeader className="solid-shadcn-dialog-head">
          <SolidDialogTitle>Confirm Delete</SolidDialogTitle>
          <SolidDialogClose />
        </SolidDialogHeader>
        <SolidDialogSeparator className="solid-shadcn-dialog-sep" />
        <SolidDialogBody className="solid-shadcn-dialog-body">
          <p className="solid-shadcn-dialog-text">Are you sure you want to delete the selected records?</p>
        </SolidDialogBody>
        <SolidDialogFooter className="solid-shadcn-dialog-actions">
          <SolidButton variant="destructive" size="sm" autoFocus onClick={deleteBulk}>
            Delete
          </SolidButton>
          <SolidButton variant="outline" size="sm" onClick={onDeleteClose}>
            Cancel
          </SolidButton>
        </SolidDialogFooter>
      </SolidDialog>
      {openLightbox && (
        <SolidLightbox
          open={openLightbox}
          slides={lightboxSlides}
          onClose={() => setOpenLightbox(false)}
        />
      )}
      <SolidDialog
        open={isLayoutDialogVisible}
        onOpenChange={setLayoutDialogVisible}
        className="solid-kanban-layout-dialog"
        style={{ width: "min(800px, calc(100vw - 32px))" }}
      >
        <SolidDialogHeader>
          <SolidDialogTitle>Change Kanban Layout</SolidDialogTitle>
          <SolidDialogClose />
        </SolidDialogHeader>
        <SolidDialogSeparator />
        <SolidDialogBody className="solid-kanban-layout-dialog-body">
          <KanbanUserViewLayout solidKanbanViewMetaData={solidKanbanViewMetaData} setLayoutDialogVisible={setLayoutDialogVisible} />
        </SolidDialogBody>
      </SolidDialog>
    </div>
  );
};
