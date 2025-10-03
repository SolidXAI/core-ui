import hanldeEmailFormTypeChange from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeChangeHandler";
import hanldeEmailFormTypeLoad from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeLoad";
import { RolePermissionsManyToManyFieldWidget } from "@/components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget";
import { CustomHtml } from "@/components/core/form/widgets/CustomHtml";
import React from "react";
import { SolidShortTextFieldImageListWidget } from "@/components/core/list/widgets/SolidShortTextFieldImageRenderModeWidget";
import { SolidShortTextAvatarWidget } from "@/components/core/list/widgets/SolidShortTextAvatarWidget";
import GenerateModelCodeRowAction from "@/components/core/extension/solid-core/modelMetadata/list/GenerateModelCodeRowAction";
import GenerateModuleCodeRowAction from "@/components/core/extension/solid-core/moduleMetadata/list/GenerateModuleCodeRowAction";
import { DefaultBooleanFormEditWidget, DefaultBooleanFormViewWidget, SolidBooleanCheckboxStyleFormEditWidget, SolidBooleanSwitchStyleFormEditWidget } from "@/components/core/form/fields/SolidBooleanField";
import { DefaultDateFormEditWidget, DefaultDateFormViewWidget } from "@/components/core/form/fields/SolidDateField";
import { DefaultDateTimeFormEditWidget, DefaultDateTimeFormViewWidget } from "@/components/core/form/fields/SolidDateTimeField";
import { DefaultDecimalFormEditWidget } from "@/components/core/form/fields/SolidDecimalField";
import { DefaultEmailFormEditWidget } from "@/components/core/form/fields/SolidEmailField";
import { DefaultIntegerFormEditWidget, SolidIntegerSliderStyleFormEditWidget } from "@/components/core/form/fields/SolidIntegerField";
import { DefaultJsonFormEditWidget, DefaultJsonFormViewWidget } from "@/components/core/form/fields/SolidJsonField";
import { DefaultLongTextFormEditWidget, CodeEditorFormEditWidget, DynamicJsonEditorFormEditWidget, DynamicJsonEditorFormViewWidget } from "@/components/core/form/fields/SolidLongTextField";
import { DefaultMediaMultipleFormEditWidget, DefaultMediaMultipleFormViewWidget } from "@/components/core/form/fields/SolidMediaMultipleField";
import { DefaultMediaSingleFormEditWidget, DefaultMediaSingleFormViewWidget } from "@/components/core/form/fields/SolidMediaSingleField";
import { DefaultPasswordFormCreateWidget, DefaultPasswordFormEditWidget, DefaultPasswordFormViewWidget } from "@/components/core/form/fields/SolidPasswordField";
import { DefaultRichTextFormEditWidget, DefaultRichTextFormViewWidget } from "@/components/core/form/fields/SolidRichTextField";
import { DefaultSelectionStaticAutocompleteFormEditWidget, DefaultSelectionStaticFormViewWidget, SolidSelectionStaticRadioFormEditWidget, SolidSelectionStaticSelectButtonFormEditWidget } from "@/components/core/form/fields/SolidSelectionStaticField";
import { DefaultShortTextFormEditWidget, DefaultShortTextFormViewWidget, MaskedShortTextFormViewWidget, MaskedShortTextFormEditWidget, MaskedShortTextListViewWidget } from "@/components/core/form/fields/SolidShortTextField";
import { DefaultRelationManyToOneFormEditWidget, DefaultRelationManyToOneFormViewWidget } from "@/components/core/form/fields/relations/SolidRelationManyToOneField";
import { DefaultRelationOneToManyFormEditWidget, DefaultRelationOneToManyFormViewWidget } from "@/components/core/form/fields/relations/SolidRelationOneToManyField";
import { DefaultRelationManyToManyAutoCompleteFormEditWidget, DefaultRelationManyToManyCheckBoxFormEditWidget } from "@/components/core/form/fields/relations/SolidRelationManyToManyField";
import { DefaultBooleanListWidget } from "@/components/core/list/columns/SolidBooleanColumn";
import { DefaultTextListWidget } from "@/components/core/list/columns/SolidShortTextColumn";
import { DefaultMediaSingleListWidget } from "@/components/core/list/columns/SolidMediaSingleColumn";
import { DefaultMediaMultipleListWidget } from "@/components/core/list/columns/SolidMediaMultipleColumn";
import { DefaultRelationManyToManyListWidget } from "@/components/core/list/columns/relations/SolidRelationManyToManyColumn";
import { DefaultRelationManyToOneListWidget } from "@/components/core/list/columns/relations/SolidRelationManyToOneColumn";
import { DefaultRelationOneToManyListWidget } from "@/components/core/list/columns/relations/SolidRelationOneToManyColumn";
import { SolidRelationFieldAvatarFormWidget } from "@/components/core/form/fields/widgets/SolidRelationFieldAvatarFormWidget";
import { DefaultSelectionDynamicFormEditWidget, DefaultSelectionDynamicFormViewWidget } from "@/components/core/form/fields/SolidSelectionDynamicField";
import { SolidIconEditWidget } from "@/components/core/form/fields/widgets/SolidIconEditWidget";
import { SolidIconViewWidget } from "@/components/core/form/fields/widgets/SolidIconViewWidget";
import { SolidManyToManyRelationAvatarListWidget } from "@/components/core/list/widgets/SolidManyToManyRelationAvatarListWidget";
import { SolidManyToOneRelationAvatarListWidget } from "@/components/core/list/widgets/SolidManyToOneRelationAvatarListWidget";
import { SolidShortTextFieldAvatarWidget } from "@/components/core/form/fields/widgets/SolidShortTextFieldAvatarWidget";
import DeleteModelRowAction from "@/components/core/extension/solid-core/modelMetadata/list/DeleteModelRowAction";
import ChartFormPreviewWidget from "@/components/core/extension/solid-core/dashboardQuestion/ChartFormPreviewWidget";
import { DefaultTimeFormEditWidget, DefaultTimeFormViewWidget } from "@/components/core/form/fields/SolidTimeField";
import { SolidAiInteractionMetadataFieldFormWidget } from "@/components/core/form/fields/widgets/SolidAiInteractionMetadataFieldFormWidget";

type ExtensionComponentType = null | 'list_field_widget' | 'form_field_view_widget' | 'form_field_edit_widget' | 'list_row_action ' | 'list_header_action' | 'form_action' | 'form_widget';

type ExtensionComponentMetadata = {
    component: React.ComponentType<any>;
    type: ExtensionComponentType;
    fieldType: string;
}


type ExtensionRegistry = {
    components: Record<string, ExtensionComponentMetadata>;
    functions: Record<string, (...args: any[]) => any>;
};

const extensionRegistry: ExtensionRegistry = {
    components: {},
    functions: {},
};

export const registerExtensionComponent = (name: string, component: React.ComponentType<any>, aliases: string[] = [], type: ExtensionComponentType = null, fieldType: string = '') => {
    extensionRegistry.components[name] = { 'component': component, 'type': type, 'fieldType': fieldType };
    for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        extensionRegistry.components[alias] = { 'component': component, 'type': type, 'fieldType': fieldType };
    }
};

export const registerExtensionFunction = (name: string, fn: (...args: any[]) => any) => {
    extensionRegistry.functions[name] = fn;
};

export const getExtensionComponent = (name: string): React.ComponentType<any> | null => {
    if (extensionRegistry.components[name]) {
        return extensionRegistry.components[name].component;
    }

    return null;
};

export const getExtensionComponents = (type: ExtensionComponentType, fieldType: string = ''): string[] | [] => {
    // TODO: iterate over all registered extensionComponents to fetch a list of componnents matching the type & fieldType (optional)
    // if (extensionRegistry.components[name]) {
    //     return extensionRegistry.components[name].component;
    // }

    // return null;

    return [];
};

export const getExtensionFunction = (name: string) => {
    return extensionRegistry.functions[name];
};

// # Extension components 
// 1. list field widget 
// - shortText
// - longText
// - relation.many2one
// - relation.many2many
// - relation.one2many
// ...

// 2. form field view widget 
// - shortText
// - longText
// - relation.many2one
// - relation.many2many
// - relation.one2many
// ...

// 3. form field edit widget 
// - shortText
// - longText
// - relation.many2one
// - relation.many2many
// - relation.one2many
// ...

// 4. list row action 
registerExtensionComponent("GenerateModelCodeRowAction", GenerateModelCodeRowAction, []);
registerExtensionComponent("GenerateModuleCodeRowAction", GenerateModuleCodeRowAction, []);
registerExtensionComponent("DeleteModelRowAction", DeleteModelRowAction, []);

// 5. list header action 

// 6. form action 

// 7. form widget 
registerExtensionComponent("CustomHtml", CustomHtml, []);


// # Extension functions 
// 1. 
// 2. 
// 3. 
// 4. 
// 5. 

// Register all the dynamic widget & functions from inside solid-core-ui
// Common
registerExtensionComponent("ChartFormPreviewWidget", ChartFormPreviewWidget, ["chart"]);

// Formview Default Edit widgets
registerExtensionComponent("DefaultDateFormEditWidget", DefaultDateFormEditWidget, []);
registerExtensionComponent("DefaultTimeFormEditWidget", DefaultTimeFormEditWidget, []);
registerExtensionComponent("DefaultTimeFormViewWidget", DefaultTimeFormViewWidget, []);
registerExtensionComponent("DefaultBooleanFormEditWidget", DefaultBooleanFormEditWidget, ["booleanSelectbox"]);
registerExtensionComponent("SolidBooleanCheckboxStyleFormEditWidget", SolidBooleanCheckboxStyleFormEditWidget, ["booleanCheckbox"]);
registerExtensionComponent("SolidBooleanSwitchStyleFormEditWidget", SolidBooleanSwitchStyleFormEditWidget, []);

registerExtensionComponent("DefaultDateTimeFormEditWidget", DefaultDateTimeFormEditWidget, []);
registerExtensionComponent("DefaultDecimalFormEditWidget", DefaultDecimalFormEditWidget, []);
registerExtensionComponent("DefaultEmailFormEditWidget", DefaultEmailFormEditWidget, []);
registerExtensionComponent("DefaultIntegerFormEditWidget", DefaultIntegerFormEditWidget, []);
registerExtensionComponent("SolidIntegerSliderStyleFormEditWidget", SolidIntegerSliderStyleFormEditWidget, ["integerSlider"]);
registerExtensionComponent("DefaultJsonFormEditWidget", DefaultJsonFormEditWidget, []);

registerExtensionComponent("DefaultLongTextFormEditWidget", DefaultLongTextFormEditWidget, []);
registerExtensionComponent("CodeEditorFormEditWidget", CodeEditorFormEditWidget, ["codeEditor"]);
registerExtensionComponent("DynamicJsonEditorFormEditWidget", DynamicJsonEditorFormEditWidget, ["jsonEditor"]);

registerExtensionComponent("DefaultMediaMultipleFormEditWidget", DefaultMediaMultipleFormEditWidget, []);
registerExtensionComponent("DefaultMediaSingleFormEditWidget", DefaultMediaSingleFormEditWidget, []);
registerExtensionComponent("DefaultPasswordFormEditWidget", DefaultPasswordFormEditWidget, []);
registerExtensionComponent("DefaultRichTextFormEditWidget", DefaultRichTextFormEditWidget, []);
registerExtensionComponent("DefaultSelectionStaticAutocompleteFormEditWidget", DefaultSelectionStaticAutocompleteFormEditWidget, []);
registerExtensionComponent("DefaultShortTextFormEditWidget", DefaultShortTextFormEditWidget, []);
registerExtensionComponent("DefaultRelationManyToOneFormEditWidget", DefaultRelationManyToOneFormEditWidget, []);
registerExtensionComponent("DefaultRelationManyToOneFormEditWidget", DefaultRelationManyToOneFormEditWidget, []);
registerExtensionComponent("DefaultRelationManyToManyAutoCompleteFormEditWidget", DefaultRelationManyToManyAutoCompleteFormEditWidget, []);
registerExtensionComponent("DefaultRelationManyToManyCheckBoxFormEditWidget", DefaultRelationManyToManyCheckBoxFormEditWidget, []);
registerExtensionComponent("SolidSelectionStaticRadioFormEditWidget", SolidSelectionStaticRadioFormEditWidget, []);
registerExtensionComponent("SolidSelectionStaticSelectButtonFormEditWidget", SolidSelectionStaticSelectButtonFormEditWidget, []);
registerExtensionComponent("DefaultSelectionDynamicFormEditWidget", DefaultSelectionDynamicFormEditWidget, []);
registerExtensionComponent("DefaultRelationOneToManyFormEditWidget", DefaultRelationOneToManyFormEditWidget, []);
registerExtensionComponent("DefaultPasswordFormCreateWidget", DefaultPasswordFormCreateWidget, []);

// Formview Custom Edit widgets


// Formview Default View widgets
registerExtensionComponent("DefaultMediaMultipleFormViewWidget", DefaultMediaMultipleFormViewWidget, []);
registerExtensionComponent("DefaultMediaSingleFormViewWidget", DefaultMediaSingleFormViewWidget, []);
registerExtensionComponent("DefaultPasswordFormViewWidget", DefaultPasswordFormViewWidget, []);
registerExtensionComponent("DefaultRichTextFormViewWidget", DefaultRichTextFormViewWidget, []);
registerExtensionComponent("DefaultShortTextFormViewWidget", DefaultShortTextFormViewWidget, []);
registerExtensionComponent("MaskedShortTextFormViewWidget", MaskedShortTextFormViewWidget, ["maskedShortTextForm"]);
registerExtensionComponent("MaskedShortTextFormEditWidget", MaskedShortTextFormEditWidget, ["maskedShortTextEdit"]);
registerExtensionComponent("MaskedShortTextListViewWidget", MaskedShortTextListViewWidget, ["maskedShortTextList"]);

// longText field
registerExtensionComponent("DynamicJsonEditorFormViewWidget", DynamicJsonEditorFormViewWidget, ["jsonViewer"]);
registerExtensionComponent("DefaultRelationOneToManyFormViewWidget", DefaultRelationOneToManyFormViewWidget, []);
registerExtensionComponent("DefaultJsonFormViewWidget", DefaultJsonFormViewWidget, []);
registerExtensionComponent("DefaultRelationManyToOneFormViewWidget", DefaultRelationManyToOneFormViewWidget, []);
registerExtensionComponent("DefaultSelectionStaticFormViewWidget", DefaultSelectionStaticFormViewWidget, []);
registerExtensionComponent("DefaultSelectionDynamicFormViewWidget", DefaultSelectionDynamicFormViewWidget, []);
registerExtensionComponent("DefaultBooleanFormViewWidget", DefaultBooleanFormViewWidget, []);
registerExtensionComponent("DefaultDateFormViewWidget", DefaultDateFormViewWidget, []);
registerExtensionComponent("DefaultDateTimeFormViewWidget", DefaultDateTimeFormViewWidget, []);

// Formview Custom view widgets
registerExtensionComponent("SolidRelationFieldAvatarFormWidget", SolidRelationFieldAvatarFormWidget, []);
registerExtensionComponent("SolidShortTextFieldAvatarWidget", SolidShortTextFieldAvatarWidget, []);
registerExtensionComponent("SolidAiInteractionMetadataFieldFormWidget", SolidAiInteractionMetadataFieldFormWidget, []);

// Listview default widgets
registerExtensionComponent("DefaultTextListWidget", DefaultTextListWidget, []);
registerExtensionComponent("DefaultBooleanListWidget", DefaultBooleanListWidget, []);
registerExtensionComponent("DefaultMediaSingleListWidget", DefaultMediaSingleListWidget, []);
registerExtensionComponent("DefaultMediaMultipleListWidget", DefaultMediaMultipleListWidget, []);
registerExtensionComponent("DefaultRelationManyToOneListWidget", DefaultRelationManyToOneListWidget, []);
registerExtensionComponent("DefaultRelationManyToManyListWidget", DefaultRelationManyToManyListWidget, []);
registerExtensionComponent("DefaultRelationOneToManyListWidget", DefaultRelationOneToManyListWidget, []);
registerExtensionComponent("SolidShortTextFieldImageListWidget", SolidShortTextFieldImageListWidget, []);

// Listview custom widgets
registerExtensionComponent("SolidShortTextAvatarWidget", SolidShortTextAvatarWidget, []);
registerExtensionComponent("SolidManyToManyRelationAvatarListWidget", SolidManyToManyRelationAvatarListWidget, []);
registerExtensionComponent("SolidManyToOneRelationAvatarListWidget", SolidManyToOneRelationAvatarListWidget, []);


// ModuleMetadata


// ModelMetadata


// Email Template
registerExtensionFunction("emailFormTypeChangeHandler", hanldeEmailFormTypeChange);
registerExtensionFunction("emailFormTypeLoad", hanldeEmailFormTypeLoad);

// RoleMetadata
registerExtensionComponent("RolePermissionsManyToManyFieldWidget", RolePermissionsManyToManyFieldWidget, ["inputSwitch"]);

// Solid Google Material Symbols Icon
registerExtensionComponent("SolidIconEditWidget", SolidIconEditWidget, []);
registerExtensionComponent("SolidIconViewWidget", SolidIconViewWidget, []);
