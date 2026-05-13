import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  SolidButton,
  SolidDatePicker,
  SolidDialog,
  SolidDialogBody,
  SolidDialogDescription,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidInput,
  SolidMessage,
  SolidSelect,
} from "../../../shad-cn-ui";
import { showToast } from "../../../../redux/features/toastSlice";
import { type ApiKeyRecord, useGenerateApiKeyForUserMutation } from "../../../../redux/api/apiKeyApi";

const EXPIRY_OPTIONS = [
  { label: "30 days", value: "30d" },
  { label: "60 days", value: "60d" },
  { label: "90 days", value: "90d" },
  { label: "Never", value: "never" },
  { label: "Custom date", value: "custom" },
];

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function resolveExpiresAt(expiryOption: string, customDate: Date | null): string | undefined {
  switch (expiryOption) {
    case "30d":
      return addDays(30);
    case "60d":
      return addDays(60);
    case "90d":
      return addDays(90);
    case "never":
      return undefined;
    case "custom":
      return customDate ? customDate.toISOString() : undefined;
    default:
      return undefined;
  }
}

interface GenerateApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (rawApiKey: string, keyName: string, record: ApiKeyRecord) => void;
  userId?: number;
}

export function GenerateApiKeyModal({ open, onClose, onCreated, userId }: GenerateApiKeyModalProps) {
  const dispatch = useDispatch();
  const [generateApiKeyForUser, { isLoading }] = useGenerateApiKeyForUserMutation();
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const formik = useFormik({
    initialValues: {
      name: "",
      expiryOption: "30d",
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(64, "Name must be 64 characters or fewer")
        .required("Key name is required"),
      expiryOption: Yup.string().required("Expiry is required"),
    }),
    onSubmit: async (values, helpers) => {
      if (values.expiryOption === "custom" && !customDate) {
        helpers.setFieldError("expiryOption", "Please select a custom expiry date");
        return;
      }

      const expiresAt = resolveExpiresAt(values.expiryOption, customDate);

      try {
        const body = { name: values.name.trim(), ...(expiresAt ? { expiresAt } : {}) };
        const response = await generateApiKeyForUser({ userId: userId!, body }).unwrap();

        onCreated(response.data.apiKey, values.name.trim(), response.data.record);
        handleClose();
      } catch (err: any) {
        const detail = err?.data?.message || "Failed to generate API key. Please try again.";
        dispatch(showToast({ severity: "error", summary: "Error", detail }));
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setCustomDate(null);
    onClose();
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      formik.resetForm();
      setCustomDate(null);
    }
  }, [open]);

  const nameError =
    formik.touched.name && formik.errors.name ? String(formik.errors.name) : "";
  const expiryError =
    formik.touched.expiryOption && formik.errors.expiryOption
      ? String(formik.errors.expiryOption)
      : "";

  return (
    <SolidDialog open={open} onOpenChange={handleClose} style={{ maxWidth: 480 }} className="solid-api-key-dialog">
      <SolidDialogHeader className="solid-api-key-dialog-header">
        <SolidDialogTitle>Generate API Key</SolidDialogTitle>
        <SolidDialogDescription>
          Create a named key for this user. The raw key will be shown only once after generation.
        </SolidDialogDescription>
      </SolidDialogHeader>
      <SolidDialogSeparator />
      <SolidDialogBody className="solid-api-key-dialog-body">
        <form id="generate-api-key-form" onSubmit={formik.handleSubmit}>
          <div className="solid-api-key-dialog-fields">
            <div className="solid-api-key-dialog-field">
              <label htmlFor="api-key-name" className="form-field-label">
                Key Name <span style={{ color: "var(--solid-danger-color, #ef4444)" }}>*</span>
              </label>
              <SolidInput
                id="api-key-name"
                name="name"
                autoComplete="off"
                placeholder="e.g. CI/CD pipeline, Mobile app"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {nameError && <SolidMessage severity="error" text={nameError} />}
            </div>

            <div className="solid-api-key-dialog-field">
              <label htmlFor="api-key-expiry" className="form-field-label">
                Expires
              </label>
              <SolidSelect
                value={formik.values.expiryOption}
                options={EXPIRY_OPTIONS}
                optionLabel="label"
                optionValue="value"
                onChange={({ value }) => {
                  formik.setFieldValue("expiryOption", value);
                  if (value !== "custom") setCustomDate(null);
                }}
              />
              {formik.values.expiryOption === "custom" && (
                <SolidDatePicker
                  selected={customDate}
                  onChange={(date: Date | null) => setCustomDate(date)}
                  minDate={new Date()}
                  placeholderText="Select expiry date"
                  dateFormat="dd/MM/yyyy"
                />
              )}
              {formik.values.expiryOption !== "custom" ? (
                <p className="solid-api-key-dialog-hint m-0">Choose how long this key should remain valid.</p>
              ) : null}
              {expiryError && <SolidMessage severity="error" text={expiryError} />}
            </div>
          </div>
        </form>
      </SolidDialogBody>
      <SolidDialogSeparator />
      <SolidDialogFooter className="solid-api-key-dialog-footer">
        <SolidButton variant="outline" type="button" onClick={handleClose} disabled={isLoading}>
          Cancel
        </SolidButton>
        <SolidButton type="submit" form="generate-api-key-form" loading={isLoading}>
          Generate Key
        </SolidButton>
      </SolidDialogFooter>
    </SolidDialog>
  );
}
