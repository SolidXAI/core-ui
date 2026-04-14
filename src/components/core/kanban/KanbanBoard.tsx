// @ts-nocheck
import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import { getExtensionComponent } from "../../../helpers/registry";

// Define types for groupData and Grouped Data
interface Post {
    id: string;
    title: string;
    status: string;
}

interface GroupData {
    count: number;
    records: Post[];
}

const findKanbanCardNode = (nodes: any[] = []): any => {
    for (const node of nodes) {
        if (!node) continue;
        if (node.type === "card") return node;
        if (Array.isArray(node?.children) && node.children.length > 0) {
            const nestedCard = findKanbanCardNode(node.children);
            if (nestedCard) return nestedCard;
        }
    }

    return null;
};

export const KanbanBoard = ({ groupByFieldName, kanbanViewData, maxSwimLanesCount, solidKanbanViewMetaData, setKanbanViewData, handleLoadMore, onDragEnd, handleSwimLanePagination, setLightboxUrls, setOpenLightbox, editButtonUrl }: any) => {
    const [loading, setLoading] = useState<boolean>(true);
    // State to manage the folded status of each column
    const [foldedStates, setFoldedStates] = useState<Record<string, boolean>>({});
    const cardNode = findKanbanCardNode(solidKanbanViewMetaData?.solidView?.layout?.children || []);
    const layoutAttrs = solidKanbanViewMetaData?.solidView?.layout?.attrs || {};
    const isKanbanDragEnabled =
        layoutAttrs.draggable !== false &&
        layoutAttrs.dragAndDrop !== false &&
        layoutAttrs.enableDrag !== false &&
        layoutAttrs.disableDrag !== true &&
        layoutAttrs.disableDragging !== true;
    const cardWidget = cardNode?.attrs?.cardWidget || cardNode?.cardWidget;
    const DynamicCardWidget = cardWidget ? getExtensionComponent(cardWidget) : null;
    const kanbanCardConfigurationIssue = !cardWidget
        ? { type: "missing_widget_reference" }
        : !DynamicCardWidget
            ? { type: "missing_widget", cardWidget }
            : null;

    // Toggle fold (not yet implemented)
    const toggleFold = (status: string): void => {
        setFoldedStates((prevFoldedStates) => ({
            ...prevFoldedStates,
            [status]: !prevFoldedStates[status],
        }));
    };

    // Render the Kanban board
    return (
        //@ts-ignore
        <div className="solid-kanban-board-wrapper">
            {kanbanCardConfigurationIssue ? (
                <div className="solid-kanban-config-placeholder-container">
                    <div className="solid-kanban-config-placeholder-panel">
                        <div className="solid-kanban-config-placeholder-badge">KANBAN CONFIGURATION</div>
                        <div className="solid-kanban-config-placeholder-title">
                            {kanbanCardConfigurationIssue.type === "missing_widget"
                                ? "Kanban card widget could not be resolved"
                                : "Kanban card widget is not configured"}
                        </div>
                        <div className="solid-kanban-config-placeholder-description">
                            {kanbanCardConfigurationIssue.type === "missing_widget" ? (
                                <>
                                    This kanban view references <code>{kanbanCardConfigurationIssue.cardWidget}</code>, but no matching card widget is registered.
                                </>
                            ) : (
                                <>
                                    This kanban view does not define a <code>cardWidget</code> on the card node.
                                </>
                            )}
                        </div>
                        <div className="solid-kanban-config-placeholder-hint">
                            {kanbanCardConfigurationIssue.type === "missing_widget"
                                ? "Register the widget in the extension registry or update the kanban metadata to point at a valid component."
                                : "Configure attrs.cardWidget on the kanban card metadata so the board can render each record."}
                        </div>
                    </div>
                </div>
            ) : (
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-3 px-3 md:px-4 py-2 md:py-3 solid-kanban-board-scroll-context">
                    {/* {Object.entries(kanbanViewData).map(([groupVal, data]) => {
                    const group = {
                        label: groupVal,
                        count: data.count,
                        folded: foldedStates[groupVal] || false,
                    };

                    return (
                        <KanbanColumn
                            key={groupVal}
                            groupByField={groupVal}
                            group={group}
                            groupData={data.records}
                            toggleFold={toggleFold}
                            handleLoadMore={handleLoadMore}
                        />
                    );
                })} */}
                    {kanbanViewData.map((data: any) => {
                        // Find the displayName for the groupName from solidKanbanViewMetaData.solidFieldsMetadata
                        let label = data.groupName;
                        const fieldMeta = solidKanbanViewMetaData?.solidFieldsMetadata?.[groupByFieldName];
                        if (
                            fieldMeta &&
                            fieldMeta.type === "selectionStatic" &&
                            Array.isArray(fieldMeta.selectionStaticValues)
                        ) {
                            const match = fieldMeta.selectionStaticValues.find(
                                (v: string) => {
                                    const [value, displayName] = v.split(":");
                                    return value === data.groupName;
                                }
                            );
                            if (match) {
                                label = match.split(":")[1];
                            }
                        }

                        const group = {
                            label,
                            count: data.groupData.meta.totalRecords,
                            limit: data.groupData.meta.perPage,
                            currentPage: data.groupData.meta.currentPage,
                            folded: foldedStates[data.groupName] || false,
                        };

                        return (
                            <KanbanColumn
                                key={data.groupName}
                                groupByField={data.groupName}
                                group={group}
                                isKanbanDragEnabled={isKanbanDragEnabled}
                                solidKanbanViewMetaData={solidKanbanViewMetaData}
                                groupData={data.groupData.records}
                                toggleFold={toggleFold}
                                handleLoadMore={handleLoadMore}
                                setLightboxUrls={setLightboxUrls}
                                setOpenLightbox={setOpenLightbox}
                                editButtonUrl={editButtonUrl}
                                cardNode={cardNode}
                                DynamicCardWidget={DynamicCardWidget}
                            />
                        );
                    })}
                    {kanbanViewData.length < maxSwimLanesCount &&
                        <div>
                            <a size="small" className="kaban-swimlane-load-more" style={{ textWrap: 'nowrap' }} text onClick={handleSwimLanePagination}>Load More...({maxSwimLanesCount - kanbanViewData.length})</a>
                        </div>
                    }
                </div>
            </DragDropContext>
            )}
        </div>
    );
}

export default KanbanBoard;
