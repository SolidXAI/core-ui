import hanldeEmailFormTypeChange from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeChangeHandler";
import hanldeEmailFormTypeLoad from "@/components/core/extension/solid-core/emailTemplate/emailFormTypeLoad";
import { RolePermissionsManyToManyFieldWidget } from "@/components/core/extension/solid-core/roleMetadata/RolePermissionsManyToManyFieldWidget";
import { SolidRelationManyToManyAutocompleteWidget } from "@/components/core/form/fields/relations/widgets/SolidRelationManyToManyAutocompleteWidget";
import { SolidRelationManyToManyCheckboxWidget } from "@/components/core/form/fields/relations/widgets/SolidRelationManyToManyCheckboxWidget";
import { CustomHtml } from "@/components/core/form/widgets/CustomHtml";
import React from "react";
import { SolidBooleanFieldCheckboxWidget } from "@/components/core/form/fields/widgets/SolidBooleanCheckboxFieldWidget";
import { SolidBooleanFieldSelectWidget } from "@/components/core/form/fields/widgets/SolidBooleanSelectFieldWidget";
import { SolidSelectionStaticAutocompleteWidget } from "@/components/core/form/fields/widgets/SolidSelectionStaticAutocompleteFieldWidget";
import { SolidSelectionStaticRadioWidget } from "@/components/core/form/fields/widgets/SolidSelectionStaticRadioFieldWidget";
import { SolidShortTextFieldTextRenderModeWidget } from "@/components/core/list/widgets/SolidShortTextFieldTextRenderModeWidget";
import { SolidShortTextFieldImageRenderModeWidget } from "@/components/core/list/widgets/SolidShortTextFieldImageRenderModeWidget";
import { SolidFormFieldViewModeWidget } from "@/components/core/form/fields/widgets/SolidFormFieldViewModeWidget";
import { SolidFormFieldJsonViewModeWidget } from "@/components/core/form/fields/widgets/SolidFormFieldJsonViewModeWidget";
import { SolidFormFieldPasswordViewModeWidget } from "@/components/core/form/fields/widgets/SolidFormFieldPasswordViewModeWidget";
import { SolidFormFieldRichTextViewModeWidget } from "@/components/core/form/fields/widgets/SolidFormFieldRichTextViewModeWidget";
import { SolidFormFieldMediaViewModeWidget } from "@/components/core/form/fields/widgets/SolidFormFieldMediaViewModeWidget";
import { SolidFormFieldRelationViewModeWidget } from "@/components/core/form/fields/widgets/SolidFormFieldRelationViewModeWidget";
import { SolidFormFieldViewMediaSingleWidget } from "@/components/core/form/fields/widgets/SolidFormFieldViewMediaSingleWidget";
import { SolidFormFieldViewMediaMultipleWidget } from "@/components/core/form/fields/widgets/SolidFormFieldViewMediaMultipleWidget";
import { SolidUserNameAvatarWidget } from "@/components/core/list/widgets/SolidUserNameAvatarWidget";

type ExtensionRegistry = {
    components: Record<string, React.ComponentType<any>>;
    functions: Record<string, (...args: any[]) => any>;
};

const extensionRegistry: ExtensionRegistry = {
    components: {},
    functions: {},
};

export const registerExtensionComponent = (name: string, component: React.ComponentType<any>, aliases: string[] = []) => {
    // console.log(`registerExtensionComponent invoked... ${name}`);
    extensionRegistry.components[name] = component;
    for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        extensionRegistry.components[alias] = component;
    }
};

export const registerExtensionFunction = (name: string, fn: (...args: any[]) => any) => {
    // console.log(`registerExtensionFunction invoked... ${name}`);
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
    // console.log(`Registry state: `, extensionRegistry);
    return extensionRegistry.functions[name];
};


// Register all the dynamic widget & functions from inside solid-core-ui
// Common
registerExtensionComponent("CustomHtml", CustomHtml, []);
registerExtensionComponent("SolidRelationManyToManyCheckboxWidget", SolidRelationManyToManyCheckboxWidget, ["checkbox"]);
registerExtensionComponent("SolidRelationManyToManyAutocompleteWidget", SolidRelationManyToManyAutocompleteWidget, ["autocomplete"]);
registerExtensionComponent("SolidBooleanFieldCheckboxWidget", SolidBooleanFieldCheckboxWidget, ["field-checkbox"]);
registerExtensionComponent("SolidBooleanFieldSelectWidget", SolidBooleanFieldSelectWidget, ["field-selectbox"]);
registerExtensionComponent("SolidSelectionStaticAutocompleteWidget", SolidSelectionStaticAutocompleteWidget, ["field-autocomplete"]);
registerExtensionComponent("SolidSelectionStaticRadioWidget", SolidSelectionStaticRadioWidget, ["field-radio"]);
registerExtensionComponent("SolidShortTextFieldTextRenderModeWidget", SolidShortTextFieldTextRenderModeWidget, []);
registerExtensionComponent("SolidShortTextFieldImageRenderModeWidget", SolidShortTextFieldImageRenderModeWidget, []);
registerExtensionComponent("SolidFormFieldViewModeWidget", SolidFormFieldViewModeWidget, []);
registerExtensionComponent("SolidFormFieldJsonViewModeWidget", SolidFormFieldJsonViewModeWidget, []);
registerExtensionComponent("SolidFormFieldPasswordViewModeWidget", SolidFormFieldPasswordViewModeWidget, []);
registerExtensionComponent("SolidFormFieldRichTextViewModeWidget", SolidFormFieldRichTextViewModeWidget, []);
registerExtensionComponent("SolidFormFieldMediaViewModeWidget", SolidFormFieldMediaViewModeWidget, []);
registerExtensionComponent("SolidFormFieldRelationViewModeWidget", SolidFormFieldRelationViewModeWidget, []);
registerExtensionComponent("SolidFormFieldViewMediaSingleWidget", SolidFormFieldViewMediaSingleWidget, []);
registerExtensionComponent("SolidFormFieldViewMediaMultipleWidget", SolidFormFieldViewMediaMultipleWidget, []);
registerExtensionComponent("SolidFormFieldViewMediaMultipleWidget", SolidFormFieldViewMediaMultipleWidget, []);
registerExtensionComponent("SolidUserNameAvatarWidget", SolidUserNameAvatarWidget, []);


// ModuleMetadata


// ModelMetadata


// Email Template
registerExtensionFunction("emailFormTypeChangeHandler", hanldeEmailFormTypeChange);
registerExtensionFunction("emailFormTypeLoad", hanldeEmailFormTypeLoad);

// RoleMetadata
registerExtensionComponent("RolePermissionsManyToManyFieldWidget", RolePermissionsManyToManyFieldWidget, ["inputSwitch"]);
