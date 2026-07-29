import { SolidFormFieldWidgetProps, SolidListFieldWidgetProps } from "../../../../../../types/solid-core";
import styles from "../../../../form/fields/solidFields.module.css";

export const formatMediaFileSize = (value: unknown) => {
  const size = Number(value);

  if (!Number.isFinite(size) || size < 0) {
    return "--";
  }

  if (size >= 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
};

export const MediaFileSizeListWidget = ({ rowData, fieldMetadata }: SolidListFieldWidgetProps) => (
  <span className="solid-media-file-size" title={`${rowData?.[fieldMetadata.name] ?? ""}`}>
    {formatMediaFileSize(rowData?.[fieldMetadata.name])}
  </span>
);

export const MediaFileSizeFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
  const fieldMetadata = fieldContext.fieldMetadata;
  const fieldLayoutInfo = fieldContext.field;
  const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
  const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
  const value = formik.values[fieldLayoutInfo.attrs.name];

  return (
    <div className={styles.fieldViewWrapper}>
      {showFieldLabel !== false && (
        <p className={`${styles.fieldViewLabel} form-field-label`}>{fieldLabel}</p>
      )}
      <p className={styles.fieldViewValue}>{formatMediaFileSize(value)}</p>
    </div>
  );
};
