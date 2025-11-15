"use client";
import { pascalCase } from "change-case";

//Dynamic permission generators
export const createPermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.create`
};

export const insertManyPermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.insertMany`
};

export const updatePermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.update`
};

export const deletePermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.delete`
};

export const deleteManyPermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.deleteMany`
};

export const findPermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.findOne`
};

export const findManyPermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.findMany`
};

//Dynamic permission expression
export const permissionExpression = (modelName: string, permissionName : string) => {
    return `${pascalCase(modelName)}Controller.${permissionName}`
};