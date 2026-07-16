
import { camelCase, upperFirst } from "lodash";

//Dynamic permission expression
export const permissionExpression = (modelName: string, permissionName : string) => {
    return `${upperFirst(camelCase(modelName))}Controller.${permissionName}`
};

export const importPermissionExpressions = [
    "ImportTransactionController.getImportTemplate",
    "ImportTransactionController.getImportInstructions",
    "ImportTransactionController.getImportMappingInfo",
    "ImportTransactionController.startImportSync",
    "ImportTransactionController.startImportAsync",
    "ImportTransactionController.exportFailedImportedImports",
];

export const exportPermissionExpressions = [
    "ExportTemplateController.startExportSync",
    "ExportTemplateController.startExportAsync",
];

export const hasAllPermissions = (actionsAllowed: string[] = [], permissionNames: string[] = []) => {
    return permissionNames.every((permissionName) => actionsAllowed.includes(permissionName));
};

type CollectionViewPermissionOptions = {
    includeDeleteMany?: boolean;
    includeFindOne?: boolean;
    includeInsertMany?: boolean;
};

export const getCollectionViewPermissionNames = (
    modelName: string,
    options: CollectionViewPermissionOptions = {},
) => {
    const {
        includeDeleteMany = true,
        includeFindOne = true,
        includeInsertMany = true,
    } = options;

    const permissionNames = [
        permissionExpression(modelName, "create"),
        permissionExpression(modelName, "delete"),
        permissionExpression(modelName, "update"),
        permissionExpression(modelName, "findMany"),
        ...importPermissionExpressions,
        ...exportPermissionExpressions,
        permissionExpression("userViewMetadata", "create"),
        permissionExpression("savedFilters", "create"),
    ];

    if (includeDeleteMany) {
        permissionNames.push(permissionExpression(modelName, "deleteMany"));
    }

    if (includeFindOne) {
        permissionNames.push(permissionExpression(modelName, "findOne"));
    }

    if (includeInsertMany) {
        permissionNames.push(permissionExpression(modelName, "insertMany"));
    }

    return permissionNames;
};

export const getFormViewPermissionNames = (modelName: string) => {
    return [
        permissionExpression(modelName, "create"),
        permissionExpression(modelName, "delete"),
        permissionExpression(modelName, "update"),
        permissionExpression(modelName, "findOne"),
        permissionExpression(modelName, "publish"),
        permissionExpression(modelName, "unpublish"),
        permissionExpression("chatterMessage", "findMany"),
    ];
};

export const canImportRecords = (actionsAllowed: string[] = [], modelName?: string) => {
    if (!modelName) return false;

    return actionsAllowed.includes(permissionExpression(modelName, "create")) &&
        hasAllPermissions(actionsAllowed, importPermissionExpressions);
};

export const canExportRecords = (actionsAllowed: string[] = [], modelName?: string) => {
    if (!modelName) return false;

    return actionsAllowed.includes(permissionExpression(modelName, "findMany")) &&
        hasAllPermissions(actionsAllowed, exportPermissionExpressions);
};
