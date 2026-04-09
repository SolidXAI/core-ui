import React, { useState } from 'react'
import { SolidImportStepper } from './SolidImportStepper';
import { SolidImportInstructions } from './SolidImportInstructions';
// import { SolidImportWrapper } from './SolidImportWrapper';
import { SolidImportDropzone } from './SolidImportDropzone';
import { SolidImportTransaction } from './SolidImportTransaction';
import { SolidImportTransactionStatus } from './SolidImportTransactionStatus';
import {
    SolidDialog,
    SolidDialogBody,
    SolidDialogClose,
    SolidDialogHeader,
    SolidDialogSeparator,
    SolidDialogTitle,
} from "../../../shad-cn-ui";

export const SolidGenericImport = ({
    openImportDialog,
    setOpenImportDialog,
    listViewMetaData,
    handleFetchUpdatedRecords
}: any) => {
    const [importStep, setImportStep] = useState<number>(1)
    const [transactionId, setTransactionId] = useState(null);
    const [importStatusResult, setImportStatusResult] = useState<any>(null)
    const modelMetadataId = listViewMetaData?.data?.solidView?.model?.id;
    return (
        <SolidDialog
            open={openImportDialog}
            onOpenChange={setOpenImportDialog}
            className='solid-import-dialog'
            style={{ width: "min(880px, calc(100vw - 2rem))" }}
        >
            <SolidDialogHeader className="solid-filter-dialog-head solid-import-dialog-head">
                <div>
                    <SolidDialogTitle className="solid-filter-dialog-title m-0">Import Data</SolidDialogTitle>
                </div>
                <SolidDialogClose className="solid-filter-dialog-close" />
            </SolidDialogHeader>
            <SolidDialogSeparator className="solid-filter-dialog-sep" />
            <SolidImportStepper importStep={importStep} setImportStep={setImportStep} />
            <SolidDialogBody className='solid-import-dialog-body'>
                {importStep === 1 &&
                    <SolidImportInstructions setImportStep={setImportStep} listViewMetaData={listViewMetaData} />
                }
                {importStep === 2 &&
                    <SolidImportDropzone
                        setImportStep={setImportStep}
                        setTransactionId={setTransactionId}
                        modelMetadataId={modelMetadataId}
                    />
                }
                {importStep === 3 &&
                    <SolidImportTransaction
                        transactionId={transactionId}
                        setImportStatusResult={setImportStatusResult}
                        setImportStep={setImportStep}
                    />
                }
                {importStep === 4 &&
                    <SolidImportTransactionStatus
                        importStatusResult={importStatusResult}
                        transactionId={transactionId}
                        setOpenImportDialog={setOpenImportDialog}
                        handleFetchUpdatedRecords={handleFetchUpdatedRecords}
                    />
                }
            </SolidDialogBody>
        </SolidDialog>
    )
}
