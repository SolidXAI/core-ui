import { SolidMediaListFieldWidgetProps } from "../../../../types/solid-core";

export const SolidShortTextFieldImageListWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column, setLightboxUrls, setOpenLightbox }: SolidMediaListFieldWidgetProps) => {
    const isArchivedRecord = rowData?.deletedAt !== null && rowData?.deletedAt !== undefined;

    return (
        <img
            src={rowData[fieldMetadata.name]}
            alt="product-image-single"
            className="rounded shadow-md"
            width={40}
            height={40}
            style={{ objectFit: "cover" }}
            onClick={(event) => {
                event.stopPropagation();
                if (isArchivedRecord) return;
                setLightboxUrls([{ src: rowData[fieldMetadata.name], downloadUrl: rowData[fieldMetadata.name] }]);
                setOpenLightbox(true);
            }}
        />
    );
};
