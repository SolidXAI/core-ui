"use client";
import { createPermission, deletePermission, updatePermission } from "@/helpers/permissions";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "@/redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "@/redux/api/userApi";
import { DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import qs from "qs";
import { useEffect, useRef, useState } from "react";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import KanbanBoard from "./KanbanBoard";

type SolidKanbanViewParams = {
  moduleName: string;
  modelName: string;
  embeded: boolean;
};


export const SolidKanbanView = (params: SolidKanbanViewParams) => {
  const solidGlobalSearchElementRef = useRef();

  // TODO: The initial filter state will be created based on the fields which are present on this kanban view. 
  const [filters, setFilters] = useState<any>();
  const [toPopulate, setToPopulate] = useState<string[]>([]);
  const [actionsAllowed, setActionsAllowed] = useState<string[]>([]);
  const [showGlobalSearchElement, setShowGlobalSearchElement] = useState<boolean>(false);

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
    useGetSolidKanbanEntitiesQuery,
    useLazyGetSolidKanbanEntitiesQuery,
    useLazyGetSolidEntityByIdQuery,
    usePrefetch,
    useUpdateSolidEntityMutation
  } = entityApi;

  // Get the kanban view layout & metadata first. 
  const kanbanViewMetaDataQs = qs.stringify({ ...params, viewType: 'kanban' }, {
    encodeValuesOnly: true,
  });
  const [kanbanViewMetaData, setKanbanViewMetaData] = useState<any>({});

  const {
    data: solidKanbanViewMetaData,
    error: solidKanbanViewMetaDataError,
    isLoading: solidKanbanViewMetaDataIsLoading,
    isError: solidKanbanViewMetaDataIsError
  } = useGetSolidViewLayoutQuery(kanbanViewMetaDataQs);



  const initialFilterMethod = () => {

    const solidView = solidKanbanViewMetaData.data.solidView;
    const solidFieldsMetadata = solidKanbanViewMetaData.data.solidFieldsMetadata;

    const initialFilters: any = {};
    const toPopulate: string[] = [];
    function extractFields(node: any, result: any = []) {
      if (node.type === "field") {
        result.push(node);
      }
      if (node.children) {
        node.children.forEach((child: any) => extractFields(child, result));
      }
      return result;
    }

    const data = { /* Your JSON object here */ };
    const layoutFields = extractFields(solidView.layout);

    for (let i = 0; i < layoutFields.length; i++) {
      const column = layoutFields[i];
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
    setRows(kanbanViewMetaData?.data?.solidView?.layout?.attrs?.recordsCount ? kanbanViewMetaData?.data?.solidView?.layout?.attrs.recordsCount : 25)
    setToPopulate(toPopulate);
  }

  useEffect(() => {

    if (solidKanbanViewMetaData) {
      setKanbanViewMetaData(solidKanbanViewMetaData);
      initialFilterMethod()
    }
  }, [solidKanbanViewMetaData]);




  // All kanban view state.
  const [kanbanViewData, setKanbanViewData] = useState<any>([]);
  const [kanbanLoadMoreData, setKanbanLoadMoreData] = useState<any>({});
  const [filterValues, setFilterValues] = useState([{ field: '', operator: '', value: '' }]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(25);
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();
  const [columnsCount, setColumnsCount] = useState(5);
  const [swimLaneCurrentPageNumber, setSwimLaneCurrentPageNumber] = useState(1);

  // Get the kanban view data.
  // const [triggerGetSolidEntitiesForKanban, { data: solidEntityKanbanViewData, isLoading, error }] = useLazyGetSolidKanbanEntitiesQuery();
  const [triggerGetSolidEntities, { data: solidEntityKanbanViewData, isLoading, error }] = useLazyGetSolidEntitiesQuery();


  // After data is fetched populate the kanban view state so as to be able to render the data. 
  useEffect(() => {
    if (solidEntityKanbanViewData) {
      const latestKanbanGroupData = [...kanbanViewData, ...solidEntityKanbanViewData?.groupRecords]
      setKanbanViewData(latestKanbanGroupData);
      const loadmoredata = Object.entries(latestKanbanGroupData).reduce((acc: any, [key, value]: any) => {
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

    if (solidKanbanViewMetaData) {
      const createActionUrl = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.createAction && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.createAction?.type === "custom" ? solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.createAction?.customComponent : "form/new";
      const editActionUrl = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.editAction && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.editAction?.type === "custom" ? solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.editAction?.customComponent : "form";
      if (solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.pageSize) {
        setColumnsCount(solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.pageSize)
      }
      if (createActionUrl) {
        setCreateButtonUrl(createActionUrl)
      }
      if (editActionUrl) {
        setEditButtonUrl(editActionUrl)
      }
    }
    if (solidKanbanViewMetaData) {
      const groupByFieldName = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy;
      const columnsToLoadCount = solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.pageSize || 5;

      if (toPopulate) {
        const queryData = {
          offset: 0,
          limit: columnsToLoadCount,
          fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
          groupBy: groupByFieldName,
          populate: toPopulate,
          populateGroup: true,
          groupFilter: {
            limit: kanbanViewMetaData?.data?.solidView?.layout?.attrs?.recordsCount,
            offset: 0,
            filters:filters
          }
          // sort: [`id:desc`],
        };
        // fields=status&groupBy=status&fields=count(status)&populateGroup=true
        const queryString = qs.stringify(queryData, {
          encodeValuesOnly: true
        });

        triggerGetSolidEntities(queryString);
        setSelectedRecords([]);
      }
    }

  }, [isDeleteSolidEntitiesSucess, toPopulate, solidKanbanViewMetaData]);




  // clear Filter

  const clearFilter = async() => {
    if (solidKanbanViewMetaData) {
      // initialFilterMethod()
    }
    setFilters(null);
    if (solidKanbanViewMetaData) {
      const groupByFieldName = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy;
      const columnsToLoadCount = solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.pageSize || 5;

      if (toPopulate) {
        const queryData = {
          offset: 0,
          limit: columnsToLoadCount,
          fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
          groupBy: groupByFieldName,
          populate: toPopulate,
          populateGroup: true,
          groupFilter: {
            limit: rows,
            offset: 0,
          }
          // sort: [`id:desc`],
        };
        // fields=status&groupBy=status&fields=count(status)&populateGroup=true
        const queryString = qs.stringify(queryData, {
          encodeValuesOnly: true
        });

        const data: any = await triggerGetSolidEntities(queryString);
        if (data && data?.data?.groupRecords.length > 0) {
          const updatedData = [...data.data.groupRecords];
          setKanbanViewData(updatedData);
        }
        setSelectedRecords([]);
      }
    }

    // @ts-ignore
    solidGlobalSearchElementRef.current.clearFilter()
  };




  // clickable link allowing one to open the detail / form view.
  const detailsBodyTemplate = (solidViewData: any) => {
    return (
      <Link href={`${editButtonUrl}/${solidViewData.id}`} rel="noopener noreferrer" className="text-sm font-bold p-0" style={{ color: "#12415D" }}>
        <i className="pi pi-pencil" style={{ fontSize: "1rem" }}></i>
      </Link>
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

  const handleLoadMore = async (status: string) => {
    const { offset, limit, records } = kanbanLoadMoreData[status];
    const newLoadMoreData = kanbanLoadMoreData;
    kanbanLoadMoreData[status].offset = offset + limit;
    const groupByFieldName = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy;
    try {
      // const queryData = {
      //   offset: 0,
      //   limit: 1,
      //   fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
      //   groupBy: groupByFieldName,
      //   populate: toPopulate,
      //   populateGroup: true,
      //   sort: [`id:desc`],
      // };

      const queryData = {
        offset: offset + limit,
        limit: limit,
        filters: {
          [groupByFieldName]: {
            $in: [status],
          },
          ...filters
        }
      }


      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true
      });

      const data: any = await triggerGetSolidEntities(queryString);
      const newRecords = data.data.records;
      const currentData = kanbanViewData;
      const mergeData = (
        kanbanViewData: any[],
        newRecords: any[],
        status: string
      ) => {
        // Find the group matching the specified status
        const originalData = structuredClone(kanbanViewData);
        const targetGroup = originalData.find(
          (group: any) => group.groupName === status
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


      const updatedData = mergeData(kanbanViewData, newRecords, status);
      setKanbanViewData(updatedData);
      const loadmoredata = Object.entries(updatedData).reduce((acc: any, [key, value]: any) => {
        acc[value.groupName] = {
          offset: (value.groupData.meta.currentPage - 1) * value.groupData.meta.perPage,
          limit: value.groupData.meta.perPage,
          count: value.groupData.meta.totalRecords
        };
        return acc;
      }, {});
      setKanbanLoadMoreData(loadmoredata)

    } catch (error) {
      console.error("Failed to load more data:", error);
    }
  };


  // Handle drag-and-drop functionality
  const onDragEnd = (result: DropResult): void => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceGroupName = source.droppableId;
    const destinationGroupName = destination.droppableId;

    // Find the source and destination groups
    const sourceGroupIndex = kanbanViewData.findIndex((group: any) => group.groupName === sourceGroupName);
    const destinationGroupIndex = kanbanViewData.findIndex((group: any) => group.groupName === destinationGroupName);

    if (sourceGroupIndex === -1 || destinationGroupIndex === -1) return;

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
  };


  const handleSwimLinPagination = async () => {

    if (solidKanbanViewMetaData) {
      const groupByFieldName = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy;
      const columnsToLoadCount = solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.pageSize || 5;
      const queryData = {
        offset: swimLaneCurrentPageNumber * columnsToLoadCount,
        limit: columnsToLoadCount,
        fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
        groupBy: groupByFieldName,
        populate: toPopulate,
        populateGroup: true,
        groupFilter: {
          limit: rows,
          offset: 0,
          filters: filters
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

  const handleApplyCustomFilter = async (filters: any) => {

    const groupByFieldName = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy;
    const columnsToLoadCount = solidKanbanViewMetaData?.data.solidView?.layout?.attrs?.pageSize || 5;
    setFilters(filters)

    if (toPopulate) {
      const queryData = {
        offset: 0,
        limit: columnsToLoadCount,
        fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
        groupBy: groupByFieldName,
        populate: toPopulate,
        populateGroup: true,
        groupFilter: {
          limit: rows,
          offset: 0,
          filters: filters
        }
        // sort: [`id:desc`],
      };
      // fields=status&groupBy=status&fields=count(status)&populateGroup=true
      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true
      });

      // triggerGetSolidEntities(queryString);
      const data: any = await triggerGetSolidEntities(queryString);
      if (data && data?.data?.groupRecords.length > 0) {
        const updatedData = [...data.data.groupRecords];
        setKanbanViewData(updatedData);
      }
      setSelectedRecords([]);
    }
    // if (toPopulate) {
    //   const queryData = {
    //     offset: 0,
    //     limit: 25,
    //     populate: toPopulate,
    //     sort: [`id:desc`],
    //     filters: { ...transformedFilter.filters }
    //   };
    //   if (params.embeded) {

    //   }
    //   const queryString = qs.stringify(queryData, {
    //     encodeValuesOnly: true
    //   });

    //   triggerGetSolidEntities(queryString);
    //   // setShowGlobalSearchElement(false)
    //   setSelectedRecords([]);
    // }
  }



  return (
    <>
      <div className="flex gap-3 mb-4 align-items-center justify-content-between kanban-view">
        <div className="flex gap-3 mb-4 align-items-center" >

          {actionsAllowed.includes(`${createPermission(params.modelName)}`) && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.create !== false &&
            <SolidCreateButton url={createButtonUrl} />
          }

          {actionsAllowed.includes(`${deletePermission(params.modelName)}`) && solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.delete !== false && selectedRecords.length > 0 && <Button
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

          {solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.enableGlobalSearch === true &&
            // <SolidGlobalSearchElement viewData={solidKanbanViewMetaData} handleApplyCustomFilter={handleApplyCustomFilter} ></SolidGlobalSearchElement>
            <SolidGlobalSearchElement ref={solidGlobalSearchElementRef} viewData={solidKanbanViewMetaData} handleApplyCustomFilter={handleApplyCustomFilter}  ></SolidGlobalSearchElement>

          }
        </div>

        {/* <SolidConfigureLayoutElement></SolidConfigureLayoutElement> */}

      </div>
      <style>{`.p-datatable .p-datatable-loading-overlay {background-color: rgba(0, 0, 0, 0.0);}`}</style>
      {solidKanbanViewMetaData && kanbanViewData &&
        <KanbanBoard kanbanViewData={kanbanViewData} solidViewMetaData={solidKanbanViewMetaData?.data} setKanbanViewData={setKanbanViewData} handleLoadMore={handleLoadMore} onDragEnd={onDragEnd} handleSwimLinPagination={handleSwimLinPagination}></KanbanBoard>
      }

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
    </>
  );
};

