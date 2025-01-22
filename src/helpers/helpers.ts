"use client";
import { camelCase, kebabCase, snakeCase } from "lodash";
import moment from "moment";
import pluralize from "pluralize";

export const calculateDaysOfStay = (checkInDate: Date, checkOutDate: Date) => {
  const startDate = moment(checkInDate);
  const endDate = moment(checkOutDate);

  return endDate.diff(startDate, "days") + 1;
};

export const addCommasToAmount = (amount: string) => {
  amount = amount.toString();

  const parts = amount.split(".");

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return parts.join(".");
};


export const getSingularAndPlural = (displayName: any) => {
  // Convert display name to kebab-case (lowercase with hyphens)
  const toKebabCase: any = kebabCase(displayName);

  const toSnakeCase: any = snakeCase(displayName);

  const toCamelCase: any = camelCase(displayName);


  // Get the plural form using pluralize
  const toPluralKebabCase = pluralize(toKebabCase);

  const toPluralCamelCase = pluralize(toCamelCase);


  return { toKebabCase, toSnakeCase, toPluralKebabCase, toPluralCamelCase,toCamelCase };
};
