import hanldeEmailFormTypeChange from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeChangeHandler";
import hanldeEmailFormTypeLoad from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeLoad";
import { RolePermissionsManyToManyFieldWidget } from "@/components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget";
import { CustomHtml } from "@/components/core/form/widgets/CustomHtml";
import React from "react";
import { SolidShortTextFieldImageListWidget } from "@/components/core/list/widgets/SolidShortTextFieldImageRenderModeWidget";
import { SolidShortTextAvatarWidget } from "@/components/core/list/widgets/SolidShortTextAvatarWidget";
import GenerateModelCodeRowAction from "@/components/core/extension/solid-core/modelMetadata/list/GenerateModelCodeRowAction";
import GenerateModuleCodeRowAction from "@/components/core/extension/solid-core/moduleMetadata/list/GenerateModuleCodeRowAction";
import { DefaultBooleanFormEditWidget, SolidBooleanCheckboxStyleFormEditWidget, SolidBooleanSwitchStyleFormEditWidget } from "@/components/core/form/fields/SolidBooleanField";
import { DefaultDateFormEditWidget } from "@/components/core/form/fields/SolidDateField";
import { DefaultDateTimeFormEditWidget } from "@/components/core/form/fields/SolidDateTimeField";
import { DefaultDecimalFormEditWidget } from "@/components/core/form/fields/SolidDecimalField";
import { DefaultEmailFormEditWidget } from "@/components/core/form/fields/SolidEmailField";
import { DefaultIntegerFormEditWidget, SolidIntegerSliderStyleFormEditWidget } from "@/components/core/form/fields/SolidIntegerField";
import { DefaultJsonFormEditWidget, DefaultJsonFormViewWidget } from "@/components/core/form/fields/SolidJsonField";
import { DefaultLongTextFormEditWidget } from "@/components/core/form/fields/SolidLongTextField";
import { DefaultMediaMultipleFormEditWidget, DefaultMediaMultipleFormViewWidget } from "@/components/core/form/fields/SolidMediaMultipleField";
import { DefaultMediaSingleFormEditWidget, DefaultMediaSingleFormViewWidget } from "@/components/core/form/fields/SolidMediaSingleField";
import { DefaultPasswordFormEditWidget, DefaultPasswordFormViewWidget } from "@/components/core/form/fields/SolidPasswordField";
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
import { SolidRelationAvatarWidget } from "@/components/core/list/widgets/SolidRelationAvatarWidget";
import { SolidRelationFieldAvatarFormWidget } from "@/components/core/form/fields/widgets/SolidRelationFieldAvatarFormWidget";
import { DefaultSelectionDynamicFormEditWidget, DefaultSelectionDynamicFormViewWidget } from "@/components/core/form/fields/SolidSelectionDynamicField";

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


// Formview Default Edit widgets
registerExtensionComponent("DefaultDateFormEditWidget", DefaultDateFormEditWidget, []);
registerExtensionComponent("DefaultBooleanFormEditWidget", DefaultBooleanFormEditWidget, ["booleanSelectbox"]);
registerExtensionComponent("SolidBooleanCheckboxStyleFormEditWidget", SolidBooleanCheckboxStyleFormEditWidget, ["booleanCheckbox"]);
registerExtensionComponent("SolidBooleanSwitchStyleFormEditWidget", SolidBooleanSwitchStyleFormEditWidget,[]);


registerExtensionComponent("DefaultDateTimeFormEditWidget", DefaultDateTimeFormEditWidget, []);
registerExtensionComponent("DefaultDecimalFormEditWidget", DefaultDecimalFormEditWidget, []);
registerExtensionComponent("DefaultEmailFormEditWidget", DefaultEmailFormEditWidget, []);
registerExtensionComponent("DefaultIntegerFormEditWidget", DefaultIntegerFormEditWidget, []);
registerExtensionComponent("SolidIntegerSliderStyleFormEditWidget", SolidIntegerSliderStyleFormEditWidget, ["integerSlider"]);
registerExtensionComponent("DefaultJsonFormEditWidget", DefaultJsonFormEditWidget, []);
registerExtensionComponent("DefaultLongTextFormEditWidget", DefaultLongTextFormEditWidget, []);
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

// Formview Custom Edit widgets


// Formview Default View widgets
registerExtensionComponent("DefaultMediaMultipleFormViewWidget", DefaultMediaMultipleFormViewWidget, []);
registerExtensionComponent("DefaultMediaSingleFormViewWidget", DefaultMediaSingleFormViewWidget, []);
registerExtensionComponent("DefaultPasswordFormViewWidget", DefaultPasswordFormViewWidget, []);
registerExtensionComponent("DefaultRichTextFormViewWidget", DefaultRichTextFormViewWidget, []);
registerExtensionComponent("DefaultShortTextFormViewWidget", DefaultShortTextFormViewWidget, []);
registerExtensionComponent("DefaultRelationOneToManyFormViewWidget", DefaultRelationOneToManyFormViewWidget, []);
registerExtensionComponent("DefaultJsonFormViewWidget", DefaultJsonFormViewWidget, []);
registerExtensionComponent("DefaultRelationManyToOneFormViewWidget", DefaultRelationManyToOneFormViewWidget, []);
registerExtensionComponent("DefaultSelectionStaticFormViewWidget", DefaultSelectionStaticFormViewWidget, []);
registerExtensionComponent("DefaultSelectionDynamicFormViewWidget", DefaultSelectionDynamicFormViewWidget, []);

// Formview Custom view widgets
registerExtensionComponent("SolidRelationFieldAvatarFormWidget", SolidRelationFieldAvatarFormWidget, []);



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
registerExtensionComponent("SolidRelationAvatarWidget", SolidRelationAvatarWidget, []);


// ModuleMetadata


// ModelMetadata


// Email Template
registerExtensionFunction("emailFormTypeChangeHandler", hanldeEmailFormTypeChange);
registerExtensionFunction("emailFormTypeLoad", hanldeEmailFormTypeLoad);

// RoleMetadata
registerExtensionComponent("RolePermissionsManyToManyFieldWidget", RolePermissionsManyToManyFieldWidget, ["inputSwitch"]);
