// @ts-nocheck

import React, { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import axios from "axios";
import KanbanColumn from "./KanbanColumn";

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

interface ApiResponse {
    data: {
        groupedData: Record<string, GroupData>;
    };
}

export const KanbanBoard = ({ kanbanViewData, solidViewMetaData, setKanbanViewData, handleLoadMore, onDragEnd }: any) => {
    const [loading, setLoading] = useState<boolean>(true);
    // State to manage the folded status of each column
    const [foldedStates, setFoldedStates] = useState<Record<string, boolean>>({});

    // Fetch data from the API
    // useEffect(() => {
    //     const fetchData = async (): Promise<void> => {
    //         try {
    //             setLoading(true);
    //             // const response = await axios.get<ApiResponse>(
    //             //     "http://localhost:3000/api/blog/group-kanban/status",
    //             //     {
    //             //         headers: { accept: "*/*" },
    //             //     }
    //             // );
    //             // setGroupedData(response.data.data.groupedData);
    //             setGroupedData({});
    //         } catch (error) {
    //             console.error("Error fetching data:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchData();
    // }, []);

    // if (loading) {
    //     return <div>Loading...</div>;
    // }




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
        <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: "flex", gap: "1rem", background: "#f0f0f5", padding: "20px" }}>
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
                {kanbanViewData.map((data) => {
                    const group = {
                        label: data.groupName,
                        count: data.groupData.meta.totalRecords,
                        folded: foldedStates[data.groupName] || false,
                    };

                    return (
                        <KanbanColumn
                            key={data.groupName}
                            groupByField={data.groupName}
                            group={group}
                            solidViewMetaData={solidViewMetaData}
                            groupData={data.groupData.records}
                            toggleFold={toggleFold}
                            handleLoadMore={handleLoadMore}
                        />
                    );
                })}
            </div>
        </DragDropContext>
    );
}

export default KanbanBoard;
