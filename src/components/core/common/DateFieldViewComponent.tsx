

import dayjs from "dayjs";

type DateFieldViewProps = {
  value: unknown;
  format?: string; // dayjs format tokens (optional)
  fallback?: string; // optional fallback text (default: "-")
  showTime?: boolean; // include time in default locale formatting
};

export const DateFieldViewComponent = ({
  value,
  format,
  fallback = "-",
  showTime = false,
}: DateFieldViewProps) => {
  if (!value) {
    return <>{fallback}</>;
  }

  // Normalize value to Date
  const date =
    value instanceof Date ? value : new Date(value as any);

  // Invalid date → render raw value
  if (isNaN(date.getTime())) {
    return <>{String(value)}</>;
  }

  // Explicit format → dayjs
  if (format) {
    return <>{dayjs(date).format(format)}</>;
  }

  // Default → browser locale
  return <>{showTime ? date.toLocaleString() : date.toLocaleDateString()}</>;
};
