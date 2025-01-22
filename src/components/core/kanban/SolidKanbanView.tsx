"use client";
import { createPermission, deletePermission, updatePermission } from "@/helpers/permissions";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { useGetSolidViewLayoutQuery } from "@/redux/api/solidViewApi";
import { useLazyCheckIfPermissionExistsQuery } from "@/redux/api/userApi";
import { DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import {
  DataTableFilterMeta,
  DataTableStateEvent
} from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import qs from "qs";
import { useEffect, useState } from "react";
import { SolidConfigureLayoutElement } from "../common/SolidConfigureLayoutElement";
import { SolidCreateButton } from "../common/SolidCreateButton";
import { SolidGlobalSearchElement } from "../common/SolidGlobalSearchElement";
import KanbanBoard from "./KanbanBoard";

type SolidKanbanViewParams = {
  moduleName: string;
  modelName: string;
  embeded: boolean;
};

export const SolidKanbanView = (params: SolidKanbanViewParams) => {

  // TODO: The initial filter state will be created based on the fields which are present on this kanban view. 
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
  const [kanbanViewMetaData, setKanbanViewMetaData] = useState({});
  const {
    data: solidKanbanViewMetaData,
    error: solidKanbanViewMetaDataError,
    isLoading: solidKanbanViewMetaDataIsLoading,
    isError: solidKanbanViewMetaDataIsError,
    refetch
  } = useGetSolidViewLayoutQuery(kanbanViewMetaDataQs);



  const initialFilterMethod = () => {

    const solidView = solidKanbanViewMetaData.data.solidView;
    const solidFieldsMetadata = solidKanbanViewMetaData.data.solidFieldsMetadata;

    const initialFilters: any = {};
    const toPopulate: string[] = [];
    // for (let i = 0; i < solidView.layout.children.length; i++) {
    //   const column = solidView.layout.children[i];
    //   const fieldMetadata = solidFieldsMetadata[column.attrs.name];

    //   // Form the initial filters after iterating over the columns and field metadata. 
    //   if (['int', 'bigint', 'float', 'decimal'].includes(fieldMetadata.type)) {
    //     // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    //     initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.EQUALS }
    //   }
    //   else if (['date', 'datetime', 'time', 'boolean'].includes(fieldMetadata.type)) {
    //     // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
    //     initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.EQUALS }
    //   }
    //   else if (['relation', 'selectionStatic', 'selectionDynamic'].includes(fieldMetadata.type)) {
    //     initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.IN }
    //   }
    //   else {
    //     // initialFilters[column.attrs.name] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
    //     initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.STARTS_WITH }
    //   }

    //   if (column.attrs.name === 'id') {
    //     initialFilters[column.attrs.name] = { value: null, matchMode: FilterMatchMode.IN }
    //   }

    //   // Form the "toPopulate" array. 
    //   if (fieldMetadata.type === 'relation' && fieldMetadata.relationType === 'many-to-one') {
    //     toPopulate.push(fieldMetadata.name);
    //   }
    // }
    setFilters(initialFilters);
    setRows(solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.defaultPageSize ? solidKanbanViewMetaData?.data?.solidView?.layout?.attrs.defaultPageSize : 25)
    setToPopulate(toPopulate);
  }

  useEffect(() => {
    // refetch();
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
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [createButtonUrl, setCreateButtonUrl] = useState<string>();
  const [editButtonUrl, setEditButtonUrl] = useState<string>();

  // Get the kanban view data.
  // const [triggerGetSolidEntitiesForKanban, { data: solidEntityKanbanViewData, isLoading, error }] = useLazyGetSolidKanbanEntitiesQuery();
  const [triggerGetSolidEntities, { data: solidEntityKanbanViewData, isLoading, error }] = useLazyGetSolidEntitiesQuery();


  // After data is fetched populate the kanban view state so as to be able to render the data. 
  useEffect(() => {
    if (solidEntityKanbanViewData) {

      setKanbanViewData(solidEntityKanbanViewData?.groupRecords);
      const loadmoredata = Object.entries(solidEntityKanbanViewData?.groupRecords).reduce((acc: any, [key, value]: any) => {
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
  console.log("solidKanbanViewMetaData", solidKanbanViewMetaData);


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
      const groupByFieldName = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy;
      if (toPopulate) {
        const queryData = {
          offset: 0,
          limit: 10,
          fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
          groupBy: groupByFieldName,
          populate: toPopulate,
          populateGroup: true
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
    const solidFieldsMetadata = solidKanbanViewMetaData.data.solidFieldsMetadata;

    filterQuery.forEach((fieldData: any) => {

      const filterFieldMeta = solidFieldsMetadata[fieldData.field];

      // Some filters will not have constraints
      if (!fieldData.constraints) {
        if (fieldData.value != null) {
          const { operator, value } = identifySolidOperatorAndValue(fieldData.operator, fieldData.value);

          // Massage the filter value for relation many-to-one before sending to the server. 
          if (filterFieldMeta.type === 'relation' && filterFieldMeta.relationType === 'many-to-one') {
            // @ts-ignore
            const manyToOneIds = value.map(i => i.value);
            formattedFilters[fieldData.field] = { [operator]: manyToOneIds };
          }
          // Massage the filter value for selectionStatic before sending to the server. 
          else if (['selectionStatic', 'selectionDynamic'].includes(filterFieldMeta.type)) {
            // @ts-ignore
            const values = value.map(i => i.value);
            formattedFilters[fieldData.field] = { [operator]: values };
          }
          else {
            formattedFilters[fieldData.field] = { [operator]: value };
          }
        }
      }
      // TODO: Incase we start supporting multiple constraints in the future then we need to implement an else block here. 
      else { }

    });

    const groupByFieldName = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs?.groupBy;
    const queryData: any = {
      offset: offset ?? first,
      limit: limit ?? rows,
      populate: toPopulate,
      fields: [`${groupByFieldName}`, `count(${groupByFieldName})`],
      groupBy: groupByFieldName,
      populateGroup: true,
      filters: formattedFilters

    };

    // if (sortField) {
    //   const sortFieldMetadata = solidFieldsMetadata[sortField];
    //   if (sortFieldMetadata.type === 'relation' && sortFieldMetadata.relationType === 'many-to-one') {
    //     sortField = `${sortField}.${sortFieldMetadata.relationModel.userKeyField.name}`;
    //   }
    //   queryData.sort = [
    //     `${sortField}:${sortOrder == 0 ? null : sortOrder == 1 ? "asc" : "desc"}`,
    //   ];
    // }
    // else {
    //   queryData.sort = [`id:desc`];
    // }

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
    if (solidKanbanViewMetaData) {
      initialFilterMethod()
    }
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
          }
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
    const sourceGroupIndex = kanbanViewData.findIndex((group :any) => group.groupName === sourceGroupName);
    const destinationGroupIndex = kanbanViewData.findIndex((group :any) => group.groupName === destinationGroupName);

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
      prevData.map((group :any) => {
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

  const applyFilter = (filter: any) => {
    setQueryString(
      0,
      rows,
      sortField,
      sortOrder === 1 || sortOrder === -1 ? sortOrder : 0,
      filter
    )
    console.log("filter in kanbanview", filter);
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
            <SolidGlobalSearchElement solidKanbanViewMetaData={solidKanbanViewMetaData} applyFilter={applyFilter} filterValues={filterValues} setFilterValues={setFilterValues}></SolidGlobalSearchElement>
          }
        </div>

        <SolidConfigureLayoutElement></SolidConfigureLayoutElement>

      </div>
      <style>{`.p-datatable .p-datatable-loading-overlay {background-color: rgba(0, 0, 0, 0.0);}`}</style>
      {solidKanbanViewMetaData && kanbanViewData &&
        <KanbanBoard kanbanViewData={kanbanViewData} solidViewMetaData={solidKanbanViewMetaData?.data} setKanbanViewData={setKanbanViewData} handleLoadMore={handleLoadMore} onDragEnd={onDragEnd}></KanbanBoard>
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

