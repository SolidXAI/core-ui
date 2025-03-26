// @ts-nocheck
'use client';


import React, { useRef } from "react";
import { Droppable, DroppableProvided } from "@hello-pangea/dnd";
import { Button } from "primereact/button";
import KanbanCard from "./KanbanCard";
import { OverlayPanel } from "primereact/overlaypanel";

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
  toggleFold: (groupByField: string) => void;
  handleLoadMore: (groupByField: string) => void;
  setLightboxUrls: any,
  setOpenLightbox: any
}

const KanbanColumn = ({ groupedView, groupByField, solidKanbanViewMetaData, group, groupData, toggleFold, handleLoadMore, setLightboxUrls, setOpenLightbox }: KanbanColumnProps) => {
  const op = useRef<any>(null);


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
                <p className="kanban-group-heading">{`${group.label}`}<span className="count">{group.count}</span></p>
              </div>
            </a>
          }

          {!group.folded &&
            <div className="flex align-items-center">
              <p className="kanban-group-heading">{`${group.label}`}<span className="count">{group.count}</span></p>
            </div>
          }
          {!group.folded &&
            <a onClick={(e: any) => op?.current?.toggle(e)}>
              < i className="pi pi-cog" />
            </a>
          }
          <OverlayPanel ref={op} className="kanban-options-panel">

            <div
              className="w-full md:w-10rem p-menu p-component"
              data-pc-name="menu"
              data-pc-section="root"
            >
              <ul
                className="p-menu-list p-reset"
                id="pr_id_11_list"
                role="menu"
                data-pc-section="menu"
              >
                <li
                  className="p-menuitem"
                  role="menuitem"
                  data-pc-section="menuitem"
                  data-p-focused="false"
                  data-p-disabled="false"
                >
                  <button className="p-menuitem-link w-full p-link flex align-items-center pl-2 text-color hover:surface-200 border-noround">
                    <div
                      className="mr-2 p-avatar p-component p-avatar-image p-avatar-circle"
                      data-pc-name="avatar"
                      data-pc-section="root"
                    >
                    </div>
                    <div className="flex flex-column align">

                      <a className="flex align-items-center p-menuitem-link" onClick={e => { toggleFold(groupByField); op?.current?.toggle(e) }}>
                        <span className="">Fold</span>
                      </a>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </OverlayPanel>
        </div>
      }
      {!group.folded && (
        <Droppable droppableId={groupByField}>
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ minHeight: "100px" }}
              className={groupedView === false && "kanban-ungrouped-column-content"}
            >
              {groupData.map((data, index) => (
                <KanbanCard key={data.id} data={data} solidKanbanViewMetaData={solidKanbanViewMetaData} index={index} setLightboxUrls={setLightboxUrls} setOpenLightbox={setOpenLightbox} />
              ))}
              {provided.placeholder}
              {group.count > 0 && (group.count > (group.limit * group.currentPage)) &&
                <a
                  className="load-more-button"
                  onClick={() => handleLoadMore(groupByField)}
                >
                  Load more data... ({group.count - (group.limit * group.currentPage)} remaining)
                </a>
              }
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default KanbanColumn;
