
export const SolidShortTextFieldImageRenderModeWidget = ({ value, setLightboxUrls, setOpenLightbox }: any) => {
    return (
        <img
            src={value}
            alt="product-image-single"
            className="shadow-2 border-round"
            width={40}
            height={40}
            style={{ objectFit: "cover" }}
            onClick={(event) => {
                event.stopPropagation();
                setLightboxUrls([{ src: value, downloadUrl: value }]);
                setOpenLightbox(true);
            }}
        />
    );
};

