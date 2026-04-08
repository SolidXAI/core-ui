export const parseDateTime = (value?: string | Date) =>
  value ? new Date(value) : null;
