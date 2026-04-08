import { useState } from "react";
import { SolidPopover, SolidPopoverContent, SolidPopoverTrigger } from "../../shad-cn-ui/SolidPopover";
import { SolidListViewRowActionMenuItem } from "./SolidListViewRowActionMenuItem";

export function SolidListViewRowActionsMenu({
  rowData,
  hasEditInContextMenu,
  hasDeleteInContextMenu,
  hasCustomContextMenuButtons,
  solidListViewLayout,
  solidListViewMetaData,
  params,
  handleCustomButtonClick,
  onSelectRow,
  onEdit,
  onDelete,
  contentClassName,
}: any) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onSelectRow?.(rowData);
    }
    setOpen(nextOpen);
  };

  const visibleCustomButtons =
    solidListViewLayout?.attrs?.rowButtons?.filter(
      (rb: any) => rb?.attrs?.actionInContextMenu === true && rb?.attrs?.visible !== false
    ) ?? [];

  const hasAnyItems =
    hasEditInContextMenu || (hasDeleteInContextMenu && !params.embeded) || visibleCustomButtons.length > 0;

  if (!hasAnyItems) return null;

  return (
    <SolidPopover open={open} onOpenChange={handleOpenChange}>
      <SolidPopoverTrigger asChild>
        <button
          type="button"
          className="solid-row-menu-trigger"
          data-no-row-click="true"
          onClick={(event) => {
            event.stopPropagation();
            onSelectRow?.(rowData);
          }}
          aria-label="Open row actions"
        >
          <i className="pi pi-ellipsis-h" />
        </button>
      </SolidPopoverTrigger>
      <SolidPopoverContent
        className={contentClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="solid-row-actions-menu">
          {hasEditInContextMenu && (
            <button
              type="button"
              className="solid-row-action-button"
              onClick={() => {
                onEdit?.(rowData);
                setOpen(false);
              }}
            >
              <i className="pi pi-pencil solid-row-action-button-icon" />
              <span className="solid-row-action-button-label">Edit</span>
            </button>
          )}

          {hasDeleteInContextMenu && !params.embeded && (
            <button
              type="button"
              className="solid-row-action-button solid-row-action-button-danger"
              onClick={() => {
                onDelete?.(rowData);
                setOpen(false);
              }}
            >
              <i className="pi pi-trash solid-row-action-button-icon" />
              <span className="solid-row-action-button-label">Delete</span>
            </button>
          )}

          {hasCustomContextMenuButtons &&
            visibleCustomButtons.map((button: any, index: number) => (
              <SolidListViewRowActionMenuItem
                key={`${index}-${rowData?.id || ""}`}
                button={button}
                params={params}
                rowData={rowData}
                solidListViewMetaData={solidListViewMetaData}
                handleCustomButtonClick={handleCustomButtonClick}
                onActionComplete={() => setOpen(false)}
              />
            ))}
        </div>
      </SolidPopoverContent>
    </SolidPopover>
  );
}
