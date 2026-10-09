// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
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

export const KanbanBoard = ({ groupByFieldName, kanbanViewData, maxSwimLanesCount, solidKanbanViewMetaData, setKanbanViewData, handleLoadMore, onDragEnd, handleSwimLanePagination, onDelete, onRecover, setLightboxUrls, setOpenLightbox, editButtonUrl, recordClickAction, showArchived, params, handleCustomButtonClick, enableCardSelection, selectedRecords, onCardSelectionChange, onToggleLaneSelection }: any) => {
    const [loading, setLoading] = useState<boolean>(true);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const restoredScrollKeyRef = useRef<string | null>(null);
    const pendingScrollFrameRef = useRef<number | null>(null);
    const restoreScrollFrameRef = useRef<number | null>(null);
    const navigationStartedRef = useRef(false);
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

    // Keep the board's horizontal and vertical position while opening a card and
    // returning to the Kanban route. Session storage scopes it to this browser tab
    // and the complete route, so filters/views do not leak into another board.
    const scrollStorageKey = typeof window === "undefined"
        ? null
        : `solidx:kanban-scroll:${window.location.pathname}${window.location.search}`;

    const saveScrollPosition = useCallback(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || !scrollStorageKey) return;

        try {
            window.sessionStorage.setItem(scrollStorageKey, JSON.stringify({
                top: scrollContainer.scrollTop,
                left: scrollContainer.scrollLeft,
            }));
        } catch {
            // Ignore unavailable session storage.
        }
    }, [scrollStorageKey]);

    const handleBeforeNavigate = useCallback(() => {
        // Card navigation can reset the board before React runs the effect
        // cleanup. Capture the position synchronously before pushing the form URL.
        navigationStartedRef.current = true;
        saveScrollPosition();
    }, [saveScrollPosition]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || !scrollStorageKey || !kanbanViewData?.length) return;

        navigationStartedRef.current = false;

        let savedPosition: { top: number; left: number } | null = null;
        try {
            const parsedPosition = JSON.parse(window.sessionStorage.getItem(scrollStorageKey) || "null");
            if (parsedPosition) {
                const top = Number(parsedPosition.top);
                const left = Number(parsedPosition.left);
                if (Number.isFinite(top) && Number.isFinite(left)) {
                    savedPosition = { top, left };
                }
            }
        } catch {
            // Ignore unavailable or malformed session storage entries.
        }

        const restorePosition = () => {
            if (restoredScrollKeyRef.current === scrollStorageKey) return true;
            if (!savedPosition) {
                restoredScrollKeyRef.current = scrollStorageKey;
                return true;
            }

            const contentReady = savedPosition.top <= 0 ||
                scrollContainer.scrollHeight >= savedPosition.top + scrollContainer.clientHeight;
            scrollContainer.scrollLeft = savedPosition.left;
            scrollContainer.scrollTop = contentReady
                ? savedPosition.top
                : Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);

            if (contentReady) {
                restoredScrollKeyRef.current = scrollStorageKey;
            }
            return contentReady;
        };

        restorePosition();
        let restoreAttempts = 0;
        const retryRestore = () => {
            if (restorePosition() || restoreAttempts++ >= 120) {
                if (restoredScrollKeyRef.current !== scrollStorageKey) {
                    restoredScrollKeyRef.current = scrollStorageKey;
                }
                return;
            }
            restoreScrollFrameRef.current = window.requestAnimationFrame(retryRestore);
        };
        restoreScrollFrameRef.current = window.requestAnimationFrame(retryRestore);

        const resizeObserver = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(() => {
                if (restoredScrollKeyRef.current !== scrollStorageKey) {
                    restorePosition();
                }
            })
            : null;
        resizeObserver?.observe(scrollContainer);
        const scrollContent = scrollContainer.querySelector(".solid-kanban-board-scroll-context");
        if (scrollContent) resizeObserver?.observe(scrollContent);

        const handleScroll = () => {
            // Do not persist an intermediate clamped position while the board
            // is still waiting for all cards/lanes to be laid out.
            if (restoredScrollKeyRef.current !== scrollStorageKey) return;
            if (pendingScrollFrameRef.current !== null) return;
            pendingScrollFrameRef.current = window.requestAnimationFrame(() => {
                pendingScrollFrameRef.current = null;
                saveScrollPosition();
            });
        };

        scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            if (restoreScrollFrameRef.current !== null) {
                window.cancelAnimationFrame(restoreScrollFrameRef.current);
                restoreScrollFrameRef.current = null;
            }
            if (pendingScrollFrameRef.current !== null) {
                window.cancelAnimationFrame(pendingScrollFrameRef.current);
                pendingScrollFrameRef.current = null;
            }
            if (!navigationStartedRef.current && restoredScrollKeyRef.current === scrollStorageKey) {
                saveScrollPosition();
            }
            resizeObserver?.disconnect();
            scrollContainer.removeEventListener("scroll", handleScroll);
        };
    }, [kanbanViewData?.length, scrollStorageKey, saveScrollPosition]);

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
        <div ref={scrollContainerRef} className="solid-kanban-board-wrapper">
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
                        let label = data.groupLabel || data.groupName;
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
                                onDelete={onDelete}
                                onRecover={onRecover}
                                setLightboxUrls={setLightboxUrls}
                                setOpenLightbox={setOpenLightbox}
                                editButtonUrl={editButtonUrl}
                                recordClickAction={recordClickAction}
                                cardNode={cardNode}
                                DynamicCardWidget={DynamicCardWidget}
                                onBeforeNavigate={handleBeforeNavigate}
                                showArchived={showArchived}
                                params={params}
                                handleCustomButtonClick={handleCustomButtonClick}
                                selectionEnabled={enableCardSelection}
                                selectedRecords={selectedRecords}
                                onCardSelectionChange={onCardSelectionChange}
                                onToggleLaneSelection={onToggleLaneSelection}
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
