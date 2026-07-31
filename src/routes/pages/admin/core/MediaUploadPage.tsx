import { DragEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import qs from "qs";
import { FileUp, Upload } from "lucide-react";
import { useDispatch } from "react-redux";
import { SolidButton, SolidInput, SolidSelect } from "../../../../components/shad-cn-ui";
import { useLazyGetfieldsQuery } from "../../../../redux/api/fieldApi";
import { useLazyGetModelsQuery } from "../../../../redux/api/modelApi";
import { useLazyGetmodulesQuery } from "../../../../redux/api/moduleApi";
import { useUploadMediaMutation } from "../../../../redux/api/mediaApi";
import { showToast } from "../../../../redux/features/toastSlice";
import { useRouter } from "../../../../hooks/useRouter";

const MEDIA_ACCEPT_MAP: Record<string, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  pdf: "application/pdf",
};

const getDisplayName = (record: any, fallback = "Unassigned") => {
  if (typeof record === "string" || typeof record === "number") {
    return String(record);
  }
  return record?.displayName || record?.name || record?.singularName || record?.moduleUserKey || (record?.id ? `#${record.id}` : fallback);
};

const buildQuery = (query: Record<string, any>) =>
  qs.stringify(query, { encodeValuesOnly: true });

const getErrorMessage = (error: any) => {
  const message = error?.data?.message || error?.data?.error || error?.message;
  return Array.isArray(message) ? message.join(", ") : message || "Something went wrong";
};

const getFieldAccept = (field: any) => {
  const mediaTypes = Array.isArray(field?.mediaTypes) ? field.mediaTypes : [];
  const accept = mediaTypes
    .map((type: string) => MEDIA_ACCEPT_MAP[type])
    .filter(Boolean);

  return accept.length > 0 ? accept.join(",") : undefined;
};

export function MediaUploadPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | "">("");
  const [selectedModelId, setSelectedModelId] = useState<number | "">("");
  const [selectedFieldId, setSelectedFieldId] = useState<number | "">("");
  const [entityId, setEntityId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [getModules, { data: modulesData, isFetching: modulesLoading }] = useLazyGetmodulesQuery();
  const [getModels, { data: modelsData, isFetching: modelsLoading }] = useLazyGetModelsQuery();
  const [getFields, { data: fieldsData, isFetching: fieldsLoading }] = useLazyGetfieldsQuery();
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();

  useEffect(() => {
    getModules("offset=0&limit=1000&sort[0]=displayName%3Aasc");
  }, [getModules]);

  useEffect(() => {
    if (!selectedModuleId) {
      return;
    }

    const query = buildQuery({
      offset: 0,
      limit: 1000,
      filters: {
        $and: [
          {
            module: {
              id: { $eq: selectedModuleId },
            },
          },
        ],
      },
      sort: ["displayName:asc"],
    });
    getModels(`${query}&populate[0]=module`);
    setSelectedModelId("");
    setSelectedFieldId("");
    setEntityId("");
    setFiles([]);
  }, [selectedModuleId, getModels]);

  useEffect(() => {
    if (!selectedModelId) {
      return;
    }

    const query = buildQuery({
      offset: 0,
      limit: 1000,
      filters: {
        $and: [
          {
            model: {
              id: { $eq: selectedModelId },
            },
          },
          {
            $or: [
              { type: { $eq: "mediaSingle" } },
              { type: { $eq: "mediaMultiple" } },
            ],
          },
        ],
      },
      sort: ["displayName:asc"],
    });
    getFields(`${query}&populate[1]=mediaStorageProvider`);
    setSelectedFieldId("");
    setFiles([]);
  }, [selectedModelId, getFields]);

  const moduleOptions = useMemo(
    () => (modulesData?.records || []).map((module: any) => ({ label: getDisplayName(module), value: module.id })),
    [modulesData]
  );

  const modelOptions = useMemo(
    () => (modelsData?.records || []).map((model: any) => ({ label: getDisplayName(model), value: model.id })),
    [modelsData]
  );

  const fieldOptions = useMemo(
    () => (fieldsData?.records || []).map((field: any) => ({ label: getDisplayName(field, "Field"), value: field.id })),
    [fieldsData]
  );

  const selectedModule = useMemo(
    () => (modulesData?.records || []).find((module: any) => module.id === selectedModuleId),
    [modulesData, selectedModuleId]
  );

  const selectedModel = useMemo(
    () => (modelsData?.records || []).find((model: any) => model.id === selectedModelId),
    [modelsData, selectedModelId]
  );

  const selectedField = useMemo(
    () => (fieldsData?.records || []).find((field: any) => field.id === selectedFieldId),
    [fieldsData, selectedFieldId]
  );

  const handleFiles = (nextFiles: FileList | File[]) => {
    const nextFileArray = Array.from(nextFiles);
    if (selectedField?.type === "mediaMultiple") {
      setFiles(nextFileArray);
      return;
    }
    setFiles(nextFileArray.slice(0, 1));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!selectedField || uploading) {
      return;
    }
    handleFiles(event.dataTransfer.files);
  };

  const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    event.preventDefault();
    fileInputRef.current?.click();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEntityId = entityId.trim();
    const missingFields = [
      !selectedModuleId ? "module" : "",
      !selectedModelId ? "model" : "",
      !selectedFieldId ? "media field" : "",
      !trimmedEntityId ? "record id" : "",
      files.length === 0 ? "file" : "",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      dispatch(showToast({
        severity: "error",
        summary: "Upload failed",
        detail: `Please provide: ${missingFields.join(", ")}.`,
        life: 4000,
      }));
      return;
    }

    const formData = new FormData();
    formData.append("modelMetadataId", String(selectedModelId));
    formData.append("fieldMetadataId", String(selectedFieldId));
    formData.append("entityId", trimmedEntityId);
    if (selectedField?.mediaStorageProvider?.id) {
      formData.append("mediaStorageProviderMetadataId", String(selectedField.mediaStorageProvider.id));
    }
    files.forEach((file) => formData.append("files", file));

    try {
      await uploadMedia(formData).unwrap();
      dispatch(showToast({ severity: "success", summary: "Uploaded", detail: "Media file uploaded successfully.", life: 3000 }));
      router.push("/admin/core/solid-core/media/list");
    } catch (error) {
      dispatch(showToast({ severity: "error", summary: "Upload failed", detail: getErrorMessage(error), life: 5000 }));
    }
  };

  const accept = getFieldAccept(selectedField);
  const canUploadMultiple = selectedField?.type === "mediaMultiple";
  const maxSizeLabel = selectedField?.mediaMaxSizeKb ? `${selectedField.mediaMaxSizeKb} KB` : "No limit";
  const providerLabel = selectedField?.mediaStorageProvider
    ? getDisplayName(selectedField.mediaStorageProvider)
    : "Field default";
  const dropzoneDisabled = !selectedField || uploading;
  const recordHelpModel = selectedModel ? getDisplayName(selectedModel, "selected model") : "selected model";
  const canSubmit = Boolean(selectedModuleId && selectedModelId && selectedFieldId && entityId.trim() && files.length > 0);

  return (
    <div className="page-parent-wrapper solid-media-upload-page">
      <div className="solid-media-upload-page__header">
        <div>
          <h1 className="solid-media-upload-page__title">Upload Media</h1>
          <p className="solid-media-upload-page__subtitle">Create a media entry for an existing record.</p>
        </div>
      </div>

      <form className="solid-media-upload-form" onSubmit={handleSubmit}>
        <div className="solid-media-upload-stack">
          <label className="solid-media-upload-field">
            <span>Module</span>
            <SolidSelect
              value={selectedModuleId}
              options={moduleOptions}
              placeholder={modulesLoading ? "Loading modules" : "Select module"}
              onChange={({ value }) => setSelectedModuleId(value)}
              disabled={modulesLoading || uploading}
            />
          </label>

          <label className="solid-media-upload-field">
            <span>Model</span>
            <SolidSelect
              value={selectedModelId}
              options={modelOptions}
              placeholder={modelsLoading ? "Loading models" : "Select model"}
              onChange={({ value }) => setSelectedModelId(value)}
              disabled={!selectedModuleId || modelsLoading || uploading}
            />
          </label>

          <label className="solid-media-upload-field">
            <span>Media field</span>
            <SolidSelect
              value={selectedFieldId}
              options={fieldOptions}
              placeholder={fieldsLoading ? "Loading media fields" : "Select media field"}
              onChange={({ value }) => setSelectedFieldId(value)}
              disabled={!selectedModelId || fieldsLoading || uploading}
            />
          </label>

          <label className="solid-media-upload-field">
            <span>Record ID</span>
            <SolidInput
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              disabled={!selectedModel || uploading}
              placeholder={selectedModel ? `${recordHelpModel} record id` : "Select a model first"}
              required
            />
            <em className="solid-media-upload-help">
              Enter the id of the {recordHelpModel} record that this media should be attached to.
            </em>
          </label>

          <div
            className={`solid-media-upload-dropzone${dragActive ? " is-active" : ""}${dropzoneDisabled ? " is-disabled" : ""}`}
            role="button"
            tabIndex={dropzoneDisabled ? -1 : 0}
            onClick={() => {
              if (!dropzoneDisabled) {
                fileInputRef.current?.click();
              }
            }}
            onKeyDown={handleDropzoneKeyDown}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!dropzoneDisabled) {
                setDragActive(true);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!dropzoneDisabled) {
                setDragActive(true);
              }
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              className="solid-media-upload-dropzone__input"
              type="file"
              accept={accept}
              multiple={canUploadMultiple}
              onChange={(event) => handleFiles(event.target.files || [])}
              disabled={dropzoneDisabled}
            />
            <div className="solid-media-upload-dropzone__content">
              <Upload size={24} aria-hidden />
              <span className="solid-media-upload-dropzone__title">
                {selectedField ? "Drop file here or click to upload" : "Select a media field before uploading"}
              </span>
              <span className="solid-media-upload-dropzone__hint">
                {selectedField
                  ? `${canUploadMultiple ? "Multiple files supported" : "Single file only"}`
                  : "The field controls storage, allowed type, and size"}
              </span>
            </div>
            {files.length > 0 && (
              <div className="solid-media-upload-dropzone__files">
                {files.map((file) => (
                  <span className="solid-media-upload-dropzone__file" key={`${file.name}-${file.size}`}>
                    <FileUp size={14} aria-hidden />
                    {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="solid-media-upload-summary">
          <span>Module: {selectedModule ? getDisplayName(selectedModule) : "Not selected"}</span>
          <span>Storage: {providerLabel}</span>
          <span>Max size: {maxSizeLabel}</span>
          <span>Allowed: {selectedField?.mediaTypes?.length ? selectedField.mediaTypes.join(", ") : "Any"}</span>
        </div>

        <div className="solid-media-upload-actions">
          <SolidButton type="button" variant="outline" onClick={() => router.push("/admin/core/solid-core/media/list")} disabled={uploading}>
            Cancel
          </SolidButton>
          <SolidButton type="submit" loading={uploading} disabled={uploading || !canSubmit}>
            Upload
          </SolidButton>
        </div>
      </form>
    </div>
  );
}
