
import { camelCase, upperFirst } from "lodash";

//Dynamic permission expression
export const permissionExpression = (modelName: string, permissionName : string) => {
    return `${upperFirst(camelCase(modelName))}Controller.${permissionName}`
};