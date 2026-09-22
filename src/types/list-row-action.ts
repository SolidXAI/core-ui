/**
 * Data assembled by Core UI when a custom List row action is activated.
 *
 * This type intentionally does not describe model-specific row fields. The
 * generated List view determines the shape of rowData.
 */
export type SolidListRowActionEvent = {
  params?: Record<string, unknown>;
  rowData?: Record<string, unknown> | null;
  solidListViewMetaData?: Record<string, unknown> | null;
};

/**
 * Props commonly available to a custom List row-action extension component.
 */
export type SolidListRowActionProps = SolidListRowActionEvent & {
  closePopup?: () => void;
};
