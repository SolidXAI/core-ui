import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import qs from "qs";
import { Upload } from "lucide-react";
import { useDispatch } from "react-redux";
import { SolidButton, SolidInput, SolidSelect } from "../../../../components/shad-cn-ui";
import { useLazyGetmodulesQuery } from "../../../../redux/api/moduleApi";
import { useLazyGetModelsQuery } from "../../../../redux/api/modelApi";
import { useLazyGetfieldsQuery } from "../../../../redux/api/fieldApi";
import { useUploadMediaMutation } from "../../../../redux/api/mediaApi";
import { showToast } from "../../../../redux/features/toastSlice";
import { useRouter } from "../../../../hooks/useRouter";

const MEDIA_ACCEPT_MAP: Record<string, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  pdf: "application/pdf",
};

const getDisplayName = (record: any) => record?.displayName || record?.name || record?.singularName || `#${record?.id}`;

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
  const [selectedModuleId, setSelectedModuleId] = useState<number | "">("");
  const [selectedModelId, setSelectedModelId] = useState<number | "">("");
  const [selectedFieldId, setSelectedFieldId] = useState<number | "">("");
  const [entityId, setEntityId] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [getModules, { data: modulesData, isFetching: modulesLoading }] = useLazyGetmodulesQuery();
  const [getModels, { data: modelsData, isFetching: modelsLoading }] = useLazyGetModelsQuery();
  const [getFields, { data: fieldsData, isFetching: fieldsLoading }] = useLazyGetfieldsQuery();
  const [uploadMedia, { isLoading: uploading }] = useUploadMediaMutation();

  useEffect(() => {
    getModules("offset=0&limit=500&sort[0]=displayName%3Aasc");
  }, [getModules]);

  useEffect(() => {
    if (!selectedModuleId) {
      return;
    }

    const query = buildQuery({
      offset: 0,
      limit: 500,
      populate: ["module"],
      filters: {
        $and: [
          {
            $or: [
              {
                module: {
                  id: { $eq: selectedModuleId },
                },
              },
            ],
          },
        ],
      },
      sort: ["displayName:asc"],
    });
    getModels(query);
    setSelectedModelId("");
    setSelectedFieldId("");
    setFiles([]);
  }, [selectedModuleId, getModels]);

  useEffect(() => {
    if (!selectedModelId) {
      return;
    }

    const query = buildQuery({
      offset: 0,
      limit: 500,
      populate: ["model", "mediaStorageProvider"],
      filters: {
        $and: [
          {
            $or: [
              {
                model: {
                  id: { $eq: selectedModelId },
                },
              },
            ],
          },
        ],
      },
      sort: ["displayName:asc"],
    });
    getFields(query);
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

  const mediaFields = useMemo(
    () => (fieldsData?.records || []).filter((field: any) => field?.type === "mediaSingle" || field?.type === "mediaMultiple"),
    [fieldsData]
  );

  const fieldOptions = useMemo(
    () => mediaFields.map((field: any) => ({ label: `${getDisplayName(field)} (${field.type})`, value: field.id })),
    [mediaFields]
  );

  const selectedField = useMemo(
    () => mediaFields.find((field: any) => field.id === selectedFieldId),
    [mediaFields, selectedFieldId]
  );

  const selectedModel = useMemo(
    () => (modelsData?.records || []).find((model: any) => model.id === selectedModelId),
    [modelsData, selectedModelId]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files || []));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedModelId || !selectedFieldId || !entityId || files.length === 0) {
      dispatch(showToast({ severity: "error", summary: "Upload failed", detail: "Module, model, field, entity id, and file are required.", life: 4000 }));
      return;
    }

    const formData = new FormData();
    formData.append("modelMetadataId", String(selectedModelId));
    formData.append("fieldMetadataId", String(selectedFieldId));
    formData.append("entityId", entityId);
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

  return (
    <div className="page-parent-wrapper solid-media-upload-page">
      <div className="solid-media-upload-page__header">
        <div>
          <h1 className="solid-media-upload-page__title">Upload Media</h1>
          <p className="solid-media-upload-page__subtitle">Create a media entry for an existing record.</p>
        </div>
        <SolidButton type="button" variant="outline" size="sm" onClick={() => router.push("/admin/core/solid-core/media/list")}>
          Back to list
        </SolidButton>
      </div>

      <form className="solid-media-upload-form" onSubmit={handleSubmit}>
        <div className="solid-media-upload-grid">
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
              placeholder={fieldsLoading ? "Loading fields" : "Select media field"}
              onChange={({ value }) => setSelectedFieldId(value)}
              disabled={!selectedModelId || fieldsLoading || uploading}
            />
          </label>

          <label className="solid-media-upload-field">
            <span>Entity ID</span>
            <SolidInput
              type="number"
              min="1"
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
              disabled={uploading}
              placeholder={selectedModel ? `${getDisplayName(selectedModel)} record id` : "Record id"}
            />
          </label>
        </div>

        <div className="solid-media-upload-dropzone">
          <input
            type="file"
            accept={accept}
            multiple={canUploadMultiple}
            onChange={handleFileChange}
            disabled={!selectedFieldId || uploading}
          />
          <Upload size={22} aria-hidden />
          <span>{files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "Choose file"}</span>
        </div>

        <div className="solid-media-upload-summary">
          <span>Storage: {providerLabel}</span>
          <span>Max size: {maxSizeLabel}</span>
          <span>Allowed: {selectedField?.mediaTypes?.length ? selectedField.mediaTypes.join(", ") : "Any"}</span>
        </div>

        <div className="solid-media-upload-actions">
          <SolidButton type="button" variant="outline" onClick={() => router.push("/admin/core/solid-core/media/list")} disabled={uploading}>
            Cancel
          </SolidButton>
          <SolidButton type="submit" loading={uploading} disabled={uploading}>
            Upload
          </SolidButton>
        </div>
      </form>
    </div>
  );
}
