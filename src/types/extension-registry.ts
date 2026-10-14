export const ExtensionComponentTypes = {
    dashboardWidget: "dashboardWidget",
    listFieldWidget: "listFieldWidget",
    listRowAction: "listRowAction",
    kanbanCardAction: "kanbanCardAction",
    listHeaderAction: "listHeaderAction",
    kanbanHeaderAction: "kanbanHeaderAction",
    formFieldViewWidget: "formFieldViewWidget",
    formFieldEditWidget: "formFieldEditWidget",
    formAction: "formAction",
    formWidget: "formWidget",
    kanbanCardWidget: "kanbanCardWidget",
    cardWidget: "cardWidget",
    settingsWidgets: "settingsWidget",
    workflowNodeEditor: "workflowNodeEditor",
    workflowNodeDocs: "workflowNodeDocs",
    workflowNodeFieldEditor: "workflowNodeFieldEditor",
    workflowNodePaletteCard: "workflowNodePaletteCard",
    // Rendered inside the SolidX Agent chat when the agent emits a UiWidget event
    // whose `widget` equals the registered name. Receives ChatWidgetProps.
    chatInteractionWidget: "chatInteractionWidget",
    // Renders the body of a custom chatter message. Receives SolidChatterMessageWidgetProps.
    chatterMessageWidget: "chatterMessageWidget",
} as const;

export type ExtensionComponentType =
    (typeof ExtensionComponentTypes)[keyof typeof ExtensionComponentTypes];

/** Agent-facing contract for a chat widget that can be selected in a final response. */
export type AgentChatWidgetMetadata = {
    name: string;
    description: string;
    propsSchema: Record<string, unknown>;
};

/** Optional metadata shared by extension registration and the component's dynamic metadata hook. */
export type ExtensionComponentAdditionalMetadata = Record<string, unknown>;

/** Components may expose metadata without making the hook mandatory for existing extensions. */
export type ExtensionComponentMetadataProvider = {
    getExtensionMetadata?: () => ExtensionComponentAdditionalMetadata;
};

export const ExtensionFunctionTypes = {
    onFieldChange: "onFieldChange",
    onFieldBlur: "onFieldBlur",
    onFormDataLoad: "onFormDataLoad",
    onFormLayoutLoad: "onFormLayoutLoad",
    onFormLoad: "onFormLoad",
    onListLoad: "onListLoad",
    onBeforeListDataLoad: "onBeforeListDataLoad",
    onTreeLoad: "onTreeLoad",
    onBeforeTreeDataLoad: "onBeforeTreeDataLoad",
    afterLogin: "afterLogin",
    beforeLogout: "beforeLogout",
    onApplicationMount: "onApplicationMount",
} as const;

export type ExtensionFunctionType =
    (typeof ExtensionFunctionTypes)[keyof typeof ExtensionFunctionTypes];
