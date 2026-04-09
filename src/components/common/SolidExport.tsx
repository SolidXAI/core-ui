import React, { useEffect, useMemo, useState } from "react";
import { Check, Download, FileSpreadsheet, FileText, Plus, Save, Trash2 } from "lucide-react";
import "./solid-export.css";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/features/toastSlice";
import {
  useCreateExportTemplateMutation,
  useDeleteExportTemplateMutation,
  useGetExportTemplatesQuery,
} from "../../redux/api/exportTemplateApi";
import { downloadFileWithProgress } from "../../helpers/downloadFileWithProgress";
import { DownloadProgressToast } from "./DownloadProgressToast";
import { ERROR_MESSAGES } from "../../constants/error-messages";
import {
  SolidButton,
  SolidCheckbox,
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogDescription,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidInput,
  SolidSelect,
} from "../shad-cn-ui";

interface FieldMetadata {
  displayName: string;
  type: string;
}

interface FilterColumn {
  name: string;
  key: string;
}

interface TemplateOption {
  name: string;
  code: string;
  fields: string[] | string;
  templateFormat: string;
}

interface FormatOption {
  name: string;
  code: string;
}

const EXCLUDED_TYPES = new Set(["mediaSingle", "mediaMultiple"]);
const FORMAT_OPTIONS: FormatOption[] = [
  { name: "CSV", code: "csv" },
  { name: "Excel", code: "excel" },
];

function parseTemplateFields(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(ERROR_MESSAGES.PARSED_FIELD, error);
    return [];
  }
}

function exportFormatMeta(code?: string) {
  if (code === "excel") {
    return {
      label: "Excel",
      icon: <FileSpreadsheet size={14} />,
    };
  }

  return {
    label: "CSV",
    icon: <FileText size={14} />,
  };
}

export const SolidExport = ({ listViewMetaData, filters }: any) => {
  const dispatch = useDispatch();

  if (!listViewMetaData?.data) return null;

  const solidView = listViewMetaData.data.solidView;
  const solidFieldsMetadata = listViewMetaData.data.solidFieldsMetadata as Record<string, FieldMetadata>;
  if (!solidView || !solidFieldsMetadata) return null;

  const layoutChildren = Array.isArray(solidView?.layout?.children) ? solidView.layout.children : [];
  const checkedFieldNames = useMemo(
    () =>
      new Set(
        layoutChildren
          .map((col: { attrs?: { name?: string } }) => col?.attrs?.name)
          .filter(Boolean)
      ),
    [layoutChildren]
  );

  const allColumns = useMemo<FilterColumn[]>(
    () =>
      Object.entries(solidFieldsMetadata)
        .filter(([, field]) => !EXCLUDED_TYPES.has(field.type))
        .map(([key, field]) => ({
          name: field.displayName,
          key,
        })),
    [solidFieldsMetadata]
  );

  const defaultSelectedColumns = useMemo(
    () => allColumns.filter((col) => checkedFieldNames.has(col.key)),
    [allColumns, checkedFieldNames]
  );

  const [selectedColumns, setSelectedColumns] = useState<FilterColumn[]>(defaultSelectedColumns);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>(FORMAT_OPTIONS[0]);
  const [isSaveDialogVisible, setIsSaveDialogVisible] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [message, setMessage] = useState("");
  const [messageDescription, setMessageDescription] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [checkApplyFilter, setCheckedApplyFilter] = useState(false);

  const [createExportTemplate, { isLoading: isSavingTemplate }] = useCreateExportTemplateMutation();
  const [deleteExportTemplate, { isLoading: isDeletingTemplate }] = useDeleteExportTemplateMutation();
  const { data: templatesData } = useGetExportTemplatesQuery({});

  const templateOptions = useMemo<TemplateOption[]>(() => {
    const records = templatesData?.records ?? [];
    return records.map((template: any) => ({
      name: template.templateName,
      code: String(template.id),
      fields: template.fields,
      templateFormat: template.templateFormat,
    }));
  }, [templatesData]);

  const resolvedTemplateOptions = useMemo(() => {
    if (!selectedTemplate) return templateOptions;
    if (templateOptions.some((template) => template.code === selectedTemplate.code)) return templateOptions;
    return [selectedTemplate, ...templateOptions];
  }, [selectedTemplate, templateOptions]);

  useEffect(() => {
    setSelectedColumns(defaultSelectedColumns);
  }, [defaultSelectedColumns]);

  const selectedKeys = new Set(selectedColumns.map((item) => item.key));
  const availableColumns = allColumns.filter((col) => !selectedKeys.has(col.key));

  const moveToSelected = (col: FilterColumn) => {
    setSelectedColumns((current) => (current.some((item) => item.key === col.key) ? current : [...current, col]));
  };

  const moveToAvailable = (col: FilterColumn) => {
    setSelectedColumns((current) => current.filter((item) => item.key !== col.key));
  };

  const handleTemplateSelect = (templateCode?: string) => {
    const nextTemplate = templateOptions.find((option) => option.code === templateCode) ?? null;
    setSelectedTemplate(nextTemplate);

    if (!nextTemplate) {
      setSelectedColumns(defaultSelectedColumns);
      setSelectedFormat(FORMAT_OPTIONS[0]);
      return;
    }

    const fields = parseTemplateFields(nextTemplate.fields);
    const resolvedColumns = fields
      .map((field) => allColumns.find((column) => column.key === field))
      .filter(Boolean) as FilterColumn[];

    setSelectedColumns(resolvedColumns);
    setSelectedFormat(
      FORMAT_OPTIONS.find((option) => option.code === nextTemplate.templateFormat) ?? FORMAT_OPTIONS[0]
    );
  };

  const handleAddTemplate = async () => {
    const trimmedName = newTemplateName.trim();
    if (!trimmedName) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.TEMPLATE_FAILED, detail: ERROR_MESSAGES.TEMPLATE_FAILED }));
      return;
    }

    const exportData = {
      templateName: trimmedName,
      templateFormat: selectedFormat.code,
      notifyOnEmail: true,
      fields: JSON.stringify(selectedColumns.map((col) => col.key)),
      modelMetadataId: solidView?.model?.id,
    };

    try {
      const response = await createExportTemplate(exportData).unwrap();
      setSelectedTemplate({
        name: trimmedName,
        code: String(response.data.id),
        fields: selectedColumns.map((col) => col.key),
        templateFormat: selectedFormat.code,
      });
      setNewTemplateName("");
      setIsSaveDialogVisible(false);
      dispatch(showToast({ severity: "success", summary: "Template Added", detail: "Template Saved" }));
    } catch (error) {
      console.error(ERROR_MESSAGES.TEMPLATE_FAILED, error);
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.TEMPLATE_FAILED, detail: ERROR_MESSAGES.TEMPLATE_FAILED }));
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate?.code) return;
    try {
      await deleteExportTemplate(selectedTemplate.code).unwrap();
      setSelectedTemplate(null);
      dispatch(showToast({ severity: "success", summary: "Template Deleted", detail: "Template Deleted" }));
    } catch (error) {
      console.error(ERROR_MESSAGES.TEMPLATE_FAILED, error);
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.TEMPLATE_FAILED, detail: ERROR_MESSAGES.TEMPLATE_FAILED }));
    }
  };

  const downloadHandlers = {
    onProgress: (value: number) => {
      setProgress(value);
    },
    onStatusChange: (statusType: "In Progress" | "success" | "error", msg: string, submsg: string) => {
      setStatus(statusType);
      setMessage(msg);
      setMessageDescription(submsg);
      setShowProgress(true);
    },
  };

  const handleDownload = async () => {
    const exportData = {
      id: selectedTemplate?.code ?? null,
      templateName: selectedTemplate?.name ?? null,
      templateFormat: selectedFormat.code,
      notifyOnEmail: true,
      fields: JSON.stringify(selectedColumns.map((col) => col.key)),
      modelMetadataId: solidView?.model?.id,
    };

    try {
      await downloadFileWithProgress(
        `/export-template/startExport/sync`,
        downloadHandlers,
        filters,
        checkApplyFilter,
        exportData
      );
    } catch (error) {
      console.error(ERROR_MESSAGES.DOWNLOAD_FAILED, error);
    }
  };

  const selectedTemplateFieldsCount = selectedColumns.length;
  const selectedFormatMeta = exportFormatMeta(selectedFormat.code);
  const selectionSummary = selectedTemplate ? `Template: ${selectedTemplate.name}` : "Current field selection";
  const filterSummary = checkApplyFilter ? "Filters applied" : "All records";

  return (
    <>
      <div className="solid-export-shell">
        <div className="solid-export-toolbar">
          <div className="solid-export-toolbar-main">
            <label className="solid-export-field">
              <span className="solid-export-field-label">Format</span>
              <SolidSelect
                value={selectedFormat.code}
                options={FORMAT_OPTIONS.map((option) => ({ label: option.name, value: option.code }))}
                onChange={(event) => {
                  const next = FORMAT_OPTIONS.find((option) => option.code === event.value);
                  if (next) setSelectedFormat(next);
                }}
                placeholder="Select format"
              />
            </label>

            <label className="solid-export-field solid-export-field--template">
              <span className="solid-export-field-label">Template</span>
              <SolidSelect
                value={selectedTemplate?.code ?? ""}
                options={resolvedTemplateOptions.map((option) => ({ label: option.name, value: option.code }))}
                onChange={(event) => handleTemplateSelect(event.value)}
                placeholder={resolvedTemplateOptions.length ? "Choose template" : "No saved templates"}
              />
            </label>
          </div>

          <div className="solid-export-toolbar-side">
            <div className="solid-export-toolbar-options">
              <SolidCheckbox
                checked={checkApplyFilter}
                onChange={(event) => setCheckedApplyFilter(event.target.checked)}
                label="Apply Filters"
              />
            </div>
            <div className="solid-export-toolbar-actions">
              <SolidButton
                variant="outline"
                size="small"
                leftIcon={<Save size={14} />}
                onClick={() => setIsSaveDialogVisible(true)}
              >
                Save Template
              </SolidButton>
              <SolidButton
                variant="ghost"
                size="small"
                leftIcon={<Trash2 size={14} />}
                onClick={handleDeleteTemplate}
                disabled={!selectedTemplate || isDeletingTemplate}
              >
                Delete
              </SolidButton>
              <SolidButton
                size="small"
                leftIcon={<Download size={14} />}
                onClick={handleDownload}
                disabled={selectedColumns.length === 0}
              >
                Export
              </SolidButton>
            </div>
          </div>
        </div>

        <div className="solid-export-summary">
          <div className="solid-export-summary-card">
            <div className="solid-export-summary-title-row">
              <div className="solid-export-summary-format-icon">{selectedFormatMeta.icon}</div>
              <div className="solid-export-summary-copy-block">
                <div className="solid-export-summary-title">{selectedFormatMeta.label} export</div>
                <div className="solid-export-summary-meta">
                  <span className="solid-export-summary-copy">{selectionSummary}</span>
                  <span className="solid-export-summary-dot" aria-hidden="true" />
                  <span className="solid-export-summary-copy">{filterSummary}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="solid-export-summary-chip">
            <Check size={13} />
            {selectedTemplateFieldsCount} field{selectedTemplateFieldsCount === 1 ? "" : "s"} selected
          </div>
        </div>

        <div className="solid-export-builder">
          <div className="solid-export-pane">
            <div className="solid-export-pane-header">
              <div>
                <div className="solid-export-pane-title">Available Fields</div>
                <div className="solid-export-pane-copy">Add fields to include in the export.</div>
              </div>
              <div className="solid-export-pane-count">{availableColumns.length}</div>
            </div>
            <div className="solid-export-list">
              {availableColumns.length ? (
                availableColumns.map((item) => (
                  <div key={item.key} className="solid-export-list-row">
                    <div className="solid-export-list-row-copy">
                      <div className="solid-export-list-row-title">
                        {item.name}
                        <span className="solid-export-list-row-key">({item.key})</span>
                      </div>
                    </div>
                    <SolidButton
                      variant="ghost"
                      size="small"
                      className="solid-export-list-row-action"
                      leftIcon={<Plus size={14} />}
                      aria-label={`Add ${item.name}`}
                      tooltip={`Add ${item.name}`}
                      onClick={() => moveToSelected(item)}
                    />
                  </div>
                ))
              ) : (
                <div className="solid-export-empty">
                  <div className="solid-export-empty-title">All fields are already selected</div>
                  <div className="solid-export-empty-copy">Remove a field from the export set to make it available here again.</div>
                </div>
              )}
            </div>
          </div>

          <div className="solid-export-pane">
            <div className="solid-export-pane-header">
              <div>
                <div className="solid-export-pane-title">Selected Fields</div>
                <div className="solid-export-pane-copy">These columns will be exported in the file.</div>
              </div>
              <div className="solid-export-pane-count is-selected">{selectedColumns.length}</div>
            </div>
            <div className="solid-export-list">
              {selectedColumns.length ? (
                selectedColumns.map((item) => (
                  <div key={item.key} className="solid-export-list-row">
                    <div className="solid-export-list-row-copy">
                      <div className="solid-export-list-row-title">
                        {item.name}
                        <span className="solid-export-list-row-key">({item.key})</span>
                      </div>
                    </div>
                    <SolidButton
                      variant="ghost"
                      size="small"
                      className="solid-export-list-row-action is-remove"
                      leftIcon={<Trash2 size={14} />}
                      aria-label={`Remove ${item.name}`}
                      tooltip={`Remove ${item.name}`}
                      onClick={() => moveToAvailable(item)}
                    />
                  </div>
                ))
              ) : (
                <div className="solid-export-empty">
                  <div className="solid-export-empty-title">No fields selected yet</div>
                  <div className="solid-export-empty-copy">Pick at least one field before starting the export.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SolidDialog
        open={isSaveDialogVisible}
        onOpenChange={setIsSaveDialogVisible}
        className="solid-export-save-dialog"
        style={{ width: "min(420px, calc(100vw - 24px))" }}
      >
        <SolidDialogHeader className="solid-filter-dialog-head">
          <div>
            <SolidDialogTitle className="solid-filter-dialog-title m-0">Save Export Template</SolidDialogTitle>
            <SolidDialogDescription className="solid-filter-dialog-subtitle m-0">
              Save the current format and selected fields so this export can be reused later.
            </SolidDialogDescription>
          </div>
          <SolidDialogClose className="solid-filter-dialog-close" />
        </SolidDialogHeader>
        <SolidDialogSeparator className="solid-filter-dialog-sep" />
        <SolidDialogBody className="solid-filter-dialog-body">
          <label className="solid-export-field solid-export-save-field">
            <span className="solid-export-field-label">Template name</span>
            <SolidInput
              value={newTemplateName}
              onChange={(event) => setNewTemplateName(event.target.value)}
              placeholder="Enter template name"
              autoFocus
            />
          </label>
        </SolidDialogBody>
        <SolidDialogFooter className="solid-export-save-footer">
          <SolidButton
            type="button"
            size="small"
            variant="outline"
            onClick={() => {
              setNewTemplateName("");
              setIsSaveDialogVisible(false);
            }}
          >
            Cancel
          </SolidButton>
          <SolidButton
            type="button"
            size="small"
            loading={isSavingTemplate}
            disabled={!newTemplateName.trim() || isSavingTemplate}
            onClick={handleAddTemplate}
          >
            Save Template
          </SolidButton>
        </SolidDialogFooter>
      </SolidDialog>

      <DownloadProgressToast
        visible={showProgress}
        progress={progress}
        message={message}
        submessage={messageDescription}
        status={status}
        onClose={() => setShowProgress(false)}
      />
    </>
  );
};
