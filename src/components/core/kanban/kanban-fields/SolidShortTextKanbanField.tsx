'use client';
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';

const SolidShortTextKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout, data, setLightboxUrls, setOpenLightbox }: SolidKanbanViewFieldsParams) => {
    const renderMode = fieldLayout?.attrs?.renderMode ? fieldLayout?.attrs?.renderMode : "text";

    return (
        <div>
            {renderMode === "text" &&
                <p className='font-medium'>{data && data[fieldMetadata.name] ? `${data[fieldMetadata.name]}` : ""}</p>
            }
            {renderMode === "image" &&
                <div className='my-2'>
                    <img
                        src={data[fieldMetadata.name]}
                        onClick={(event) => {
                            event.stopPropagation();
                            setLightboxUrls([{ src: data[fieldMetadata.name] }]);
                            setOpenLightbox(true);
                        }}
                        className='kanban-image-preview'
                    ></img>
                </div>
            }
        </div>
    );

};

export default SolidShortTextKanbanField;