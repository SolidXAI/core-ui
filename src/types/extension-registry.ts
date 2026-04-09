export const ExtensionComponentTypes = {
    list_field_widget: "list_field_widget",
    list_row_action: "list_row_action",
    list_header_action: "list_header_action",
    form_field_view_widget: "form_field_view_widget",
    form_field_edit_widget: "form_field_edit_widget",
    form_action: "form_action",
    form_widget: "form_widget",
    kanban_card_widget: "kanban_card_widget",
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
    onBeforeTreeDataLoad: "onBeforeTreeDataLoad",
    onTreeLoad: "onTreeLoad",
    onBeforeListDataLoad: "onBeforeListDataLoad",
    afterLogin: "afterLogin",
    beforeLogout: "beforeLogout",
    onApplicationMount: "onApplicationMount",
} as const;

export type ExtensionFunctionType =
    (typeof ExtensionFunctionTypes)[keyof typeof ExtensionFunctionTypes];
