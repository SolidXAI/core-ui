const ACTIVE_USER_ID_TOKEN = "$activeUserId";
const VARIABLE_EXPRESSION = /^\$([A-Za-z_][A-Za-z0-9_]*)$/;

export const parseSavedFilterQueryJson = (value: any): any =>
  typeof value === "string" ? JSON.parse(value) : value;

export const getSavedFilterVariableNames = (value: any): string[] => {
  const names = new Set<string>();

  const visit = (current: any) => {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current && typeof current === "object") {
      Object.values(current).forEach(visit);
      return;
    }
    if (typeof current === "string") {
      const match = current.match(VARIABLE_EXPRESSION);
      if (match) names.add(match[1]);
    }
  };

  visit(value);
  return Array.from(names);
};

export const getUnboundSavedFilterVariableNames = (value: any): string[] =>
  getSavedFilterVariableNames(value).filter((name) => name !== "activeUserId");

export const resolveSavedFilterVariables = (
  value: any,
  activeUserId: number | string | null | undefined,
  variables: Record<string, any> = {}
): { value: any; missingVariables: string[] } => {
  const missing = new Set<string>();

  const resolve = (current: any): any => {
    if (Array.isArray(current)) return current.map(resolve);
    if (current && typeof current === "object") {
      return Object.fromEntries(Object.entries(current).map(([key, nestedValue]) => [key, resolve(nestedValue)]));
    }
    if (typeof current !== "string") return current;

    const exactMatch = current.match(VARIABLE_EXPRESSION);
    if (exactMatch) {
      const name = exactMatch[1];
      if (name === "activeUserId" && activeUserId !== null && activeUserId !== undefined) return activeUserId;
      if (Object.prototype.hasOwnProperty.call(variables, name)) return variables[name];
      missing.add(name);
      return current;
    }

    return current.includes("$activeUserId")
      ? current.split("$activeUserId").join(String(activeUserId ?? "$activeUserId"))
      : current;
  };

  const resolved = resolve(value);
  return { value: resolved, missingVariables: Array.from(missing) };
};

/**
 * Resolves the saved-filter runtime token without mutating the stored filter.
 * Exact token values keep the user's id type; embedded tokens remain strings.
 */
export const resolveActiveUserId = (value: any, activeUserId: number | string | null | undefined): any => {
  if (activeUserId === null || activeUserId === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => resolveActiveUserId(item, activeUserId));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        resolveActiveUserId(nestedValue, activeUserId),
      ])
    );
  }

  if (value === ACTIVE_USER_ID_TOKEN) return activeUserId;
  if (typeof value === "string" && value.includes(ACTIVE_USER_ID_TOKEN)) {
    return value.split(ACTIVE_USER_ID_TOKEN).join(String(activeUserId));
  }

  return value;
};
