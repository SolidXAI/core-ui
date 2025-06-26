"use client";
import { pascalCase } from "change-case";


export const createPermission = (modelName: string) => {
    return `${pascalCase(modelName)}Controller.create`
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