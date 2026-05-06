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

import { scheduleFrequencyOnFieldChangeHandler } from "@/components/core/extension/solid-core/scheduled-job/scheduleFrequencyOnFieldChangeHandler";


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
registerExtensionComponent("DefaultTextListWidget", DefaultTextListWidget, ExtensionComponentTypes.listFieldWidget);

// - shortText (image list)
registerExtensionComponent("SolidShortTextFieldImageListWidget", SolidShortTextFieldImageListWidget, ExtensionComponentTypes.listFieldWidget);

// - longText
registerExtensionComponent("SolidShortTextAvatarWidget", SolidShortTextAvatarWidget, ExtensionComponentTypes.listFieldWidget);

// - boolean
registerExtensionComponent("DefaultBooleanListWidget", DefaultBooleanListWidget, ExtensionComponentTypes.listFieldWidget);

// - mediaSingle
registerExtensionComponent("DefaultMediaSingleListWidget", DefaultMediaSingleListWidget, ExtensionComponentTypes.listFieldWidget);

// - mediaMultiple
registerExtensionComponent("DefaultMediaMultipleListWidget", DefaultMediaMultipleListWidget, ExtensionComponentTypes.listFieldWidget);

// - relation.many2one
registerExtensionComponent("DefaultRelationManyToOneListWidget", DefaultRelationManyToOneListWidget, ExtensionComponentTypes.listFieldWidget);

// - relation.many2one (avatar)
registerExtensionComponent("SolidManyToOneRelationAvatarListWidget", SolidManyToOneRelationAvatarListWidget, ExtensionComponentTypes.listFieldWidget);

// - relation.many2many
registerExtensionComponent("DefaultRelationManyToManyListWidget", DefaultRelationManyToManyListWidget, ExtensionComponentTypes.listFieldWidget);

// - relation.many2many (avatar)
registerExtensionComponent("SolidManyToManyRelationAvatarListWidget", SolidManyToManyRelationAvatarListWidget, ExtensionComponentTypes.listFieldWidget);

// - relation.one2many
registerExtensionComponent("DefaultRelationOneToManyListWidget", DefaultRelationOneToManyListWidget, ExtensionComponentTypes.listFieldWidget);

// - relation.datetime
registerExtensionComponent('DefaultDateTimeListWidget', DefaultDateTimeListWidget, ExtensionComponentTypes.listFieldWidget);
// - date
registerExtensionComponent('DefaultDateListWidget', DefaultDateListWidget, ExtensionComponentTypes.listFieldWidget);
// - datetime


registerExtensionComponent("SolidChatterMessageCoModelEntityIdListViewWidget", SolidChatterMessageCoModelEntityIdListViewWidget, ExtensionComponentTypes.listFieldWidget);
registerExtensionComponent("SolidMqMessageStageListViewWidget", SolidMqMessageStageListViewWidget, ExtensionComponentTypes.listFieldWidget);
registerExtensionComponent("SolidMqMessagesSummarizeListHeaderAction", SolidMqMessagesSummarizeListHeaderAction, ExtensionComponentTypes.listHeaderAction);

// ...


// 2. form view field edit widget 
// - shortText
registerExtensionComponent("DefaultShortTextFormEditWidget", DefaultShortTextFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - shortText (masked)
registerExtensionComponent("MaskedShortTextFormEditWidget", MaskedShortTextFormEditWidget, ExtensionComponentTypes.formFieldEditWidget, ["maskedShortTextEdit"]);

// - longText
registerExtensionComponent("DefaultLongTextFormEditWidget", DefaultLongTextFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - longText (json editor)
registerExtensionComponent("DynamicJsonEditorFormEditWidget", DynamicJsonEditorFormEditWidget, ExtensionComponentTypes.formFieldEditWidget, ["jsonEditor"]);

// - longText (json viewer)
registerExtensionComponent("DynamicJsonEditorFormViewWidget", DynamicJsonEditorFormViewWidget, ExtensionComponentTypes.formFieldViewWidget, ["jsonViewer"]);

// - longText (code editor)
registerExtensionComponent("CodeEditorFormEditWidget", CodeEditorFormEditWidget, ExtensionComponentTypes.formFieldEditWidget, ["codeEditor"]);

// - time
registerExtensionComponent("DefaultTimeFormEditWidget", DefaultTimeFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - date
registerExtensionComponent("DefaultDateFormEditWidget", DefaultDateFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - datetime
registerExtensionComponent("DefaultDateTimeFormEditWidget", DefaultDateTimeFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - boolean
registerExtensionComponent("DefaultBooleanFormEditWidget", DefaultBooleanFormEditWidget, ExtensionComponentTypes.formFieldEditWidget, ["booleanSelectbox"]);

// - boolean (checkbox)
registerExtensionComponent("SolidBooleanCheckboxStyleFormEditWidget", SolidBooleanCheckboxStyleFormEditWidget, ExtensionComponentTypes.formFieldEditWidget, ["booleanCheckbox"]);

// - boolean (switch)
registerExtensionComponent("SolidBooleanSwitchStyleFormEditWidget", SolidBooleanSwitchStyleFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - integer
registerExtensionComponent("DefaultIntegerFormEditWidget", DefaultIntegerFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - integer (slider)
registerExtensionComponent("SolidIntegerSliderStyleFormEditWidget", SolidIntegerSliderStyleFormEditWidget, ExtensionComponentTypes.formFieldEditWidget, ["integerSlider"]);

// - decimal
registerExtensionComponent("DefaultDecimalFormEditWidget", DefaultDecimalFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - email
registerExtensionComponent("DefaultEmailFormEditWidget", DefaultEmailFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - json
registerExtensionComponent("DefaultJsonFormEditWidget", DefaultJsonFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - password
registerExtensionComponent("DefaultPasswordFormEditWidget", DefaultPasswordFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - password (create)
registerExtensionComponent("DefaultPasswordFormCreateWidget", DefaultPasswordFormCreateWidget, ExtensionComponentTypes.formFieldEditWidget);

// - richText
registerExtensionComponent("DefaultRichTextFormEditWidget", DefaultRichTextFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - selectionStatic (autocomplete)
registerExtensionComponent("DefaultSelectionStaticAutocompleteFormEditWidget", DefaultSelectionStaticAutocompleteFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - selectionStatic (radio)
registerExtensionComponent("SolidSelectionStaticRadioFormEditWidget", SolidSelectionStaticRadioFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - selectionStatic (selectButton)
registerExtensionComponent("SolidSelectionStaticSelectButtonFormEditWidget", SolidSelectionStaticSelectButtonFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - selectionDynamic
registerExtensionComponent("DefaultSelectionDynamicFormEditWidget", DefaultSelectionDynamicFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// mediaSingle
registerExtensionComponent("DefaultMediaSingleFormEditWidget", DefaultMediaSingleFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// mediaMultiple
registerExtensionComponent("DefaultMediaMultipleFormEditWidget", DefaultMediaMultipleFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - relation.many2one
registerExtensionComponent("DefaultRelationManyToOneFormEditWidget", DefaultRelationManyToOneFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

registerExtensionComponent("PseudoRelationManyToOneFormWidget", PseudoRelationManyToOneFormWidget, ExtensionComponentTypes.formFieldEditWidget);


// - relation.many2many (autocomplete)
registerExtensionComponent("DefaultRelationManyToManyAutoCompleteFormEditWidget", DefaultRelationManyToManyAutoCompleteFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - relation.many2many (checkbox)
registerExtensionComponent("DefaultRelationManyToManyCheckBoxFormEditWidget", DefaultRelationManyToManyCheckBoxFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - relation.many2many (list)
registerExtensionComponent("DefaultRelationManyToManyListFormEditWidget", DefaultRelationManyToManyListFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// - relation.one2many
registerExtensionComponent("DefaultRelationOneToManyFormEditWidget", DefaultRelationOneToManyFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);
registerExtensionComponent("PseudoRelationOneToManyFormWidget", PseudoRelationOneToManyFormWidget, ExtensionComponentTypes.formFieldEditWidget);

// ...


// 3. form view field view widget 
// - shortText
// - longText
// - integer
// - decimal
// - email
registerExtensionComponent("DefaultShortTextFormViewWidget", DefaultShortTextFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - shortText (masked)
registerExtensionComponent("MaskedShortTextFormViewWidget", MaskedShortTextFormViewWidget, ExtensionComponentTypes.formFieldViewWidget, ["maskedShortTextForm"]);

// - time
registerExtensionComponent("DefaultTimeFormViewWidget", DefaultTimeFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - date
registerExtensionComponent("DefaultDateFormViewWidget", DefaultDateFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - datetime
registerExtensionComponent("DefaultDateTimeFormViewWidget", DefaultDateTimeFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - boolean
registerExtensionComponent("DefaultBooleanFormViewWidget", DefaultBooleanFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - json
registerExtensionComponent("DefaultJsonFormViewWidget", DefaultJsonFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - password
registerExtensionComponent("DefaultPasswordFormViewWidget", DefaultPasswordFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - richText
registerExtensionComponent("DefaultRichTextFormViewWidget", DefaultRichTextFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);


// - int
registerExtensionComponent("DefaultIntegerFormViewWidget", DefaultIntegerFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - Decimal
registerExtensionComponent("DefaultDecimalFormViewWidget", DefaultDecimalFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - selectionStatic
registerExtensionComponent("DefaultSelectionStaticFormViewWidget", DefaultSelectionStaticFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - selectionDynamic
registerExtensionComponent("DefaultSelectionDynamicFormViewWidget", DefaultSelectionDynamicFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// mediaSingle
registerExtensionComponent("DefaultMediaSingleFormViewWidget", DefaultMediaSingleFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

//mediaMultiple
registerExtensionComponent("DefaultMediaMultipleFormViewWidget", DefaultMediaMultipleFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - relation.many2one
registerExtensionComponent("DefaultRelationManyToOneFormViewWidget", DefaultRelationManyToOneFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// - relation.many2many
// - relation.one2many
registerExtensionComponent("DefaultRelationOneToManyFormViewWidget", DefaultRelationOneToManyFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);

// ...

// 4. list row action 
registerExtensionComponent("GenerateModelCodeRowAction", GenerateModelCodeRowAction, ExtensionComponentTypes.listRowAction);
registerExtensionComponent("GenerateModuleCodeRowAction", GenerateModuleCodeRowAction, ExtensionComponentTypes.listRowAction);
registerExtensionComponent("DeleteModelRowAction", DeleteModelRowAction, ExtensionComponentTypes.listRowAction);
registerExtensionComponent("DeleteModuleRowAction", DeleteModuleRowAction, ExtensionComponentTypes.listRowAction);

// 7. form widget 
registerExtensionComponent("CustomHtml", CustomHtml, ExtensionComponentTypes.formWidget);

// Common
registerExtensionComponent("ChartFormPreviewWidget", ChartFormPreviewWidget, ExtensionComponentTypes.formWidget, ["chart"]);

registerExtensionComponent("SolidChatterMessageCoModelEntityIdFormViewWidget", SolidChatterMessageCoModelEntityIdFormViewWidget, ExtensionComponentTypes.formFieldViewWidget);
registerExtensionComponent("SolidLovTypeChangeFormEditWidget", SolidLovTypeChangeFormEditWidget, ExtensionComponentTypes.formFieldEditWidget);

// Formview Default View widgets
registerExtensionComponent("MaskedShortTextListViewWidget", MaskedShortTextListViewWidget, ExtensionComponentTypes.listFieldWidget, ["maskedShortTextList"]);
registerExtensionComponent("PublishedStatusListViewWidget", PublishedStatusListViewWidget, ExtensionComponentTypes.listFieldWidget, ["publishedStatus"])

// Formview Custom view widgets
registerExtensionComponent("SolidRelationFieldAvatarFormWidget", SolidRelationFieldAvatarFormWidget, ExtensionComponentTypes.formFieldViewWidget);
registerExtensionComponent("SolidShortTextFieldAvatarWidget", SolidShortTextFieldAvatarWidget, ExtensionComponentTypes.formFieldViewWidget);
registerExtensionComponent("SolidAiInteractionMetadataFieldFormWidget", SolidAiInteractionMetadataFieldFormWidget, ExtensionComponentTypes.formFieldViewWidget);
registerExtensionComponent("SolidAiInteractionMessageFieldFormWidget", SolidAiInteractionMessageFieldFormWidget, ExtensionComponentTypes.formFieldViewWidget);
registerExtensionComponent("SolidS3FileViewerWidget", SolidS3FileViewerWidget, ExtensionComponentTypes.formFieldViewWidget);

// RoleMetadata
registerExtensionComponent("RolePermissionsManyToManyFieldWidget", RolePermissionsManyToManyFieldWidget, ExtensionComponentTypes.formFieldEditWidget, ["inputSwitch"]);

// Solid Google Material Symbols Icon
registerExtensionComponent("SolidIconEditWidget", SolidIconEditWidget, ExtensionComponentTypes.formFieldEditWidget);
registerExtensionComponent("SolidIconViewWidget", SolidIconViewWidget, ExtensionComponentTypes.formFieldViewWidget);
registerExtensionComponent("SolidMqMessageStageFormViewWIdget", SolidMqMessageStageFormViewWIdget, ExtensionComponentTypes.formFieldViewWidget);

// Kanban
registerExtensionComponent("MqMessageKanbanCardWidget", MqMessageKanbanCardWidget, ExtensionComponentTypes.kanbanCardWidget);
registerExtensionComponent("MediaCardWidget", MediaCardWidget, ExtensionComponentTypes.cardWidget);


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


registerExtensionFunction("scheduleFrequencyOnFieldChangeHandler", scheduleFrequencyOnFieldChangeHandler, ExtensionFunctionTypes.onFieldChange);