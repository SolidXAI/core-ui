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
