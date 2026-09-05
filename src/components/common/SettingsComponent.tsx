import { useEffect, useMemo, useState, type ComponentType } from "react";
import { CircleHelp, Search } from "lucide-react";
import { useDispatch } from "react-redux";
import { ERROR_MESSAGES } from "../../constants/error-messages";
import { normalizeAssetUrl } from "../../helpers/assetUrl";
import { getExtensionComponent } from "../../helpers/registry";
import {
  extractSettingsList,
  getSettingOptionLabel,
  getSettingsMap,
  humanizeSettingToken,
  type AdminSettingDefinition,
} from "../../helpers/settingsPayload";
import type { SolidSettingsWidgetProps } from "../../types/solid-core";
import { showToast } from "../../redux/features/toastSlice";
import {
  useBulkUpdateSolidSettingsMutation,
  useGetSolidSettingsQuery,
} from "../../redux/api/solidSettingsApi";
import {
  SolidButton,
  SolidDatePicker,
  SolidInput,
  SolidSelect,
  SolidSwitch,
  SolidTabGroup,
  SolidTag,
  SolidTextarea,
  SolidTooltip,
  SolidTooltipContent,
  SolidTooltipTrigger,
} from "../shad-cn-ui";
import { SettingDropzoneActivePlaceholder } from "./SolidSettings/SettingDropzoneActivePlaceholder";
import { SettingsImageRemoveButton } from "./SolidSettings/SettingsImageRemoveButton";
import { SolidUploadedImage } from "./SolidSettings/SolidUploadedImage";
import "./settings-component.css";

type SettingsFormValue = string | number | boolean | null | File;
type SettingsFilterMode = "all" | "read-only" | "editable";

function toModuleInitials(moduleName: string) {
  return moduleName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((token) => token[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

function serializeValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function areValuesEqual(left: unknown, right: unknown) {
  if (left instanceof File || right instanceof File) return false;
  return serializeValue(left) === serializeValue(right);
}

function formatReadonlyValue(setting: AdminSettingDefinition, value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (setting.controlType === "boolean") {
    return value ? "Enabled" : "Disabled";
  }

  if (setting.controlType === "selectionStatic") {
    return getSettingOptionLabel(setting, value);
  }

  if (setting.controlType === "mediaSingle") {
    return String(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function getSettingsWidgetName(setting: AdminSettingDefinition) {
  return setting.settingsWidget || "";
}

function getCustomWidgetErrorText(setting: AdminSettingDefinition, widgetName: string, settingsWidget: ComponentType<any> | null) {
  if (setting.controlType !== "custom") return null;
  if (!widgetName) {
    return `controlType is "custom" for setting "${setting.key}" but no settingsWidget is specified.`;
  }
  if (!settingsWidget) {
    return `Widget "${widgetName}" is not registered for setting "${setting.key}".`;
  }
  return null;
}

export function SettingsComponent() {
  const dispatch = useDispatch();
  const { data: settingsResponse, refetch } = useGetSolidSettingsQuery(undefined);
  const [bulkUpdateSolidSettings] = useBulkUpdateSolidSettingsMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<SettingsFilterMode>("all");
  const [activeModule, setActiveModule] = useState("");
  const [formValues, setFormValues] = useState<Record<string, SettingsFormValue>>({});
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  const settingsList = useMemo(
    () => extractSettingsList(settingsResponse).filter((setting) => setting.level !== "internal-user"),
    [settingsResponse],
  );
  const settingsMap = useMemo(() => getSettingsMap(settingsResponse), [settingsResponse]);
  const totalSettingsCount = settingsList.length;
  const editableSettingsCount = useMemo(
    () => settingsList.filter((setting) => setting.editable).length,
    [settingsList],
  );

  useEffect(() => {
    if (!settingsList.length) return;
    const nextValues = Object.fromEntries(
      settingsList.map((setting) => [setting.key, settingsMap[setting.key] ?? setting.value ?? null]),
    );
    setFormValues(nextValues);
  }, [settingsList, settingsMap]);

  const filteredSettings = useMemo(() => {
    const scopedSettings = settingsList.filter((setting) => {
      if (filterMode === "read-only") return !setting.editable;
      if (filterMode === "editable") return setting.editable;
      return true;
    });
    const query = searchTerm.trim().toLowerCase();
    if (!query) return scopedSettings;

    return scopedSettings.filter((setting) => {
      const haystack = [
        setting.moduleName,
        setting.group,
        setting.key,
        setting.label,
        setting.description,
        setting.helpText,
        setting.options?.map((option) => `${option.label} ${option.value}`).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [filterMode, searchTerm, settingsList]);

  const moduleEntries = useMemo(() => {
    const grouped = new Map<string, AdminSettingDefinition[]>();
    filteredSettings.forEach((setting) => {
      const current = grouped.get(setting.moduleName) ?? [];
      current.push(setting);
      grouped.set(setting.moduleName, current);
    });

    return Array.from(grouped.entries()).map(([moduleName, moduleSettings]) => ({
      moduleName,
      label: humanizeSettingToken(moduleName),
      badge: toModuleInitials(moduleName) || "S",
      settings: moduleSettings,
    }));
  }, [filteredSettings]);

  useEffect(() => {
    if (!moduleEntries.length) {
      setActiveModule("");
      return;
    }

    if (!moduleEntries.some((entry) => entry.moduleName === activeModule)) {
      setActiveModule(moduleEntries[0].moduleName);
    }
  }, [activeModule, moduleEntries]);

  const hasChanges = useMemo(
    () =>
      settingsList.some(
        (setting) =>
          setting.editable &&
          !areValuesEqual(formValues[setting.key], settingsMap[setting.key] ?? setting.value ?? null),
      ),
    [formValues, settingsList, settingsMap],
  );

  const groupedModuleSettings = useMemo(() => {
    const currentModule = moduleEntries.find((entry) => entry.moduleName === activeModule);
    if (!currentModule) return [];

    const grouped = new Map<string, AdminSettingDefinition[]>();
    currentModule.settings.forEach((setting) => {
      const groupKey = setting.group || "general";
      const current = grouped.get(groupKey) ?? [];
      current.push(setting);
      grouped.set(groupKey, current);
    });

    return Array.from(grouped.entries()).map(([groupKey, groupSettings]) => ({
      key: groupKey,
      label: humanizeSettingToken(groupKey),
      settings: groupSettings.sort((left, right) => {
        const leftSort = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightSort = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftSort !== rightSort) return leftSort - rightSort;
        return (left.label ?? left.key).localeCompare(right.label ?? right.key);
      }),
    }));
  }, [activeModule, moduleEntries]);

  const updateValue = (key: string, value: SettingsFormValue) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const updateFileValue = (key: string, file: File | null) => {
    if (!file) {
      if (filePreviews[key]) {
        URL.revokeObjectURL(filePreviews[key]);
      }
      setFilePreviews((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      updateValue(key, null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      dispatch(showToast({ severity: "error", summary: "File too large", detail: "Maximum file size is 2MB" }));
      return;
    }

    if (filePreviews[key]) {
      URL.revokeObjectURL(filePreviews[key]);
    }

    const preview = URL.createObjectURL(file);
    setFilePreviews((current) => ({ ...current, [key]: preview }));
    updateValue(key, file);
  };

  useEffect(
    () => () => {
      Object.values(filePreviews).forEach((preview) => URL.revokeObjectURL(preview));
    },
    [filePreviews],
  );

  const handleSave = async () => {
    try {
      const updatedSettingsArray: Array<{ key: string; value: string; type: string }> = [];
      const formData = new FormData();

      settingsList.forEach((setting) => {
        if (!setting.editable) return;

        const nextValue = formValues[setting.key];
        const currentValue = settingsMap[setting.key] ?? setting.value ?? null;

        if (nextValue instanceof File) {
          formData.append(setting.key, nextValue);
          updatedSettingsArray.push({ key: setting.key, value: "", type: "system" });
          return;
        }

        if (!areValuesEqual(nextValue, currentValue)) {
          updatedSettingsArray.push({
            key: setting.key,
            value: serializeValue(nextValue),
            type: "system",
          });
        }
      });

      if (!updatedSettingsArray.length) {
        dispatch(showToast({ severity: "success", summary: "No Changes", detail: "No settings were updated" }));
        return;
      }

      formData.append("settings", JSON.stringify(updatedSettingsArray));
      const response = await bulkUpdateSolidSettings({ data: formData }).unwrap();

      if (response?.statusCode === 200) {
        dispatch(showToast({ severity: "success", summary: "Updated", detail: "Settings updated" }));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("solid:settings-updated"));
        }
      } else {
        dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FAILED, detail: ERROR_MESSAGES.SOMETHING_WRONG }));
      }

      await refetch();
      setFilePreviews({});
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FAILED, detail: error?.data?.message || ERROR_MESSAGES.SOMETHING_WRONG }));
    }
  };

  const moduleTabs = moduleEntries.map((entry) => ({
    value: entry.moduleName,
    label: (
      <span className={"solid-settings-module-tab"}>
        <span className={"solid-settings-module-tab-badge"}>{entry.badge}</span>
        <span className={"solid-settings-module-tab-text"}>
          <span className={"solid-settings-module-tab-label"}>{entry.label}</span>
          <span className={"solid-settings-module-tab-meta"}>{entry.settings.length} settings</span>
        </span>
      </span>
    ),
    content: (
      <div>
        {groupedModuleSettings.length ? (
          groupedModuleSettings.map((group) => (
            <section key={group.key} className={"solid-settings-group-section"}>
              <div className={"solid-settings-group-card"}>
                <div className={"solid-settings-group-header"}>
                  <div>
                    <h3 className={"solid-settings-group-title"}>{group.label}</h3>
                    <div className={"solid-settings-group-meta"}>{group.settings.length} item{group.settings.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <div className={"solid-settings-group-body"}>
                  {group.settings.map((setting) => {
                    const value = formValues[setting.key];
                    const settingName = setting.label || humanizeSettingToken(setting.key);
                    const settingHelpText = setting.helpText?.trim() || "";
                    const settingsWidgetName = getSettingsWidgetName(setting);
                    const SettingsWidget = settingsWidgetName ? getExtensionComponent(settingsWidgetName) : null;
                    const customWidgetErrorText = getCustomWidgetErrorText(setting, settingsWidgetName, SettingsWidget);
                    const settingsWidgetProps: SolidSettingsWidgetProps = {
                      setting,
                      value,
                      settingsMap,
                      formValues,
                      editable: Boolean(setting.editable),
                      updateValue,
                      updateFileValue,
                    };
                    return (
                      <div key={setting.key} className={"solid-settings-setting-row"}>
                        <div className={"solid-settings-setting-label-wrap"}>
                          <div className={"solid-settings-setting-label-line"}>
                            <p className={"solid-settings-setting-label"}>{settingName}</p>
                            {settingHelpText ? (
                              <SolidTooltip>
                                <SolidTooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={"solid-settings-setting-help-button"}
                                    aria-label={`Show help for ${settingName}`}
                                  >
                                    <CircleHelp size={14} aria-hidden />
                                  </button>
                                </SolidTooltipTrigger>
                                <SolidTooltipContent align="start" className={"solid-settings-setting-help-tooltip"}>
                                  {settingHelpText}
                                </SolidTooltipContent>
                              </SolidTooltip>
                            ) : null}
                            {!setting.editable ? (
                              <SolidTooltip>
                                <SolidTooltipTrigger asChild>
                                  <span>
                                    <SolidTag tone="warn">Read only</SolidTag>
                                  </span>
                                </SolidTooltipTrigger>
                                <SolidTooltipContent>
                                  This value comes from system configuration and cannot be changed from the admin UI.
                                </SolidTooltipContent>
                              </SolidTooltip>
                            ) : null}
                          </div>
                          {setting.description ? <p className={"solid-settings-setting-description"}>{setting.description}</p> : null}
                        </div>

                        {!setting.editable ? (
                          setting.controlType === "custom" ? (
                            customWidgetErrorText ? (
                              <div className={"solid-settings-readonly-value"}>
                                <span className={"solid-settings-custom-widget-error"}>{customWidgetErrorText}</span>
                              </div>
                            ) : SettingsWidget ? (
                              (() => {
                                const ResolvedSettingsWidget = SettingsWidget as ComponentType<any>;
                                return <ResolvedSettingsWidget {...settingsWidgetProps} />;
                              })()
                            ) : null
                          ) : setting.controlType === "mediaSingle" && value ? (
                            <div className={"solid-settings-media-preview"}>
                              <SolidUploadedImage src={normalizeAssetUrl(String(value))} />
                            </div>
                          ) : (
                            <div className={"solid-settings-readonly-value"}>
                              <span className={value === null || value === undefined || value === "" ? "solid-settings-empty-value" : undefined}>
                                {formatReadonlyValue(setting, value)}
                              </span>
                            </div>
                          )
                        ) : (
                          <div className={`${"solid-settings-control-stack"} ${setting.controlType === "custom" ? "solid-settings-custom-control-stack" : ""}`}>
                            {setting.controlType === "boolean" ? (
                              <div className={"solid-settings-bool-row"}>
                                <SolidSwitch checked={Boolean(value)} onChange={(checked) => updateValue(setting.key, checked)} />
                                <span className={"solid-settings-bool-text"}>{value ? "Enabled" : "Disabled"}</span>
                              </div>
                            ) : null}

                            {setting.controlType === "shortText" ? (
                              <SolidInput
                                type="text"
                                value={value == null ? "" : String(value)}
                                placeholder={setting.placeholder || setting.label}
                                onChange={(event: any) => updateValue(setting.key, event.target.value)}
                              />
                            ) : null}

                            {setting.controlType === "longText" ? (
                              <SolidTextarea
                                rows={4}
                                value={value == null ? "" : typeof value === "string" ? value : JSON.stringify(value, null, 2)}
                                placeholder={setting.placeholder || setting.label}
                                onChange={(event: any) => updateValue(setting.key, event.target.value)}
                              />
                            ) : null}

                            {setting.controlType === "numeric" ? (
                              <SolidInput
                                type="number"
                                value={value == null ? "" : String(value)}
                                placeholder={setting.placeholder || setting.label}
                                onChange={(event: any) => updateValue(setting.key, event.target.value === "" ? null : Number(event.target.value))}
                              />
                            ) : null}

                            {setting.controlType === "selectionStatic" ? (
                              <SolidSelect
                                value={value}
                                options={setting.options || []}
                                placeholder={setting.placeholder || "Select"}
                                native={false}
                                onChange={(event) => updateValue(setting.key, event.value)}
                              />
                            ) : null}

                            {setting.controlType === "date" || setting.controlType === "datetime" ? (
                              <SolidDatePicker
                                selected={value ? new Date(String(value)) : null}
                                showTimeSelect={setting.controlType === "datetime"}
                                dateFormat={setting.controlType === "datetime" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd"}
                                onChange={(date: Date | null) => updateValue(setting.key, date instanceof Date ? date.toISOString() : null)}
                              />
                            ) : null}

                            {setting.controlType === "mediaSingle" ? (
                              <div className={"solid-settings-media-field"}>
                                <div className={"solid-settings-media-composer"}>
                                  <label className={"solid-settings-media-dropzone"}>
                                    <input
                                      className={"solid-settings-media-input"}
                                      type="file"
                                      accept=".png,.jpg,.jpeg,.svg,.webp"
                                      onChange={(event) => updateFileValue(setting.key, event.target.files?.[0] ?? null)}
                                    />
                                    <SettingDropzoneActivePlaceholder note="PNG, JPG, JPEG, SVG, WEBP | Max size: 2 MB" />
                                  </label>
                                  {(filePreviews[setting.key] || value) ? (
                                    <div className={"solid-settings-media-preview"}>
                                      <SolidUploadedImage src={filePreviews[setting.key] || normalizeAssetUrl(String(value))} />
                                    </div>
                                  ) : (
                                    <div className={"solid-settings-media-empty-state"}>Preview appears here after upload</div>
                                  )}
                                </div>
                                {(filePreviews[setting.key] || value) ? (
                                  <SettingsImageRemoveButton onClick={() => updateFileValue(setting.key, null)} />
                                ) : null}
                              </div>
                            ) : null}

                            {setting.controlType === "custom" ? (
                              customWidgetErrorText ? (
                                <div className={"solid-settings-readonly-value"}>
                                  <span className={"solid-settings-custom-widget-error"}>{customWidgetErrorText}</span>
                                </div>
                              ) : SettingsWidget ? (
                                (() => {
                                  const ResolvedSettingsWidget = SettingsWidget as ComponentType<any>;
                                  return <ResolvedSettingsWidget {...settingsWidgetProps} />;
                                })()
                              ) : null
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))
        ) : (
          <div className={"solid-settings-empty-state"}>No settings match the current filter.</div>
        )}
      </div>
    ),
  }));

  return (
    <div className={"solid-settings-page"}>
      <div className="solid-settings-page-header">
        <div className={"solid-settings-header-intro"}>
          <div className="form-wrapper-title">Settings</div>
          <div className={"solid-settings-subtitle"}>Manage platform configuration across modules from a single workspace.</div>
          <div className={"solid-settings-summary-chips"}>
            <span className={"solid-settings-summary-chip"}>{moduleEntries.length} module{moduleEntries.length === 1 ? "" : "s"}</span>
            <span className={"solid-settings-summary-chip"}>{totalSettingsCount} setting{totalSettingsCount === 1 ? "" : "s"}</span>
            <button
              type="button"
              className={`${"solid-settings-summary-chip"} ${"solid-settings-summary-chip-button"} ${filterMode === "editable" ? "solid-settings-summary-chip-active" : ""}`}
              aria-pressed={filterMode === "editable"}
              onClick={() => setFilterMode((current) => (current === "editable" ? "all" : "editable"))}
            >
              {editableSettingsCount} editable
            </button>
          </div>
        </div>
        <div className={"solid-settings-header-search"}>
          <div className={"solid-settings-search-icon"}>
            <Search size={16} />
            <SolidInput
              className={"solid-settings-search-input"}
              value={searchTerm}
              placeholder="Search settings, groups, or modules"
              onChange={(event: any) => setSearchTerm(event.target.value)}
            />
          </div>
          {searchTerm ? (
            <span className={"solid-settings-results-meta"}>
              {filteredSettings.length} result{filteredSettings.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <div className={"solid-settings-toolbar-actions"}>
          <div className={"solid-settings-legend"}>
            <button
              type="button"
              className={`${"solid-settings-readonly-filter-button"} ${filterMode === "read-only" ? "solid-settings-readonly-filter-button-active" : ""}`}
              aria-pressed={filterMode === "read-only"}
              aria-label={filterMode === "read-only" ? "Disable read-only filter" : "Enable read-only filter"}
              onClick={() => setFilterMode((current) => (current === "read-only" ? "all" : "read-only"))}
            >
              <SolidTag tone="warn">Read only</SolidTag>
            </button>
            <span className={filterMode === "read-only" ? "solid-settings-legend-label-active" : undefined}>
              {filterMode === "read-only" ? "Read-only filter active" : "System-managed value"}
            </span>
            <SolidTooltip>
              <SolidTooltipTrigger asChild>
                <button type="button" className={"solid-settings-legend-button"} aria-label="Read-only solid-settings-legend details">
                  i
                </button>
              </SolidTooltipTrigger>
              <SolidTooltipContent>
                Read-only settings are visible here for context, but can only be changed through environment or backend configuration.
              </SolidTooltipContent>
            </SolidTooltip>
          </div>
          <SolidButton size="sm" type="button" loading={false} onClick={handleSave} disabled={!hasChanges}>
            Save
          </SolidButton>
        </div>
      </div>

      <div className={"solid-settings-workspace"}>
        {moduleTabs.length ? (
          <SolidTabGroup
            tabs={moduleTabs}
            value={activeModule}
            onValueChange={setActiveModule}
            className={"solid-settings-tab-group"}
            listClassName={"solid-settings-tab-list"}
            panelClassName={"solid-settings-tab-panel"}
            orientation="vertical"
          />
        ) : (
          <div className={"solid-settings-empty-state"}>No settings are available.</div>
        )}
      </div>
    </div>
  );
}
