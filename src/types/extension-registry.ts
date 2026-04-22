export const ExtensionComponentTypes = {
    listFieldWidget: "listFieldWidget",
    listRowAction: "listRowAction",
    listHeaderAction: "listHeaderAction",
    formFieldViewWidget: "formFieldViewWidget",
    formFieldEditWidget: "formFieldEditWidget",
    formAction: "formAction",
    formWidget: "formWidget",
    kanbanCardWidget: "kanbanCardWidget",
    cardWidget: "cardWidget",
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
