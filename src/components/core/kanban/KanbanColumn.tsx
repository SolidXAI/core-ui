import React from "react";
import { Droppable, DroppableProvided } from "@hello-pangea/dnd";
import KanbanCard from "./KanbanCard";
import {
  SolidButton,
  SolidDropdownMenu,
  SolidDropdownMenuContent,
  SolidDropdownMenuItem,
  SolidDropdownMenuTrigger,
} from "../../shad-cn-ui";

// Define types for props
interface Group {
  label: string;
  count: number;
  folded: boolean;
  limit: number;
  currentPage: number;
}

interface GroupData {
  id: string;
  title: string;
  groupByField: string;
}

interface KanbanColumnProps {
  groupedView: boolean;
  groupByField: string;
  group: Group;
  groupData: GroupData[];
  cardNode?: any;
  DynamicCardWidget?: any;
  toggleFold: (groupByField: string) => void;
  handleLoadMore: (groupByField: string) => void;
  setLightboxUrls: any,
  setOpenLightbox: any
}

// @ts-ignore
const KanbanColumn = ({ groupedView, groupByField, solidKanbanViewMetaData, group, groupData, cardNode, DynamicCardWidget, toggleFold, handleLoadMore, setLightboxUrls, setOpenLightbox, editButtonUrl }: KanbanColumnProps) => {
  return (
    <div className={group.folded ? (groupedView === false ? "kanban-column kanban-ungrouped-column kanban-column-folded" : "kanban-column kanban-column-folded") : (groupedView === false ? "kanban-column kanban-ungrouped-column" : "kanban-column")}>
      {groupedView !== false &&
        <div className="kaban-heading-area">
          {group.folded &&
            <a onClick={e => toggleFold(groupByField)}>
              <div className="flex align-items-center">
                <div className="kanban-arrow-icon-container">
                  <i className="pi pi-sort-up-fill"></i>
                  <i className="pi pi-sort-down-fill"></i>
                </div>
                <p className="kanban-group-heading">{`${group.label}`}<span className="kanban-count-badge">{group.count}</span></p>
              </div>
            </a>
          }

          {!group.folded &&
            <div className="flex align-items-center">
              <p className="kanban-group-heading">{`${group.label}`}<span className="kanban-count-badge">{group.count}</span></p>
            </div>
          }
          {!group.folded &&
            <SolidDropdownMenu>
              <SolidDropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="solid-header-cog-trigger kanban-column-cogwheel"
                  aria-label={`Open ${group.label} lane options`}
                >
                  <i className="pi pi-cog" />
                </button>
              </SolidDropdownMenuTrigger>
              <SolidDropdownMenuContent className="solid-custom-overlay kanban-options-panel" align="start">
                <SolidDropdownMenuItem
                  className="solid-header-dropdown-item kanban-fold-action-button"
                  onSelect={() => toggleFold(groupByField)}
                >
                  <i className="pi pi-angle-double-left solid-header-action-button-icon" />
                  <span className="solid-header-action-button-label">Fold</span>
                </SolidDropdownMenuItem>
              </SolidDropdownMenuContent>
            </SolidDropdownMenu>
          }
        </div>
      }
      {!group.folded && (
        <Droppable droppableId={groupByField} isDropDisabled={!groupedView}>
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ minHeight: "100px" }}
              // @ts-ignore
              className={groupedView === false && "kanban-ungrouped-column-content"}
            >
              {groupData.map((data, index) => (
                // @ts-ignore
                <KanbanCard groupedView={groupedView} key={data.id} data={data} solidKanbanViewMetaData={solidKanbanViewMetaData} index={index} setLightboxUrls={setLightboxUrls} setOpenLightbox={setOpenLightbox} editButtonUrl={editButtonUrl} groupByFieldName={groupByField} group={group} cardNode={cardNode} DynamicCardWidget={DynamicCardWidget} />
              ))}
              {provided.placeholder}
              {group.count > 0 && (group.count > (group.limit * group.currentPage)) &&
                <SolidButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="kaban-load-more"
                  onClick={() => handleLoadMore(groupByField)}
                >
                  {`Load more data... (${group.count - (group.limit * group.currentPage)} remaining)`}
                </SolidButton>
              }
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default KanbanColumn;
