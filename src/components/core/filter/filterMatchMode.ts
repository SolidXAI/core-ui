export const FilterMatchMode = {
  STARTS_WITH: "startsWith",
  CONTAINS: "contains",
  NOT_CONTAINS: "notContains",
  ENDS_WITH: "endsWith",
  EQUALS: "equals",
  NOT_EQUALS: "notEquals",
  GREATER_THAN: "gt",
  GREATER_THAN_OR_EQUAL_TO: "gte",
  LESS_THAN: "lt",
  LESS_THAN_OR_EQUAL_TO: "lte",
  IN: "in",
  NOT_IN: "notIn",
  BETWEEN: "between",
} as const;

export type FilterMatchModeValue =
  (typeof FilterMatchMode)[keyof typeof FilterMatchMode];
