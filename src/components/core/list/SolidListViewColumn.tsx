import React from "react";
import SolidBigintColumn from "./columns/SolidBigintColumn";
import SolidBooleanColumn from "./columns/SolidBooleanColumn";
import SolidComputedColumn from "./columns/SolidComputedColumn";
import SolidDateColumn from "./columns/SolidDateColumn";
import SolidDatetimeColumn from "./columns/SolidDatetimeColumn";
import SolidDecimalColumn from "./columns/SolidDecimalColumn";
import SolidExternalIdColumn from "./columns/SolidExternalIdColumn";
import SolidFloatColumn from "./columns/SolidFloatColumn";
import SolidIntColumn from "./columns/SolidIntColumn";
import SolidLongTextColumn from "./columns/SolidLongTextColumn";
import SolidMediaMultipleColumn from "./columns/SolidMediaMultipleColumn";
import SolidMediaSingleColumn from "./columns/SolidMediaSingleColumn";
import SolidRelationColumn from "./columns/SolidRelationColumn";
import SolidRichTextColumn from "./columns/SolidRichTextColumn";
import SolidSelectionDynamicColumn from "./columns/SolidSelectionDynamicColumn";
import SolidSelectionStaticColumn from "./columns/SolidSelectionStaticColumn";
import SolidShortTextColumn from "./columns/SolidShortTextColumn";
import SolidTimeColumn from "./columns/SolidTimeColumn";
import SolidUuidColumn from "./columns/SolidUuidColumn";

export type SolidListViewColumnParams = {
    solidListViewMetaData: any;
    fieldMetadata: any,
    column: any,
    setLightboxUrls?: any,
    setOpenLightbox?: any,
    embeded?: boolean;    
};

export const isFieldSortable = (fieldMetadata: any): boolean => {
    if (!fieldMetadata) return false;
    const type = fieldMetadata.type;
    if (type === 'mediaSingle' || type === 'mediaMultiple') return false;
    if (type === 'relation') return fieldMetadata.relationType === 'many-to-one';
    return true;
};

export const getNumberOfInputs = (matchMode: any): number | null => {
    if (matchMode.label && matchMode.label === 'Not In') {
        matchMode = 'notIn';
    }

    switch (matchMode) {
        case 'between':
            return 2;
        case 'in':
        case 'notIn':
            return null;
        case 'startsWith':
        case 'contains':
        case 'notContains':
        case 'endsWith':
        case 'equals':
        case 'notEquals':
        case 'lt':
        case 'lte':
        case 'gt':
        case 'gte':
            return 1;
        default:
            return 1; // Default to single input if no specific match is found
    }
}

const mergeClassNames = (...classNames: Array<string | undefined | null | false>) =>
    classNames.filter(Boolean).join(" ");

const mergeStyles = (...styles: Array<React.CSSProperties | undefined | null>) =>
    styles.reduce<React.CSSProperties>((mergedStyles, style) => {
        return style ? { ...mergedStyles, ...style } : mergedStyles;
    }, {});

export const applyListColumnLayoutAttrs = (columnElement: React.ReactNode, column: any) => {
    if (!React.isValidElement(columnElement)) {
        return columnElement;
    }

    const attrs = column?.attrs ?? {};
    const props = columnElement.props as any;
    const className = mergeClassNames(
        props.className,
        attrs.className,
        attrs.columnClassName,
        attrs.cellClassName,
    );
    const headerClassName = mergeClassNames(
        props.headerClassName,
        attrs.headerClassName,
    );
    const style = mergeStyles(
        props.style,
        attrs.style,
        attrs.columnStyle,
        attrs.cellStyle,
    );
    const headerStyle = mergeStyles(
        props.headerStyle,
        attrs.headerStyle,
    );

    return React.cloneElement(columnElement, {
        className: className || undefined,
        headerClassName: headerClassName || undefined,
        style: Object.keys(style).length > 0 ? style : undefined,
        headerStyle: Object.keys(headerStyle).length > 0 ? headerStyle : undefined,
    } as any);
};

// // @ts-ignore
// const components = require.context('./columns', false, /Solid.*Column\.tsx$/);

// // Define a function to dynamically load components based on type
// const loadComponentByType = async (type: string) => {
//     try {
//         const componentName = `./columns/Solid${type.charAt(0).toUpperCase() + type.slice(1)}Column.tsx`;

//         // Dynamically import the component based on type
//         const componentModule = await import(componentName);

//         return componentModule.default;
//     } catch (error) {
//         console.error(`Failed to load component for type: ${type}`, error);
//         return null;
//     }
// };

export const SolidListViewColumn = ({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox, embeded }: SolidListViewColumnParams) => {

    if (!isFieldSortable(fieldMetadata) && column?.attrs?.sortable) {
        column = { ...column, attrs: { ...column.attrs, sortable: false } };
    }

    let renderedColumn: React.ReactNode;

    // And finally we can implement additional switching logic based on certain special fields. 
    if (fieldMetadata.name === 'id') {
        renderedColumn = SolidIntColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'int') {
        renderedColumn = SolidIntColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'bigint') {
        renderedColumn = SolidBigintColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'float') {
        renderedColumn = SolidFloatColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'decimal') {
        renderedColumn = SolidDecimalColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'shortText') {
        renderedColumn = SolidShortTextColumn({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox });
    }
    else if (fieldMetadata.type === 'longText') {
        renderedColumn = SolidLongTextColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'richText') {
        renderedColumn = SolidRichTextColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'email') {
        renderedColumn = SolidShortTextColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'boolean') {
        renderedColumn = SolidBooleanColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'date') {
        renderedColumn = SolidDateColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'datetime') {
        renderedColumn = SolidDatetimeColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'time') {
        renderedColumn = SolidTimeColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'relation') {
        renderedColumn = SolidRelationColumn({ solidListViewMetaData, fieldMetadata, column, embeded });
    }
    else if (fieldMetadata.type === 'mediaSingle') {
        renderedColumn = SolidMediaSingleColumn({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox });
    }
    else if (fieldMetadata.type === 'mediaMultiple') {
        renderedColumn = SolidMediaMultipleColumn({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox });
    }
    else if (fieldMetadata.type === 'selectionStatic') {
        renderedColumn = SolidSelectionStaticColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'selectionDynamic') {
        renderedColumn = SolidSelectionDynamicColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'computed') {
        renderedColumn = SolidComputedColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'externalId') {
        renderedColumn = SolidExternalIdColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else if (fieldMetadata.type === 'uuid') {
        renderedColumn = SolidUuidColumn({ solidListViewMetaData, fieldMetadata, column });
    }
    else {
        renderedColumn = SolidShortTextColumn({ solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox });
    }

    return applyListColumnLayoutAttrs(renderedColumn, column);
    // // Load everything else based on type and dynamically.
    // else {
    //     const ComponentFound = await loadComponentByType(fieldMetadata.type);
    //     const ComponentNotFound = ({ solidListViewMetaData, fieldMetadata, column }: SolidListViewColumnParams) => (
    //         <Column
    //             key={fieldMetadata.name}
    //             field={fieldMetadata.name}
    //             header={fieldMetadata.displayName}
    //             className="text-sm"
    //             sortable={false}
    //             filter={false}
    //             showFilterOperator={false}
    //             body={() => (<span>Type not supported</span>)}
    //             style={{ minWidth: "12rem" }}
    //             headerClassName="table-header-fs"
    //         ></Column>
    //     );

    //     return ComponentFound ? ComponentFound({ solidListViewMetaData, fieldMetadata, column }) : ComponentNotFound({ solidListViewMetaData, fieldMetadata, column });
    // }

    // TODO: we can implement additional switching logic based on the widget type being used to render the list view column.

};
