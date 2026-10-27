export const RelativeDateMatchMode = {
  THIS_WEEK: "$thisWeek",
  THIS_MONTH: "$thisMonth",
} as const;

export type RelativeDateMatchModeValue =
  (typeof RelativeDateMatchMode)[keyof typeof RelativeDateMatchMode];

export type RelativeDateFieldType = "date" | "datetime";

const RELATIVE_DATE_TOKENS = {
  thisWeek: {
    date: ["$thisWeekStartDate", "$thisWeekEndDate"],
    datetime: ["$thisWeekStartDateTime", "$thisWeekEndDateTime"],
  },
  thisMonth: {
    date: ["$thisMonthStartDate", "$thisMonthEndDate"],
    datetime: ["$thisMonthStartDateTime", "$thisMonthEndDateTime"],
  },
} as const;

type RelativeDatePeriod = keyof typeof RELATIVE_DATE_TOKENS;
type RelativeDateBoundary = "start" | "end";

type RelativeDateTokenDefinition = {
  period: RelativeDatePeriod;
  fieldType: RelativeDateFieldType;
  boundary: RelativeDateBoundary;
};

const TOKEN_DEFINITIONS = new Map<string, RelativeDateTokenDefinition>();

for (const [period, fieldTypes] of Object.entries(RELATIVE_DATE_TOKENS)) {
  for (const [fieldType, tokens] of Object.entries(fieldTypes)) {
    TOKEN_DEFINITIONS.set(tokens[0], {
      period: period as RelativeDatePeriod,
      fieldType: fieldType as RelativeDateFieldType,
      boundary: "start",
    });
    TOKEN_DEFINITIONS.set(tokens[1], {
      period: period as RelativeDatePeriod,
      fieldType: fieldType as RelativeDateFieldType,
      boundary: "end",
    });
  }
}

const padDatePart = (value: number) => String(value).padStart(2, "0");

const formatLocalDate = (value: Date) =>
  `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`;

const getRelativeDateBounds = (period: RelativeDatePeriod, now: Date) => {
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === "thisMonth") {
    return {
      start: new Date(year, month, 1, 0, 0, 0, 0),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
    };
  }

  const mondayOffset = (now.getDay() + 6) % 7;
  const start = new Date(year, month, now.getDate() - mondayOffset, 0, 0, 0, 0);
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59,
    999,
  );

  return { start, end };
};

export const getRelativeDateBetweenTokens = (
  matchMode: unknown,
  fieldType: RelativeDateFieldType,
): [string, string] | null => {
  const period = matchMode === RelativeDateMatchMode.THIS_WEEK
    ? "thisWeek"
    : matchMode === RelativeDateMatchMode.THIS_MONTH
      ? "thisMonth"
      : null;

  if (!period) return null;
  return [...RELATIVE_DATE_TOKENS[period][fieldType]];
};

export const getRelativeDateMatchModeFromBetween = (
  value: unknown,
): RelativeDateMatchModeValue | null => {
  if (!Array.isArray(value) || value.length !== 2) return null;

  for (const [period, fieldTypes] of Object.entries(RELATIVE_DATE_TOKENS)) {
    for (const tokens of Object.values(fieldTypes)) {
      if (value[0] === tokens[0] && value[1] === tokens[1]) {
        return period === "thisWeek"
          ? RelativeDateMatchMode.THIS_WEEK
          : RelativeDateMatchMode.THIS_MONTH;
      }
    }
  }

  return null;
};

export const isRelativeDateRuntimeToken = (value: unknown): boolean =>
  typeof value === "string" && TOKEN_DEFINITIONS.has(value);

export const isRelativeDateRuntimeVariableName = (name: string) =>
  isRelativeDateRuntimeToken(`$${name}`);

export const resolveRelativeDateRuntimeToken = (
  value: unknown,
  now: Date = new Date(),
): unknown => {
  if (typeof value !== "string" || !isRelativeDateRuntimeToken(value)) return value;

  const definition = TOKEN_DEFINITIONS.get(value)!;
  const bounds = getRelativeDateBounds(definition.period, now);
  const boundary = bounds[definition.boundary];

  return definition.fieldType === "date"
    ? formatLocalDate(boundary)
    : boundary.toISOString();
};

export const resolveRelativeDateRuntimeValues = (
  value: unknown,
  now: Date = new Date(),
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveRelativeDateRuntimeValues(item, now));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        resolveRelativeDateRuntimeValues(nestedValue, now),
      ]),
    );
  }

  return resolveRelativeDateRuntimeToken(value, now);
};
