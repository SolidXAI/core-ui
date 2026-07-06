// @ts-nocheck
import React from "react";
import { useRouter } from "../../../hooks/useRouter";
import { DraggableProvided } from "@hello-pangea/dnd";
import { CompatibleDraggable } from "../common/dndCompat";
import { storeCurrentModelViewContext } from "../../../helpers/modelViewPersistence";
import {
  SolidDropdownMenu,
  SolidDropdownMenuContent,
  SolidDropdownMenuItem,
  SolidDropdownMenuTrigger,
  SolidIcon,
} from "../../shad-cn-ui";

// Define the types for the data and props
interface Data {
  id: string;
  title: string;
  content: string;
}

interface KanbanCardProps {
  data: Data;
  solidKanbanViewMetaData: any;
  index: number;
  isDragDisabled?: boolean;
  setLightboxUrls?: any;
  setOpenLightbox?: any;
  editButtonUrl?: string;
  groupByFieldName?: string;
  group?: any;
  cardNode?: any;
  DynamicCardWidget?: any;
  onDelete?: (record: Data) => void;
  onRecover?: (record: Data) => void;
  showArchived?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ data, solidKanbanViewMetaData, index, isDragDisabled = false, setLightboxUrls, setOpenLightbox, editButtonUrl, groupByFieldName, group, cardNode, DynamicCardWidget, onDelete, onRecover, showArchived }) => {
  const router = useRouter()
  const isArchivedRecord = data?.deletedAt !== null && data?.deletedAt !== undefined;

  const persistReturnView = () => {
    storeCurrentModelViewContext();
  };

  const openRecord = () => {
    if (isArchivedRecord) return;
    persistReturnView();
    router.push(`${editButtonUrl}/${data?.id}`);
  };

  const openEdit = () => {
    if (isArchivedRecord) return;
    persistReturnView();
    router.push(`${editButtonUrl}/${data?.id}`);
  };

  const renderKanbanAction = (data) => {
    return (
      <div className="solid-kanban-action" onClick={(e) => e.stopPropagation()}>
        <SolidDropdownMenu>
          <SolidDropdownMenuTrigger asChild>
            <button
              type="button"
              className="solid-header-cog-trigger solid-kanban-action-trigger"
              aria-label="Open card actions"
            >
              <SolidIcon name="si-ellipsis-v" aria-hidden />
            </button>
          </SolidDropdownMenuTrigger>
          <SolidDropdownMenuContent className="solid-custom-overlay" align="end">
            {!isArchivedRecord ? (
              <SolidDropdownMenuItem
                className="solid-header-dropdown-item"
                onSelect={openEdit}
              >
                <SolidIcon name="si-pencil" className="solid-header-action-button-icon" aria-hidden />
                <span className="solid-header-action-button-label">Edit</span>
              </SolidDropdownMenuItem>
            ) : null}
            {showArchived && data?.deletedAt !== null && data?.deletedAt !== undefined && onRecover ? (
              <SolidDropdownMenuItem
                className="solid-header-dropdown-item"
                onSelect={() => onRecover(data)}
              >
                <SolidIcon name="si-refresh" className="solid-header-action-button-icon" aria-hidden />
                <span className="solid-header-action-button-label">Recover</span>
              </SolidDropdownMenuItem>
            ) : null}
            {onDelete && (data?.deletedAt === null || data?.deletedAt === undefined) ? (
              <SolidDropdownMenuItem
                className="solid-header-dropdown-item solid-header-dropdown-item-danger"
                onSelect={() => onDelete(data)}
              >
                <SolidIcon name="si-trash" className="solid-header-action-button-icon" aria-hidden />
                <span className="solid-header-action-button-label">Delete</span>
              </SolidDropdownMenuItem>
            ) : null}
          </SolidDropdownMenuContent>
        </SolidDropdownMenu>
      </div>
    )
  }

  return (
    <CompatibleDraggable draggableId={String(data.id)} index={index} isDragDisabled={isDragDisabled}>
      {(provided: DraggableProvided, snapshot) => (
        <div
          className=""
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(!isDragDisabled ? provided.dragHandleProps : {})}
          style={{ marginTop: "1rem", ...provided.draggableProps.style }}
          className="kanban-card-container"
        >
          {/* <p className="kanban-card-heading">{data.title}</p> */}
          {/* <p className="kanban-card-content">{data.content}</p> */}
          <div
            style={{
              opacity: snapshot.isDragging ? 0.9 : (isArchivedRecord ? 0.55 : 1),
              transform: snapshot.isDragging ? "rotate(-2deg)" : "",
              cursor: isArchivedRecord ? "default" : (isDragDisabled ? "pointer" : "grab")
            }}
            elevation={snapshot.isDragging ? 3 : 1}
            className={`solid-kanban-card${isArchivedRecord ? " greyed-out-row" : ""}`}
            onClick={openRecord}
          >
            {renderKanbanAction(data)}
            {DynamicCardWidget ? (
              <DynamicCardWidget
                rowData={data}
                solidKanbanViewMetaData={solidKanbanViewMetaData}
                solidView={solidKanbanViewMetaData?.solidView}
                solidFieldsMetadata={solidKanbanViewMetaData?.solidFieldsMetadata}
                card={cardNode}
                layoutAttrs={solidKanbanViewMetaData?.solidView?.layout?.attrs || {}}
                groupedView={true}
                groupByFieldName={groupByFieldName}
                group={group}
                editButtonUrl={editButtonUrl}
                setLightboxUrls={setLightboxUrls}
                setOpenLightbox={setOpenLightbox}
                openRecord={openRecord}
                openEdit={openEdit}
              />
            ) : null}
          </div>
        </div>
      )}
    </CompatibleDraggable>
  );
};

export default KanbanCard;
