// @ts-nocheck
import React from "react";
import { useRouter } from "../../../hooks/useRouter";
import { Draggable, DraggableProvided } from "@hello-pangea/dnd";
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
  setLightboxUrls?: any;
  setOpenLightbox?: any;
  editButtonUrl?: string;
  groupByFieldName?: string;
  group?: any;
  cardNode?: any;
  DynamicCardWidget?: any;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ data, solidKanbanViewMetaData, index, setLightboxUrls, setOpenLightbox, editButtonUrl, groupByFieldName, group, cardNode, DynamicCardWidget }) => {
  const router = useRouter()
  const openRecord = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fromView", "kanban");
    }
    router.push(`${editButtonUrl}/${data?.id}`);
  };

  const openEdit = () => {
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
            <SolidDropdownMenuItem
              className="solid-header-dropdown-item"
              onSelect={() => router.push(`${editButtonUrl}/${data?.id}`)}
            >
              <SolidIcon name="si-pencil" className="solid-header-action-button-icon" aria-hidden />
              <span className="solid-header-action-button-label">Edit</span>
            </SolidDropdownMenuItem>
          </SolidDropdownMenuContent>
        </SolidDropdownMenu>
      </div>
    )
  }

  return (
    <Draggable draggableId={String(data.id)} index={index}>
      {(provided: DraggableProvided, snapshot) => (
        <div
          className=""
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ marginTop: "1rem", ...provided.draggableProps.style }}
          className="kanban-card-container"
        >
          {/* <p className="kanban-card-heading">{data.title}</p> */}
          {/* <p className="kanban-card-content">{data.content}</p> */}
          <div
            style={{
              opacity: snapshot.isDragging ? 0.9 : 1,
              transform: snapshot.isDragging ? "rotate(-2deg)" : "",
              cursor: 'pointer'
            }}
            elevation={snapshot.isDragging ? 3 : 1}
            className="solid-kanban-card"
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
    </Draggable>
  );
};

export default KanbanCard;
