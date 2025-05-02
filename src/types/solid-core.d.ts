// Base type of all Solid entities
export type CommonEntity = {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    deletedTracker: string;
};

// Model
export type ModelMetadata = CommonEntity & {
    singularName: string;
    tableName: string;
    pluralName: string;
    displayName: string;
    description: string;
    dataSource: string;
    dataSourceType: string;
    enableSoftDelete: boolean;
    enableAuditTracking: boolean;
    internationalisation: boolean;
    isSystem: boolean;
    userKeyField: string | null;
};

// Module 
export type ModuleMetadata = CommonEntity & {
    displayName: string;
    name: string;
    description: string;
    menuIconUrl: string | null;
    menuSequenceNumber: number;
    defaultDataSource: string;
    isSystem: boolean;
};

// Define a general Field type with id and name as required properties
export type FieldMetadata = CommonEntity & {
    id: number;
    name: string;
    displayName: string;

    // For now we have kept it flexible allowing any number of other key / value pairs...
    [key: string]: any;
};

// Represents a collection of fields.
export type FieldsMetadata = {
    [key: string]: Field;
};

// Solid View
export type SolidView = CommonEntity & {
    name: string;
    displayName: string;
    type: string;
    // TODO: maybe change this in the future to set this to a json object...
    context: string;
    layout: LayoutNode;
    model: Model;
    module: Module;
};

// Layout Types
export type LayoutAttribute = {
    name: string;
    label?: string;
    className?: string;
    inlineCreate?: string;
    renderMode?: string;
    widget?: string;
    visible?: boolean;
};

// Generic representation of any node in our layout 
export type LayoutNodeType = "form" | "sheet" | "notebook" | "page" | "row" | "column" | "field" | "div" | "p" | "span" | "h1" | "h2" | "h3";
export type LayoutNode = {
    body?: string;
    type: LayoutNodeType;
    attrs: LayoutAttribute;
    children?: LayoutNode[];
};

// Event type
export type SolidUiEvents = "onFieldChange" | "onFieldBlur" | "onCustomWidgetRender" | "onFormDataLoad" | "onFormLayoutLoad";
export type SolidUiEvent = {
    type: SolidUiEvents;
    modifiedField?: string;
    modifiedFieldValue?: any;
    // This comes from Formik...
    formData: Record<string, any>;
    viewMetadata: SolidView;
    fieldsMetadata: FieldsMetadata;
};

export type SolidLoadForm = {
    parentData?: any,
    type: SolidUiEvents;
    formData: Record<string, any>;
    viewMetadata: SolidView;
    fieldsMetadata: FieldsMetadata;
}

export type SolidFormWidgetProps = {
    field: any;
    // This comes from Formik...
    formData: Record<string, any>;
    viewMetadata: SolidView;
    fieldsMetadata: FieldsMetadata;
};

export type SolidFormFieldWidgetProps = {
    formik: any;
    fieldContext?: SolidFieldProps;
}
export type SolidListFieldWidgetProps = {
    rowData: any;
    solidListViewMetaData: any
    fieldMetadata: FieldMetadata;
    column: any;
}

export type SolidMediaListFieldWidgetProps = SolidListFieldWidgetProps & {
    setLightboxUrls?: any,
    setOpenLightbox?: any
}

export type SolidMediaFormFieldWidgetProps = SolidFormFieldWidgetProps & {
    setLightboxUrls?: any,
    setOpenLightbox?: any
}

export type SolidShortTextImageRenderModeWidgetProps = {
    data: string;
}


export type SolidFormDynamicFunctionProps = {
    action: string,
    params: any,
    formik: any;
    solidFormViewMetaData: SolidView;
}


export type SolidListHeaderDynamicFunctionProps = {
    action: string,
    params: any,
    solidListViewMetaData: any
}


export type SolidListRowdataDynamicFunctionProps = {
    action: string,
    params: any
    rowData: any
    solidListViewMetaData: any
}

export type RootState = ReturnType<ReturnType<typeof initializeStore>['getState']>;
