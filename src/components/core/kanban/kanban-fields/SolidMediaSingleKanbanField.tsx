'use client';
import React, { useState } from 'react';
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';
import { FormEvent } from "primereact/ts-helpers";
import { FilterMatchMode } from 'primereact/api';
import { Document, Page, pdfjs } from "react-pdf";
import { Dialog } from "primereact/dialog";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


const SolidMediaSingleKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout, data, setLightboxUrls, setOpenLightbox }: SolidKanbanViewFieldsParams) => {
    const [visible, setVisible] = useState(false);
    const header = fieldMetadata.displayName;
    const url = data && data._media && data._media[fieldMetadata.name].length > 0 && data._media[fieldMetadata.name].map((i: any) => i._full_url)[0];
    const mimeType = data && data._media && data._media[fieldMetadata.name].length > 0 && data._media[fieldMetadata.name].map((i: any) => i.mimeType)[0];
    // const mimeType: string = "excel";
    // const url = "http://localhost:8080/media-files-storage/Holiday List 2025.pdf";
    // const url = "http://localhost:8080/media-files-storage/PF Form.xls";
    
    

    return (
        <>
            {mimeType && mimeType.includes("image/") &&
                <img className='image-preview'
                    src={url}
                    onClick={(event) => {
                        event.stopPropagation();
                        setLightboxUrls([{ src: url }]);
                        setOpenLightbox(true);
                    }} 
                    alt={header} />}

            {/* Render PDF - Open Lightbox on Click */}
            {mimeType && mimeType.includes("pdf") && (
                <>
                    <i className="pi pi-file-pdf" style={{ fontSize: "24px", color: "red", cursor: "pointer" }} onClick={() => setVisible(true)}></i>
                    <Dialog header="PDF Preview" visible={visible} style={{ width: "" }} onHide={() => setVisible(false)} modal>
                        <Document file={url}>
                            <Page pageNumber={1} />
                        </Document>
                    </Dialog>
                </>
            )}
            {/* Excel or Other Files - Show Download Icon */}
            {mimeType && (mimeType.includes("excel") || mimeType.includes("spreadsheet")) && (
                <a href={url} download target="_blank" rel="noopener noreferrer">
                    <i className="pi pi-file-excel">Download</i>
                </a>
            )}

        </>
    );

};

export default SolidMediaSingleKanbanField;