import hanldeEmailFormTypeChange from "../components/core/extension/solid-core/emailTemplate/emailFormTypeChangeHandler";
import hanldeEmailFormTypeLoad from "../components/core/extension/solid-core/emailTemplate/emailFormTypeLoad";
import { RolePermissionsManyToManyFieldWidget } from "../components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget";
import { CustomHtml } from "../components/core/form/widgets/CustomHtml";
import React from "react";
import { SolidShortTextFieldImageListWidget } from "../components/core/list/widgets/SolidShortTextFieldImageRenderModeWidget";
import { SolidShortTextAvatarWidget } from "../components/core/list/widgets/SolidShortTextAvatarWidget";
import GenerateModelCodeRowAction from "../components/core/extension/solid-core/modelMetadata/list/GenerateModelCodeRowAction";
import GenerateModuleCodeRowAction from "../components/core/extension/solid-core/moduleMetadata/list/GenerateModuleCodeRowAction";
import { DefaultBooleanFormEditWidget, DefaultBooleanFormViewWidget, SolidBooleanCheckboxStyleFormEditWidget, SolidBooleanSwitchStyleFormEditWidget } from "../components/core/form/fields/SolidBooleanField";
import { DefaultDateFormEditWidget, DefaultDateFormViewWidget, PublishedStatusListViewWidget } from "../components/core/form/fields/SolidDateField";
import { DefaultDateTimeFormEditWidget, DefaultDateTimeFormViewWidget } from "../components/core/form/fields/SolidDateTimeField";
import { DefaultDecimalFormEditWidget, DefaultDecimalFormViewWidget } from "../components/core/form/fields/SolidDecimalField";
import { DefaultEmailFormEditWidget } from "../components/core/form/fields/SolidEmailField";
import { DefaultIntegerFormEditWidget, DefaultIntegerFormViewWidget, SolidIntegerSliderStyleFormEditWidget } from "../components/core/form/fields/SolidIntegerField";
import { DefaultJsonFormEditWidget, DefaultJsonFormViewWidget } from "../components/core/form/fields/SolidJsonField";
import { DefaultLongTextFormEditWidget, CodeEditorFormEditWidget, DynamicJsonEditorFormEditWidget, DynamicJsonEditorFormViewWidget, DynamicSelectionStaticEditWidget } from "../components/core/form/fields/SolidLongTextField";
import { DefaultMediaMultipleFormEditWidget, DefaultMediaMultipleFormViewWidget } from "../components/core/form/fields/SolidMediaMultipleField";
import { DefaultMediaSingleFormEditWidget, DefaultMediaSingleFormViewWidget } from "../components/core/form/fields/SolidMediaSingleField";
import { DefaultPasswordFormCreateWidget, DefaultPasswordFormEditWidget, DefaultPasswordFormViewWidget } from "../components/core/form/fields/SolidPasswordField";
import { DefaultRichTextFormEditWidget, DefaultRichTextFormViewWidget } from "../components/core/form/fields/SolidRichTextField";
import { DefaultSelectionStaticAutocompleteFormEditWidget, DefaultSelectionStaticFormViewWidget, SolidSelectionStaticRadioFormEditWidget, SolidSelectionStaticSelectButtonFormEditWidget } from "../components/core/form/fields/SolidSelectionStaticField";
import { DefaultShortTextFormEditWidget, DefaultShortTextFormViewWidget, MaskedShortTextFormViewWidget, MaskedShortTextFormEditWidget, MaskedShortTextListViewWidget } from "../components/core/form/fields/SolidShortTextField";
import { DefaultRelationManyToOneFormEditWidget, DefaultRelationManyToOneFormViewWidget, PseudoRelationManyToOneFormWidget } from "../components/core/form/fields/relations/SolidRelationManyToOneField";
import { DefaultRelationOneToManyFormEditWidget, DefaultRelationOneToManyFormViewWidget, PseudoRelationOneToManyFormWidget } from "../components/core/form/fields/relations/SolidRelationOneToManyField";
import { DefaultRelationManyToManyAutoCompleteFormEditWidget, DefaultRelationManyToManyCheckBoxFormEditWidget, DefaultRelationManyToManyListFormEditWidget } from "../components/core/form/fields/relations/SolidRelationManyToManyField";
import { DefaultBooleanListWidget } from "../components/core/list/columns/SolidBooleanColumn";
import { DefaultTextListWidget } from "../components/core/list/columns/SolidShortTextColumn";
import { DefaultMediaSingleListWidget } from "../components/core/list/columns/SolidMediaSingleColumn";
import { DefaultMediaMultipleListWidget } from "../components/core/list/columns/SolidMediaMultipleColumn";
import { DefaultRelationManyToManyListWidget } from "../components/core/list/columns/relations/SolidRelationManyToManyColumn";
import { DefaultRelationManyToOneListWidget } from "../components/core/list/columns/relations/SolidRelationManyToOneColumn";
import { DefaultRelationOneToManyListWidget } from "../components/core/list/columns/relations/SolidRelationOneToManyColumn";
import { SolidRelationFieldAvatarFormWidget } from "../components/core/form/fields/widgets/SolidRelationFieldAvatarFormWidget";
import { DefaultSelectionDynamicFormEditWidget, DefaultSelectionDynamicFormViewWidget } from "../components/core/form/fields/SolidSelectionDynamicField";
import { SolidIconEditWidget } from "../components/core/form/fields/widgets/SolidIconEditWidget";
import { SolidIconViewWidget } from "../components/core/form/fields/widgets/SolidIconViewWidget";
import { SolidManyToManyRelationAvatarListWidget } from "../components/core/list/widgets/SolidManyToManyRelationAvatarListWidget";
import { SolidManyToOneRelationAvatarListWidget } from "../components/core/list/widgets/SolidManyToOneRelationAvatarListWidget";
import { SolidShortTextFieldAvatarWidget } from "../components/core/form/fields/widgets/SolidShortTextFieldAvatarWidget";
import DeleteModelRowAction from "../components/core/extension/solid-core/modelMetadata/list/DeleteModelRowAction";
import ChartFormPreviewWidget from "../components/core/extension/solid-core/dashboardQuestion/ChartFormPreviewWidget";
import { DefaultTimeFormEditWidget, DefaultTimeFormViewWidget } from "../components/core/form/fields/SolidTimeField";
import { SolidAiInteractionMetadataFieldFormWidget } from "../components/core/form/fields/widgets/SolidAiInteractionMetadataFieldFormWidget";
import { SolidAiInteractionMessageFieldFormWidget } from "../components/core/form/fields/widgets/SolidAiInteractionMessageFieldFormWidget";
import { SolidS3FileViewerWidget } from "../components/core/form/fields/widgets/SolidS3FileViewerWidget";
import DeleteModuleRowAction from "../components/core/extension/solid-core/moduleMetadata/list/DeleteModuleRowAction";
import hanldeModelSequenceFormViewChange from "../components/core/extension/solid-core/modelSequence/modelSequenceFormViewChangeHandler";
import { DefaultDateListWidget, DefaultDateTimeListWidget } from "../components/core/list/columns/SolidDateColumn";
import dashboardFormViewChangeHandler from "../components/core/extension/solid-core/dashboard/dashboardFormViewChangeHandler";
import dashboardQuestionFieldChangeHandler from "../components/core/extension/solid-core/dashboard/dashboardQuestionFieldChangeHandler";
import dashboardQuestionOnFormLoadHandler from "../components/core/extension/solid-core/dashboard/dashboardQuestionOnFormLoadHandler";
import MqMessageKanbanCardWidget from "../components/core/extension/solid-core/mqMessage/kanban/MqMessageKanbanCardWidget";
import MediaCardWidget from "../components/core/extension/solid-core/media/card/MediaCardWidget";
import { SolidChatterMessageCoModelEntityIdListViewWidget } from "../components/core/extension/solid-core/chatterMessage/list/SolidChatterMessageCoModelEntityIdListViewWidget";
import { SolidMqMessageStageListViewWidget } from "../components/core/extension/solid-core/mqMessage/list/SolidMqMessageStageListViewWidget";
import { SolidMqMessagesSummarizeListHeaderAction } from "../components/core/extension/solid-core/mqMessage/list/SolidMqMessagesSummarizeListHeaderAction";
import { SolidChatterMessageCoModelEntityIdFormViewWidget } from "../components/core/extension/solid-core/chatterMessage/form/SolidChatterMessageCoModelEntityIdFormViewWidget";
import { SolidLovTypeChangeFormEditWidget } from "../components/core/extension/solid-core/listOfValues/form/SolidLovTypeChangeFormEditWidget";
import mqMessageOnFormLoadHandler from "../components/core/extension/solid-core/mqMessage/form/mqMessageOnFormLoadHandler";
import { SolidMqMessageStageFormViewWIdget } from "../components/core/extension/solid-core/mqMessage/form/SolidMqMessageStageFormViewWIdget";

import {
    ExtensionComponentTypes,
    ExtensionFunctionTypes,
    type ExtensionComponentType,
    type ExtensionFunctionType,
} from "../types/extension-registry";


type ExtensionComponentMetadata = {
    component: React.ComponentType<any>;
    type: ExtensionComponentType;
    fieldType: string;
}

type ExtensionFunctionMetadata = {
    fn: (...args: any[]) => any;
    type: ExtensionFunctionType;
}

type ExtensionRegistry = {
    components: Record<string, ExtensionComponentMetadata>;
    functions: Record<string, ExtensionFunctionMetadata>;
};

const extensionRegistry: ExtensionRegistry = {
    components: {},
    functions: {},
};

export const registerExtensionComponent = (name: string, component: React.ComponentType<any>, type: ExtensionComponentType, aliases: string[] = [], fieldType: string = '') => {
    extensionRegistry.components[name] = { 'component': component, 'type': type, 'fieldType': fieldType };
    for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        extensionRegistry.components[alias] = { 'component': component, 'type': type, 'fieldType': fieldType };
    }
};

export const registerExtensionFunction = (name: string, fn: (...args: any[]) => any, type: ExtensionFunctionType) => {
    extensionRegistry.functions[name] = { fn, type };
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
    return extensionRegistry.functions[name]?.fn;
};

// # Extension components 
// 1. list view columns field widget 
// - shortText
registerExtensionComponent("DefaultTextListWidget", DefaultTextListWidget, ExtensionComponentTypes.list_field_widget);

// - shortText (image list)
registerExtensionComponent("SolidShortTextFieldImageListWidget", SolidShortTextFieldImageListWidget, ExtensionComponentTypes.list_field_widget);

// - longText
registerExtensionComponent("SolidShortTextAvatarWidget", SolidShortTextAvatarWidget, ExtensionComponentTypes.list_field_widget);

// - boolean
registerExtensionComponent("DefaultBooleanListWidget", DefaultBooleanListWidget, ExtensionComponentTypes.list_field_widget);

// - mediaSingle
registerExtensionComponent("DefaultMediaSingleListWidget", DefaultMediaSingleListWidget, ExtensionComponentTypes.list_field_widget);

// - mediaMultiple
registerExtensionComponent("DefaultMediaMultipleListWidget", DefaultMediaMultipleListWidget, ExtensionComponentTypes.list_field_widget);

// - relation.many2one
registerExtensionComponent("DefaultRelationManyToOneListWidget", DefaultRelationManyToOneListWidget, ExtensionComponentTypes.list_field_widget);

// - relation.many2one (avatar)
registerExtensionComponent("SolidManyToOneRelationAvatarListWidget", SolidManyToOneRelationAvatarListWidget, ExtensionComponentTypes.list_field_widget);

// - relation.many2many
registerExtensionComponent("DefaultRelationManyToManyListWidget", DefaultRelationManyToManyListWidget, ExtensionComponentTypes.list_field_widget);

// - relation.many2many (avatar)
registerExtensionComponent("SolidManyToManyRelationAvatarListWidget", SolidManyToManyRelationAvatarListWidget, ExtensionComponentTypes.list_field_widget);

// - relation.one2many
registerExtensionComponent("DefaultRelationOneToManyListWidget", DefaultRelationOneToManyListWidget, ExtensionComponentTypes.list_field_widget);

// - relation.datetime
registerExtensionComponent('DefaultDateTimeListWidget', DefaultDateTimeListWidget, ExtensionComponentTypes.list_field_widget);
// - date
registerExtensionComponent('DefaultDateListWidget', DefaultDateListWidget, ExtensionComponentTypes.list_field_widget);
// - datetime


registerExtensionComponent("SolidChatterMessageCoModelEntityIdListViewWidget", SolidChatterMessageCoModelEntityIdListViewWidget, ExtensionComponentTypes.list_field_widget);
registerExtensionComponent("SolidMqMessageStageListViewWidget", SolidMqMessageStageListViewWidget, ExtensionComponentTypes.list_field_widget);
registerExtensionComponent("SolidMqMessagesSummarizeListHeaderAction", SolidMqMessagesSummarizeListHeaderAction, ExtensionComponentTypes.list_header_action);

// ...


// 2. form view field edit widget 
// - shortText
registerExtensionComponent("DefaultShortTextFormEditWidget", DefaultShortTextFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - shortText (masked)
registerExtensionComponent("MaskedShortTextFormEditWidget", MaskedShortTextFormEditWidget, ExtensionComponentTypes.form_field_edit_widget, ["maskedShortTextEdit"]);

// - longText
registerExtensionComponent("DefaultLongTextFormEditWidget", DefaultLongTextFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - longText (json editor)
registerExtensionComponent("DynamicJsonEditorFormEditWidget", DynamicJsonEditorFormEditWidget, ExtensionComponentTypes.form_field_edit_widget, ["jsonEditor"]);

// - longText (json viewer)
registerExtensionComponent("DynamicJsonEditorFormViewWidget", DynamicJsonEditorFormViewWidget, ExtensionComponentTypes.form_field_view_widget, ["jsonViewer"]);

// - longText (code editor)
registerExtensionComponent("CodeEditorFormEditWidget", CodeEditorFormEditWidget, ExtensionComponentTypes.form_field_edit_widget, ["codeEditor"]);

// - time
registerExtensionComponent("DefaultTimeFormEditWidget", DefaultTimeFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - date
registerExtensionComponent("DefaultDateFormEditWidget", DefaultDateFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - datetime
registerExtensionComponent("DefaultDateTimeFormEditWidget", DefaultDateTimeFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - boolean
registerExtensionComponent("DefaultBooleanFormEditWidget", DefaultBooleanFormEditWidget, ExtensionComponentTypes.form_field_edit_widget, ["booleanSelectbox"]);

// - boolean (checkbox)
registerExtensionComponent("SolidBooleanCheckboxStyleFormEditWidget", SolidBooleanCheckboxStyleFormEditWidget, ExtensionComponentTypes.form_field_edit_widget, ["booleanCheckbox"]);

// - boolean (switch)
registerExtensionComponent("SolidBooleanSwitchStyleFormEditWidget", SolidBooleanSwitchStyleFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - integer
registerExtensionComponent("DefaultIntegerFormEditWidget", DefaultIntegerFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - integer (slider)
registerExtensionComponent("SolidIntegerSliderStyleFormEditWidget", SolidIntegerSliderStyleFormEditWidget, ExtensionComponentTypes.form_field_edit_widget, ["integerSlider"]);

// - decimal
registerExtensionComponent("DefaultDecimalFormEditWidget", DefaultDecimalFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - email
registerExtensionComponent("DefaultEmailFormEditWidget", DefaultEmailFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - json
registerExtensionComponent("DefaultJsonFormEditWidget", DefaultJsonFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - password
registerExtensionComponent("DefaultPasswordFormEditWidget", DefaultPasswordFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - password (create)
registerExtensionComponent("DefaultPasswordFormCreateWidget", DefaultPasswordFormCreateWidget, ExtensionComponentTypes.form_field_edit_widget);

// - richText
registerExtensionComponent("DefaultRichTextFormEditWidget", DefaultRichTextFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - selectionStatic (autocomplete)
registerExtensionComponent("DefaultSelectionStaticAutocompleteFormEditWidget", DefaultSelectionStaticAutocompleteFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - selectionStatic (radio)
registerExtensionComponent("SolidSelectionStaticRadioFormEditWidget", SolidSelectionStaticRadioFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - selectionStatic (selectButton)
registerExtensionComponent("SolidSelectionStaticSelectButtonFormEditWidget", SolidSelectionStaticSelectButtonFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - selectionDynamic
registerExtensionComponent("DefaultSelectionDynamicFormEditWidget", DefaultSelectionDynamicFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// mediaSingle
registerExtensionComponent("DefaultMediaSingleFormEditWidget", DefaultMediaSingleFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// mediaMultiple
registerExtensionComponent("DefaultMediaMultipleFormEditWidget", DefaultMediaMultipleFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - relation.many2one
registerExtensionComponent("DefaultRelationManyToOneFormEditWidget", DefaultRelationManyToOneFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

registerExtensionComponent("PseudoRelationManyToOneFormWidget", PseudoRelationManyToOneFormWidget, ExtensionComponentTypes.form_field_edit_widget);


// - relation.many2many (autocomplete)
registerExtensionComponent("DefaultRelationManyToManyAutoCompleteFormEditWidget", DefaultRelationManyToManyAutoCompleteFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - relation.many2many (checkbox)
registerExtensionComponent("DefaultRelationManyToManyCheckBoxFormEditWidget", DefaultRelationManyToManyCheckBoxFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - relation.many2many (list)
registerExtensionComponent("DefaultRelationManyToManyListFormEditWidget", DefaultRelationManyToManyListFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// - relation.one2many
registerExtensionComponent("DefaultRelationOneToManyFormEditWidget", DefaultRelationOneToManyFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);
registerExtensionComponent("PseudoRelationOneToManyFormWidget", PseudoRelationOneToManyFormWidget, ExtensionComponentTypes.form_field_edit_widget);

// ...


// 3. form view field view widget 
// - shortText
// - longText
// - integer
// - decimal
// - email
registerExtensionComponent("DefaultShortTextFormViewWidget", DefaultShortTextFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - shortText (masked)
registerExtensionComponent("MaskedShortTextFormViewWidget", MaskedShortTextFormViewWidget, ExtensionComponentTypes.form_field_view_widget, ["maskedShortTextForm"]);

// - time
registerExtensionComponent("DefaultTimeFormViewWidget", DefaultTimeFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - date
registerExtensionComponent("DefaultDateFormViewWidget", DefaultDateFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - datetime
registerExtensionComponent("DefaultDateTimeFormViewWidget", DefaultDateTimeFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - boolean
registerExtensionComponent("DefaultBooleanFormViewWidget", DefaultBooleanFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - json
registerExtensionComponent("DefaultJsonFormViewWidget", DefaultJsonFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - password
registerExtensionComponent("DefaultPasswordFormViewWidget", DefaultPasswordFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - richText
registerExtensionComponent("DefaultRichTextFormViewWidget", DefaultRichTextFormViewWidget, ExtensionComponentTypes.form_field_view_widget);


// - int
registerExtensionComponent("DefaultIntegerFormViewWidget", DefaultIntegerFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - Decimal
registerExtensionComponent("DefaultDecimalFormViewWidget", DefaultDecimalFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - selectionStatic
registerExtensionComponent("DefaultSelectionStaticFormViewWidget", DefaultSelectionStaticFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - selectionDynamic
registerExtensionComponent("DefaultSelectionDynamicFormViewWidget", DefaultSelectionDynamicFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// mediaSingle
registerExtensionComponent("DefaultMediaSingleFormViewWidget", DefaultMediaSingleFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

//mediaMultiple
registerExtensionComponent("DefaultMediaMultipleFormViewWidget", DefaultMediaMultipleFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - relation.many2one
registerExtensionComponent("DefaultRelationManyToOneFormViewWidget", DefaultRelationManyToOneFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// - relation.many2many
// - relation.one2many
registerExtensionComponent("DefaultRelationOneToManyFormViewWidget", DefaultRelationOneToManyFormViewWidget, ExtensionComponentTypes.form_field_view_widget);

// ...

// 4. list row action 
registerExtensionComponent("GenerateModelCodeRowAction", GenerateModelCodeRowAction, ExtensionComponentTypes.list_row_action);
registerExtensionComponent("GenerateModuleCodeRowAction", GenerateModuleCodeRowAction, ExtensionComponentTypes.list_row_action);
registerExtensionComponent("DeleteModelRowAction", DeleteModelRowAction, ExtensionComponentTypes.list_row_action);
registerExtensionComponent("DeleteModuleRowAction", DeleteModuleRowAction, ExtensionComponentTypes.list_row_action);

// 7. form widget 
registerExtensionComponent("CustomHtml", CustomHtml, ExtensionComponentTypes.form_widget);

// Common
registerExtensionComponent("ChartFormPreviewWidget", ChartFormPreviewWidget, ExtensionComponentTypes.form_widget, ["chart"]);

registerExtensionComponent("SolidChatterMessageCoModelEntityIdFormViewWidget", SolidChatterMessageCoModelEntityIdFormViewWidget, ExtensionComponentTypes.form_field_view_widget);
registerExtensionComponent("SolidLovTypeChangeFormEditWidget", SolidLovTypeChangeFormEditWidget, ExtensionComponentTypes.form_field_edit_widget);

// Formview Default View widgets
registerExtensionComponent("MaskedShortTextListViewWidget", MaskedShortTextListViewWidget, ExtensionComponentTypes.list_field_widget, ["maskedShortTextList"]);
registerExtensionComponent("PublishedStatusListViewWidget", PublishedStatusListViewWidget, ExtensionComponentTypes.list_field_widget, ["publishedStatus"])

// Formview Custom view widgets
registerExtensionComponent("SolidRelationFieldAvatarFormWidget", SolidRelationFieldAvatarFormWidget, ExtensionComponentTypes.form_field_view_widget);
registerExtensionComponent("SolidShortTextFieldAvatarWidget", SolidShortTextFieldAvatarWidget, ExtensionComponentTypes.form_field_view_widget);
registerExtensionComponent("SolidAiInteractionMetadataFieldFormWidget", SolidAiInteractionMetadataFieldFormWidget, ExtensionComponentTypes.form_field_view_widget);
registerExtensionComponent("SolidAiInteractionMessageFieldFormWidget", SolidAiInteractionMessageFieldFormWidget, ExtensionComponentTypes.form_field_view_widget);
registerExtensionComponent("SolidS3FileViewerWidget", SolidS3FileViewerWidget, ExtensionComponentTypes.form_field_view_widget);

// RoleMetadata
registerExtensionComponent("RolePermissionsManyToManyFieldWidget", RolePermissionsManyToManyFieldWidget, ExtensionComponentTypes.form_field_edit_widget, ["inputSwitch"]);

// Solid Google Material Symbols Icon
registerExtensionComponent("SolidIconEditWidget", SolidIconEditWidget, ExtensionComponentTypes.form_field_edit_widget);
registerExtensionComponent("SolidIconViewWidget", SolidIconViewWidget, ExtensionComponentTypes.form_field_view_widget);
registerExtensionComponent("SolidMqMessageStageFormViewWIdget", SolidMqMessageStageFormViewWIdget, ExtensionComponentTypes.form_field_view_widget);

// Kanban
registerExtensionComponent("MqMessageKanbanCardWidget", MqMessageKanbanCardWidget, ExtensionComponentTypes.kanban_card_widget);
registerExtensionComponent("MediaCardWidget", MediaCardWidget, ExtensionComponentTypes.card_widget);


// # Extension functions 
// Email Template
registerExtensionFunction("emailFormTypeChangeHandler", hanldeEmailFormTypeChange, ExtensionFunctionTypes.onFieldChange);
registerExtensionFunction("emailFormTypeLoad", hanldeEmailFormTypeLoad, ExtensionFunctionTypes.onFormLayoutLoad);

// Dashboard
registerExtensionFunction("dashboardFormViewChangeHandler", dashboardFormViewChangeHandler, ExtensionFunctionTypes.onFieldChange);
registerExtensionFunction("dashboardQuestionFieldChangeHandler", dashboardQuestionFieldChangeHandler, ExtensionFunctionTypes.onFieldChange);
registerExtensionFunction("dashboardQuestionOnFormLoadHandler", dashboardQuestionOnFormLoadHandler, ExtensionFunctionTypes.onFormLoad);

// Model Sequence 
// TODO: @Jyotsana you need to create an extension function which will be used "onFieldChange"
// on change of module, apply a where clause on the model & field fields.. 
// on change of model, apply a where clause on the field field...
registerExtensionFunction("modelSequenceFormViewChangeHandler", hanldeModelSequenceFormViewChange, ExtensionFunctionTypes.onFieldChange);
registerExtensionFunction("mqMessageOnFormLoadHandler", mqMessageOnFormLoadHandler, ExtensionFunctionTypes.onFormLoad);
