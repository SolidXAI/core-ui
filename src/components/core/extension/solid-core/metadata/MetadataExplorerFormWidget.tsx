import React from 'react';
import { ModuleMetadataExplorer } from '../../../module/ModuleMetadataExplorer';
import { SolidFormWidgetProps } from '../../../../../types/solid-core';

/**
 * MetadataExplorerFormWidget
 *
 * A generic formWidget that embeds ModuleMetadataExplorer scoped to the
 * specific record being viewed.
 *
 * Configured via layout attrs in solid-core-metadata.json:
 *   moduleName    - static module name fallback (e.g. 'solid-core').
 *                   If the record has a 'module' relation, that takes priority.
 *   arrayPath     - root-level key in the JSON (e.g. 'views', 'actions', 'menus')
 *   itemNameField - field on each array item to match against (e.g. 'name',
 *                   'scheduleName', 'sequenceName'). Defaults to 'name'.
 */
export const MetadataExplorerFormWidget = ({ field, formData }: SolidFormWidgetProps) => {
    const { moduleName: staticModuleName, arrayPath, itemNameField = 'name' } = field?.attrs ?? {};

    // Resolve moduleName dynamically from the record's module relation when available.
    // formData.module can be a relation object ({ name: "solid-core", ... }) or a string.
    const dynamicModuleName: string | undefined =
        formData?.module && typeof formData.module === 'object'
            ? formData.module.name
            : typeof formData?.module === 'string'
            ? formData.module
            : undefined;

    const moduleName = dynamicModuleName ?? staticModuleName;
    const scopedItemValue = formData?.[itemNameField];

    return (
        <ModuleMetadataExplorer
            moduleName={moduleName}
            scopedArrayPath={arrayPath}
            scopedItemValue={scopedItemValue}
            scopedItemField={itemNameField}
            readOnly
            allowSeed={false}
        />
    );
};
