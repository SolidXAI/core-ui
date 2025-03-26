'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';

const SolidShortTextKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout, data, setLightboxUrls, setOpenLightbox }: SolidKanbanViewFieldsParams) => {
    const renderMode = fieldLayout?.attrs?.renderMode ? fieldLayout?.attrs?.renderMode : "text";

    return (
        <>
            {renderMode === "text" &&
                <p>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}` : ""}</p>
            }
            {renderMode === "image" &&
                <img
                    src={data[fieldMetadata.name]}
                    onClick={(event) => {
                        event.stopPropagation();
                        setLightboxUrls([{ src: data[fieldMetadata.name] }]);
                        setOpenLightbox(true);
                    }}
                    className='image-preview'
                ></img>

            }
        </>
    );

};

export default SolidShortTextKanbanField;