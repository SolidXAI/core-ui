import { Draggable, Droppable } from "@hello-pangea/dnd";
import type { DraggableProps, DroppableProps } from "@hello-pangea/dnd";
import type { JSX, ReactNode } from "react";

type DndCompatComponent<Props> = (props: Props) => JSX.Element | null;

export const CompatibleDraggable = Draggable as unknown as DndCompatComponent<DraggableProps>;
export const CompatibleDroppable = Droppable as unknown as DndCompatComponent<DroppableProps>;
export const asCompatibleReactNode = (node: unknown): ReactNode => node as ReactNode;
