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
import { DefaultSelectionStaticAutocompleteFormEditWidget, DefaultSelectionStaticFormViewWidget, SolidSelectionStaticRadioFormEditWidget } from "@/components/core/form/fields/SolidSelectionStaticField";
import { DefaultShortTextFormEditWidget, DefaultShortTextFormViewWidget } from "@/components/core/form/fields/SolidShortTextField";
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
import { DefaultTimeFormEditWidget } from "@/components/core/form/fields/SolidTimeField";

type ExtensionRegistry = {
    components: Record<string, React.ComponentType<any>>;
    functions: Record<string, (...args: any[]) => any>;
};

const extensionRegistry: ExtensionRegistry = {
    components: {},
    functions: {},
};

export const registerExtensionComponent = (name: string, component: React.ComponentType<any>, aliases: string[] = []) => {
    extensionRegistry.components[name] = component;
    for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        extensionRegistry.components[alias] = component;
    }
};

export const registerExtensionFunction = (name: string, fn: (...args: any[]) => any) => {
    extensionRegistry.functions[name] = fn;
};

export const getExtensionComponent = (name: string): React.ComponentType<any> | null => {
    if (extensionRegistry.components[name]) {
        return extensionRegistry.components[name];
    }

    return null;

    // const extensionsPath = process.env.NEXT_PUBLIC_SOLID_EXTENSIONS_PATH || "";

    // // Ensure the environment variable is set
    // if (!extensionsPath) {
    //     console.warn(`No overrides path found. Using default components.`);
    //     return () => React.createElement("div", { className: "error-message" }, "Loading dynamic component failed (extensions path not found)");
    // }

    // try {
    //     // return dynamic(() => import(`@solid-extensions/${name}`).then((mod) => mod.default));
    //     return dynamic(() => import(`${extensionsPath}/${name}`).then((mod) => mod.default));
    // } catch (error) {
    //     console.warn(`Component ${name} not found, returning fallback.`);
    // }

    // // Return an empty component
    // return () => React.createElement("div", { className: "error-message" }, "Loading dynamic component failed (component not found)");
};

export const getExtensionFunction = (name: string) => {
    return extensionRegistry.functions[name];
};


// Register all the dynamic widget & functions from inside solid-core-ui
// Common
registerExtensionComponent("CustomHtml", CustomHtml, []);
registerExtensionComponent("GenerateModelCodeRowAction", GenerateModelCodeRowAction, []);
registerExtensionComponent("GenerateModuleCodeRowAction", GenerateModuleCodeRowAction, []);
registerExtensionComponent("DeleteModelRowAction", DeleteModelRowAction, []);
registerExtensionComponent("ChartFormPreviewWidget", ChartFormPreviewWidget, ["chart"]);


// Formview Default Edit widgets
registerExtensionComponent("DefaultDateFormEditWidget", DefaultDateFormEditWidget, []);
registerExtensionComponent("DefaultTimeFormEditWidget", DefaultTimeFormEditWidget, []);
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