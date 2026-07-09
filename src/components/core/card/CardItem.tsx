// @ts-nocheck
import React from "react";
import { useRouter } from "../../../hooks/useRouter";
import { storeCurrentModelViewContext } from "../../../helpers/modelViewPersistence";
import {
  SolidDropdownMenu,
  SolidDropdownMenuContent,
  SolidDropdownMenuItem,
  SolidDropdownMenuTrigger,
  SolidIcon,
} from "../../shad-cn-ui";

interface CardItemProps {
  data: any;
  solidCardViewMetaData: any;
  editButtonUrl?: string;
  cardNode?: any;
  DynamicCardWidget?: any;
  onRecover?: (record: any) => void;
  setLightboxUrls?: any;
  setOpenLightbox?: any;
  showArchived?: boolean;
}

const CardItem: React.FC<CardItemProps> = ({
  data,
  solidCardViewMetaData,
  editButtonUrl,
  cardNode,
  DynamicCardWidget,
  onRecover,
  setLightboxUrls,
  setOpenLightbox,
  showArchived,
}) => {
  const router = useRouter();
  const isArchivedRecord = data?.deletedAt !== null && data?.deletedAt !== undefined;

  const openRecord = () => {
    if (isArchivedRecord) return;
    storeCurrentModelViewContext();
    router.push(`${editButtonUrl}/${data?.id}`);
  };

  const openEdit = () => {
    if (isArchivedRecord) return;
    storeCurrentModelViewContext();
    router.push(`${editButtonUrl}/${data?.id}`);
  };

  return (
    <div className="solid-card-view-item">
      <div
        className={`solid-card-view-card solid-kanban-card${isArchivedRecord ? " greyed-out-row" : ""}`}
        onClick={openRecord}
        style={{ cursor: isArchivedRecord ? "default" : "pointer" }}
      >
        <div className="solid-kanban-action" onClick={(e) => e.stopPropagation()}>
          <SolidDropdownMenu>
            <SolidDropdownMenuTrigger asChild>
              <button
                type="button"
                className="solid-header-cog-trigger solid-kanban-action-trigger"
                aria-label="Open card actions"
              >
                <SolidIcon name="si-ellipsis-v" aria-hidden />
              </button>
            </SolidDropdownMenuTrigger>
            <SolidDropdownMenuContent className="solid-custom-overlay" align="end">
              {!isArchivedRecord ? (
                <SolidDropdownMenuItem
                  className="solid-header-dropdown-item"
                  onSelect={openEdit}
                >
                  <SolidIcon name="si-pencil" className="solid-header-action-button-icon" aria-hidden />
                  <span className="solid-header-action-button-label">Edit</span>
                </SolidDropdownMenuItem>
              ) : null}
              {showArchived && data?.deletedAt !== null && data?.deletedAt !== undefined && onRecover ? (
                <SolidDropdownMenuItem
                  className="solid-header-dropdown-item"
                  onSelect={() => onRecover(data)}
                >
                  <SolidIcon name="si-refresh" className="solid-header-action-button-icon" aria-hidden />
                  <span className="solid-header-action-button-label">Recover</span>
                </SolidDropdownMenuItem>
              ) : null}
            </SolidDropdownMenuContent>
          </SolidDropdownMenu>
        </div>
        {DynamicCardWidget ? (
          <DynamicCardWidget
            rowData={data}
            solidKanbanViewMetaData={solidCardViewMetaData}
            solidView={solidCardViewMetaData?.solidView}
            solidFieldsMetadata={solidCardViewMetaData?.solidFieldsMetadata}
            card={cardNode}
            layoutAttrs={solidCardViewMetaData?.solidView?.layout?.attrs || {}}
            groupedView={false}
            editButtonUrl={editButtonUrl}
            setLightboxUrls={setLightboxUrls}
            setOpenLightbox={setOpenLightbox}
            openRecord={openRecord}
            openEdit={openEdit}
          />
        ) : null}
      </div>
    </div>
  );
};

export default CardItem;
