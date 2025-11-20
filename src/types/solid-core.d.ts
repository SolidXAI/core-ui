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
    editWidget?: string;
    viewWidget?: string;
    showLabel?: boolean;
    inlineListLayout?: any;
    inlineCreateLayout?: any;
    formButtons?: any;
    whereClause?: string;
    disabled?: boolean;
    readonly?: boolean;
};

// Generic representation of any node in our layout 
export type LayoutNodeType = "form" | "sheet" | "notebook" | "page" | "row" | "column" | "field" | "div" | "p" | "span" | "h1" | "h2" | "h3" | "list";
export type LayoutNode = {
    body?: string;
    type: LayoutNodeType;
    attrs: LayoutAttribute;
    children?: LayoutNode[];
};

export type ListLayoutType = {
    type: LayoutNodeType;
    attrs: LayoutAttribute;
    children?: any[];
};

// Event type
export type SolidUiEvents = "onFieldChange" | "onFieldBlur" | "onCustomWidgetRender" | "onFormDataLoad" | "onFormLayoutLoad" | "onFormLoad" | "onListLoad" | "afterLogin" | "beforeLogout";
export type SolidUiEvent = {
    type: SolidUiEvents;
    modifiedField?: string;
    modifiedFieldValue?: any;
    // This comes from Formik...
    formData: Record<string, any>;
    viewMetadata: SolidView;
    fieldsMetadata: FieldsMetadata;
    formViewLayout: LayoutNode;
};




export type SolidLoadForm = {
    parentData?: any,
    type: SolidUiEvents;
    formData: Record<string, any>;
    viewMetadata: SolidView;
    fieldsMetadata: FieldsMetadata;
    formViewLayout: LayoutNode;
}


export type SolidListUiEvent = {
    type: SolidUiEvents;
    listData: any[];
    fieldsMetadata: FieldsMetadata;
    totalRecords: number;
    viewMetadata: SolidView;
    listViewLayout: ListLayoutType;
};

export type SolidLoadList = {
    type: SolidUiEvents;
    listData: any[];
    fieldsMetadata: FieldsMetadata;
    totalRecords: number;
    viewMetadata: SolidView;
    listViewLayout: ListLayoutType;
}

export type SolidAfterLoginEvent = {
    type: SolidUiEvents;
    user: any
}


export enum SqlExpressionOperator {
    EQUALS = '$equals',
    NOT_EQUALS = '$notEquals',
    CONTAINS = '$contains',
    NOT_CONTAINS = '$notContains',
    STARTS_WITH = '$startsWith',
    ENDS_WITH = '$endsWith',
    IN = '$in',
    NOT_IN = '$notIn',
    BETWEEN = '$between',
    LT = '$lt',
    LTE = '$lte',
    GT = '$gt',
    GTE = '$gte'
}

export interface SqlExpression {
    variableName: string;
    operator: SqlExpressionOperator;
    value: string[];
}

export type SolidChartRendererProps = {
    question: any;
    filters: SqlExpression[];
    isPreview: boolean;
};

export type SolidFormWidgetProps = {
    field: any;
    // This comes from Formik...
    formData: Record<string, any>;
    viewMetadata: SolidView;
    fieldsMetadata: FieldsMetadata;
    formViewData: any;
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
    rowData: any
}

export type SolidListHeaderDynamicFunctionProps = {
    action: string,
    params: any,
    solidListViewMetaData: any
}

export type SolidListRowdataDynamicFunctionProps = {
    action: string,
    params: any,
    rowData: any,
    solidListViewMetaData: any
}

export type RootState = ReturnType<ReturnType<typeof initializeStore>['getState']>;


export interface AiInteraction {
    id: number;
    threadId: string;
    role: 'human' | 'gen-ai' | string;
    message: string;
    contentType?: string;
    status?: string;
    errorMessage?: string;
    modelUsed?: string;
    responseTimeMs?: number;
    metadata?: string;
    isApplied?: boolean;
    createdAt?: Date
}