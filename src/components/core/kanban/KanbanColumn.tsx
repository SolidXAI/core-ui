import React from "react";
import { DroppableProvided } from "@hello-pangea/dnd";
import KanbanCard from "./KanbanCard";
import { asCompatibleReactNode, CompatibleDroppable } from "../common/dndCompat";
import {
  SolidButton,
  SolidDropdownMenu,
  SolidDropdownMenuContent,
  SolidDropdownMenuItem,
  SolidDropdownMenuTrigger,
  SolidIcon,
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
  groupByField: string;
  group: Group;
  groupData: GroupData[];
  isKanbanDragEnabled?: boolean;
  cardNode?: any;
  DynamicCardWidget?: any;
  toggleFold: (groupByField: string) => void;
  handleLoadMore: (groupByField: string) => void;
  setLightboxUrls: any,
  setOpenLightbox: any
}

// @ts-ignore
const KanbanColumn = ({ groupByField, solidKanbanViewMetaData, group, groupData, isKanbanDragEnabled = true, cardNode, DynamicCardWidget, toggleFold, handleLoadMore, setLightboxUrls, setOpenLightbox, editButtonUrl }: KanbanColumnProps) => {
  return (
    <div className={group.folded ? "kanban-column kanban-column-folded" : "kanban-column"}>
      <div className="kaban-heading-area">
        {group.folded &&
          <a onClick={e => toggleFold(groupByField)}>
            <div className="flex align-items-center">
              <div className="kanban-arrow-icon-container">
                <SolidIcon name="si-sort-up-fill" aria-hidden />
                <SolidIcon name="si-sort-down-fill" aria-hidden />
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
                <SolidIcon name="si-cog" aria-hidden />
              </button>
            </SolidDropdownMenuTrigger>
            <SolidDropdownMenuContent className="solid-custom-overlay kanban-options-panel" align="start">
              <SolidDropdownMenuItem
                className="solid-header-dropdown-item kanban-fold-action-button"
                onSelect={() => toggleFold(groupByField)}
              >
                <SolidIcon name="si-angle-double-left" className="solid-header-action-button-icon" aria-hidden />
                <span className="solid-header-action-button-label">Fold</span>
              </SolidDropdownMenuItem>
            </SolidDropdownMenuContent>
          </SolidDropdownMenu>
        }
      </div>
      {!group.folded && (
        <CompatibleDroppable droppableId={groupByField} isDropDisabled={!isKanbanDragEnabled}>
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ minHeight: "100px" }}
            >
              {groupData.map((data, index) => (
                // @ts-ignore
                <KanbanCard key={data.id} data={data} solidKanbanViewMetaData={solidKanbanViewMetaData} index={index} isDragDisabled={!isKanbanDragEnabled} setLightboxUrls={setLightboxUrls} setOpenLightbox={setOpenLightbox} editButtonUrl={editButtonUrl} groupByFieldName={groupByField} group={group} cardNode={cardNode} DynamicCardWidget={DynamicCardWidget} />
              ))}
              {asCompatibleReactNode(provided.placeholder)}
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
        </CompatibleDroppable>
      )}
    </div>
  );
};

export default KanbanColumn;
