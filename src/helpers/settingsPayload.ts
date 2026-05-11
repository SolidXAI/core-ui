export type SettingsOptionValue = string | number | boolean;

export type SettingsControlType =
  | "shortText"
  | "longText"
  | "numeric"
  | "boolean"
  | "date"
  | "datetime"
  | "mediaSingle"
  | "selectionStatic";

export type SettingsLevel =
  | "system-env"
  | "system-admin-readonly"
  | "system-admin-editable"
  | "internal-user";

export type SettingsOption = {
  label: string;
  value: SettingsOptionValue;
};

export type AdminSettingDefinition = {
  moduleName: string;
  key: string;
  value: any;
  level: SettingsLevel;
  encrypted?: boolean;
  label?: string;
  description?: string;
  placeholder?: string;
  group?: string;
  sortOrder?: number;
  controlType?: SettingsControlType;
  options?: SettingsOption[];
  editable?: boolean;
};

export type AdminSettingsResponse = {
  data?: AdminSettingDefinition[] | Record<string, any>;
};

function unwrapSettingsContainer(payload: any): any {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (
    payload?.data &&
    typeof payload.data === "object" &&
    (Array.isArray(payload.data.data) || (payload.data.data && typeof payload.data.data === "object"))
  ) {
    return unwrapSettingsContainer(payload.data);
  }

  return payload;
}

export function extractSettingsList(payload: any): AdminSettingDefinition[] {
  const normalizedPayload = unwrapSettingsContainer(payload);

  if (Array.isArray(normalizedPayload?.data)) {
    return normalizedPayload.data;
  }

  if (Array.isArray(normalizedPayload)) {
    return normalizedPayload;
  }

  return [];
}

export function getSettingsMap(payload: any): Record<string, any> {
  const normalizedPayload = unwrapSettingsContainer(payload);

  if (
    normalizedPayload?.data &&
    !Array.isArray(normalizedPayload.data) &&
    typeof normalizedPayload.data === "object" &&
    !Array.isArray(normalizedPayload.data?.data)
  ) {
    return normalizedPayload.data;
  }

  const list = extractSettingsList(normalizedPayload);
  if (!list.length) {
    return {};
  }

  return Object.fromEntries(list.map((setting) => [setting.key, setting.value]));
}

export function toLegacySettingsShape(payload: any) {
  return {
    ...payload,
    data: getSettingsMap(payload),
  };
}

export function humanizeSettingToken(value?: string) {
  if (!value) return "";

  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getSettingOptionLabel(setting: AdminSettingDefinition, value: any) {
  const option = setting.options?.find((item) => item.value === value);
  return option?.label ?? String(value ?? "");
}
