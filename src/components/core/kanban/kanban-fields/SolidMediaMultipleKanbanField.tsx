'use client';
import React, { useState } from 'react';
import { Column } from "primereact/column";
import { SolidKanbanViewFieldsParams } from '../SolidKanbanViewFields';
import { Dialog } from 'primereact/dialog';
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


const SolidMediaMultipleKanbanField = ({ solidKanbanViewMetaData, fieldMetadata, fieldLayout, data }: SolidKanbanViewFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const [visible, setVisible] = useState(false);
    const header = fieldMetadata.displayName;
    // const fileData = data && data._media[fieldMetadata.name].length > 0 && data._media[fieldMetadata.name].map((i: any) => {
    //     const fileData = { mimeType: i.mimeType, url: i._full_url }
    //     return fileData
    // }
    // );
    const fileData = [
        { mimeType: "image/jpeg", url: "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png" },
        { mimeType: "application/pdf", url: "http://localhost:8080/media-files-storage/Holiday List 2025.pdf" },
        { mimeType: "application/vnd.ms-excel", url: "http://localhost:8080/media-files-storage/PF Form.xls" }
    ]

    return (
        <>
            {fileData && fileData.map((file: any) => {
                return (
                    <>
                        <div>
                            {file.mimeType.startsWith("image/") && <img src={file.url} alt={header} />}
                            {/* Render PDF - Open Lightbox on Click */}
                            {file.mimeType.includes("pdf") && (
                                <>
                                    <i className="pi pi-file-pdf" style={{ fontSize: "24px", color: "red", cursor: "pointer" }} onClick={() => setVisible(true)}></i>
                                    <Dialog header="PDF Preview" visible={visible} style={{ width: "" }} onHide={() => setVisible(false)} modal>
                                        <Document file={file.url}>
                                            <Page pageNumber={1} />
                                        </Document>
                                    </Dialog>
                                </>
                            )}
                            {/* Excel or Other Files - Show Download Icon */}
                            {(file.mimeType.includes("excel") || file.mimeType.includes("spreadsheet")) && (
                                <a href={file.url} download target="_blank" rel="noopener noreferrer">
                                    <i className="pi pi-file-excel">Download</i>
                                </a>
                            )}
                        </div>
                    </>
                );
            }
            )}
        </>
    );

};

export default SolidMediaMultipleKanbanField;