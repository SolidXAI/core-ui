// @ts-nocheck
'use client';

import React from "react";
import { Draggable, DraggableProvided } from "@hello-pangea/dnd";
import { Card } from "primereact/card";

// Define the types for the data and props
interface Data {
  id: string;
  title: string;
  content: string;
}

interface KanbanCardProps {
  data: Data;
  solidViewMetaData: any;
  index: number;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ data, solidViewMetaData, index }) => {

  const SolidRow = ({ children, attrs }: any) => {
    const className = attrs.className;
    return (
      <div className={`row ${className}`}>
        <div className="s_group">
          <fieldset>
            {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
            <div className="grid">{children}</div>
          </fieldset>
        </div>
      </div>
    );
  };
  const SolidColumn = ({ children, attrs }: any) => {
    const className = attrs.className;
    return (
      <div className={`${className}`}>
        <div className="s_group">
          <fieldset>
            {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
            <div className="grid">{children}</div>
          </fieldset>
        </div>

      </div>
    );
  };
  const SolidImage = ({ children, attrs }: any) => {
    const className = attrs.className;
    return (
      <div className={`${className}`}>
        <div className="s_group">
          <fieldset>
            {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
            <div className="grid">{children}</div>
          </fieldset>
        </div>

      </div>
    );
  };

  const SolidField = ({ field, initialEntityData, solidFormViewMetaData }: any) => {

    switch (initialEntityData[field.attrs.name].type) {
      case "mediaSingle":
        return <img src=""></img>
      default:
        return <p>{initialEntityData[field.attrs.name]}</p>

    }
  };


  const SolidCard = ({ children }: any) => (
    <div className="p-fluid p-grid">
      {children}
    </div>
  );

  // Now render the form dynamically...
  const renderFormElementDynamically: any = (element: any, solidViewMetaData: any) => {
    const { type, attrs, children } = element;
    // const key = attrs?.name ?? generateRandomKey();
    const key = attrs?.name;
    switch (type) {
      case "card":
        return <SolidCard key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidViewMetaData))}</SolidCard>;
      case "row":
        return <SolidRow key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidViewMetaData))}</SolidRow>;
      case "column":
        return <SolidColumn key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidViewMetaData))}</SolidColumn>;
      case "image":
        return <SolidImage key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidViewMetaData))}</SolidImage>;

      case "field": {
        // const fieldMetadata = solidFieldsMetadata[attrs.name];
        const fieldMetadata = solidViewMetaData.solidFieldsMetadata[attrs.name];
        return <SolidField key={key} field={element} fieldMetadata={fieldMetadata} initialEntityData={data ? data : null} solidViewMetaData={solidViewMetaData} />;
      }
      default:
        return null;
    }
  };

  const renderFormDynamically = (solidViewMetaData: any) => {
    if (!solidViewMetaData) {
      return;
    }
    const solidView = solidViewMetaData.solidView;
    const solidFieldsMetadata = solidViewMetaData.solidFieldsMetadata;
    if (!solidView || !solidFieldsMetadata) {
      return;
    }
    if (!solidView || !solidFieldsMetadata) {
      return;
    }
    const updatedLayout = solidView.layout.children;
    const dynamicForm = updatedLayout.map((element: any) => renderFormElementDynamically(element, solidViewMetaData));
    return dynamicForm;
  };


  return (
    <Draggable draggableId={String(data.id)} index={index}>
      {(provided: DraggableProvided, snapshot) => (
        <div
          className=""
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ marginBottom: "1rem", ...provided.draggableProps.style }}
        >
          {/* <p className="kanban-card-heading">{data.title}</p> */}
          {/* <p className="kanban-card-content">{data.content}</p> */}
          <Card
            style={{
              opacity: snapshot.isDragging ? 0.9 : 1,
              transform: snapshot.isDragging ? "rotate(-2deg)" : "",
            }}
            elevation={snapshot.isDragging ? 3 : 1}
          >
            {renderFormDynamically(solidViewMetaData)}

            {/* {solidViewMetaData?.solidView?.layout?.layoutData &&
              Object.entries(solidViewMetaData?.solidView?.layout?.layoutData).map(([key, value]) => (
                <p className="kanban-card-heading" key={key}>{data[value]}</p>
              ))
            } */}
            {/* <p className="kanban-card-content">{data.content}</p> */}
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
