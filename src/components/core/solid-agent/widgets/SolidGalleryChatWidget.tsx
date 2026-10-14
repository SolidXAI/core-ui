import { useState } from "react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";

type GalleryImage = string | { src: string; alt?: string };

/** `event_data: { widget: "gallery", images: [src | { src, alt }] }` — image grid with a lightbox. */
export const SolidGalleryChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<{ images?: GalleryImage[] }>(eventData);
    const images = asArray<GalleryImage>(data.images)
        .map((image) => (typeof image === "string" ? { src: image, alt: "" } : { src: image.src, alt: image.alt ?? "" }))
        .filter((image) => /^(https?:|data:image\/|\/)/i.test(image.src));
    const [zoom, setZoom] = useState<string | null>(null);

    return (
        <>
            <div className={styles.gallery}>
                {images.map((image, index) => (
                    <img key={index} src={image.src} alt={image.alt} onClick={() => setZoom(image.src)} />
                ))}
            </div>
            {zoom && (
                <div className={styles.lightbox} role="dialog" aria-label="Image preview" onClick={() => setZoom(null)}>
                    <img src={zoom} alt="" />
                </div>
            )}
        </>
    );
};

Object.assign(SolidGalleryChatWidget, { getExtensionMetadata: () => ({
    agentWidget: {
        name: "gallery",
        description: "Show a grid of images with captions.",
        propsSchema: {
            type: "object",
            properties: {
                images: {
                    type: "array",
                    items: { anyOf: [
                        { type: "string" },
                        { type: "object", properties: { src: { type: "string" }, alt: { type: "string" } }, required: ["src"] },
                    ] },
                },
            },
            required: ["images"],
        },
    },
}) });
