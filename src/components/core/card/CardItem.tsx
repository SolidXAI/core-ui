// @ts-nocheck
import React from "react";
import { useRouter } from "../../../hooks/useRouter";
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
  setLightboxUrls?: any;
  setOpenLightbox?: any;
}

const CardItem: React.FC<CardItemProps> = ({
  data,
  solidCardViewMetaData,
  editButtonUrl,
  cardNode,
  DynamicCardWidget,
  setLightboxUrls,
  setOpenLightbox,
}) => {
  const router = useRouter();

  const openRecord = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fromView", "card");
      sessionStorage.setItem("fromViewUrl", window.location.pathname + window.location.search);
    }
    router.push(`${editButtonUrl}/${data?.id}`);
  };

  const openEdit = () => {
    router.push(`${editButtonUrl}/${data?.id}`);
  };

  return (
    <div className="solid-card-view-item">
      <div className="solid-card-view-card solid-kanban-card" onClick={openRecord}>
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
              <SolidDropdownMenuItem
                className="solid-header-dropdown-item"
                onSelect={openEdit}
              >
                <SolidIcon name="si-pencil" className="solid-header-action-button-icon" aria-hidden />
                <span className="solid-header-action-button-label">Edit</span>
              </SolidDropdownMenuItem>
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
