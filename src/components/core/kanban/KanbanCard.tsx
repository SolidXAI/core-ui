// @ts-nocheck
'use client';

import { Draggable, DraggableProvided } from "@hello-pangea/dnd";
import { Card } from "primereact/card";
import React from "react";
import { SolidKanbanViewFields } from "./SolidKanbanViewFields";

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
}

// Render columns dynamically based on metadata
const renderFieldsDynamically = (field: any, data: any, solidKanbanViewMetaData: any, setLightboxUrls?: any, setOpenLightbox?: any) => {
  if (!solidKanbanViewMetaData) {
    return;
  }

  const solidView = solidKanbanViewMetaData.solidView;
  const solidFieldsMetadata = solidKanbanViewMetaData.solidFieldsMetadata;
  if (!solidView || !solidFieldsMetadata) {
    return;
  }
  const fieldMetadata = solidFieldsMetadata[field.attrs.name];
  const fieldLayout = field;
  return SolidKanbanViewFields({ solidKanbanViewMetaData, fieldMetadata, fieldLayout, data, setLightboxUrls, setOpenLightbox });
  // return solidView.layout.children?.map((column: any) => {
  //   const fieldMetadata = solidFieldsMetadata[column.attrs.name];
  //   if (!fieldMetadata) {
  //     return;
  //   }

  //   return SolidKanbanViewFields({ solidKanbanViewMetaData, fieldMetadata, column });

  // });
};

const KanbanCard: React.FC<KanbanCardProps> = ({ data, solidKanbanViewMetaData, index, setLightboxUrls, setOpenLightbox }) => {

  const SolidRow = ({ children, attrs }: any) => {
    const className = attrs.className;
    return (
      <div className={`row ${className}`}>
        <div className="s_group">
          <div>
            {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
            <div className="grid">{children}</div>
          </div>
        </div>
      </div>
    );
  };
  const SolidColumn = ({ children, attrs }: any) => {
    const className = attrs.className;
    return (
      <div className={`${className}`}>
        <div className="s_group">
          <div>
            {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
            <div className="grid">{children}</div>
          </div>
        </div>

      </div>
    );
  };
  const SolidImage = ({ children, attrs }: any) => {
    const className = attrs.className;
    return (
      <div className={`${className}`}>
        <div className="s_group">
          <div>
            {attrs.label && <p className="s_group_heading">{attrs.label}</p>}
            <div className="grid">{children}</div>
          </div>
        </div>

      </div>
    );
  };

  const SolidField = ({ field, data, solidKanbanViewMetaData }: any) => {

    return renderFieldsDynamically(field, data, solidKanbanViewMetaData, setLightboxUrls, setOpenLightbox)
    // switch (solidKanbanViewMetaData[field.attrs.name].type) {
    //   case "mediaSingle":
    //     return <img src=""></img>
    //   default:
    //     return <p>{initialEntityData[field.attrs.name]}</p>

    // }
  };

  const SolidCard = ({ children }: any) => (
    <div className="p-fluid p-grid">
      {children}
    </div>
  );

  // Now render the form dynamically...
  const renderFormElementDynamically: any = (element: any, solidKanbanViewMetaData: any) => {
    const { type, attrs, children } = element;
    // const key = attrs?.name ?? generateRandomKey();
    const key = attrs?.name;
    switch (type) {
      case "card":
        return <SolidCard key={key}>{children.map((element: any) => renderFormElementDynamically(element, solidKanbanViewMetaData))}</SolidCard>;
      case "row":
        return <SolidRow key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidKanbanViewMetaData))}</SolidRow>;
      case "column":
        return <SolidColumn key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidKanbanViewMetaData))}</SolidColumn>;
      case "image":
        return <SolidImage key={key} attrs={attrs}>{children.map((element: any) => renderFormElementDynamically(element, solidKanbanViewMetaData))}</SolidImage>;

      case "field": {
        // const fieldMetadata = solidFieldsMetadata[attrs.name];
        const fieldMetadata = solidKanbanViewMetaData.solidFieldsMetadata[attrs.name];
        return <SolidField key={key} field={element} fieldMetadata={fieldMetadata} data={data ? data : null} solidKanbanViewMetaData={solidKanbanViewMetaData} />;
      }
      default:
        return null;
    }
  };

  const renderFormDynamically = (solidKanbanViewMetaData: any) => {
    if (!solidKanbanViewMetaData) {
      return;
    }
    const solidView = solidKanbanViewMetaData.solidView;
    const solidFieldsMetadata = solidKanbanViewMetaData.solidFieldsMetadata;
    if (!solidView || !solidFieldsMetadata) {
      return;
    }
    if (!solidView || !solidFieldsMetadata) {
      return;
    }
    const updatedLayout = solidView.layout.children;
    const dynamicForm = updatedLayout.map((element: any) => renderFormElementDynamically(element, solidKanbanViewMetaData));
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
          className="kanban-card-container"
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
            {renderFormDynamically(solidKanbanViewMetaData)}

            {/* {solidKanbanViewMetaData?.solidView?.layout?.layoutData &&
              Object.entries(solidKanbanViewMetaData?.solidView?.layout?.layoutData).map(([key, value]) => (
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
