import React, { useEffect, useState } from 'react'
import { SolidImportStepper } from './SolidImportStepper';
import { SolidImportInstructions } from './SolidImportInstructions';
import { SolidImportDropzone } from './SolidImportDropzone';
import { SolidImportTransaction } from './SolidImportTransaction';
import { SolidImportTransactionStatus } from './SolidImportTransactionStatus';
import {
    SolidDialog,
    SolidDialogBody,
    SolidDialogClose,
    SolidDialogDescription,
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
    const [maxStepReached, setMaxStepReached] = useState<number>(1);
    const [transactionId, setTransactionId] = useState(null);
    const [importStatusResult, setImportStatusResult] = useState<any>(null)
    const modelMetadataId = listViewMetaData?.data?.solidView?.model?.id;

    useEffect(() => {
        if (openImportDialog) {
            setImportStep(1);
            setMaxStepReached(1);
            setTransactionId(null);
            setImportStatusResult(null);
        }
    }, [openImportDialog]);

    const handleStepChange = (nextStep: number) => {
        setImportStep(nextStep);
        setMaxStepReached((current) => Math.max(current, nextStep));
    };

    const renderStepContent = () => {
        if (importStep === 1) {
            return (
                <SolidImportInstructions
                    setImportStep={handleStepChange}
                    listViewMetaData={listViewMetaData}
                />
            );
        }

        if (importStep === 2) {
            return (
                <SolidImportDropzone
                    setImportStep={handleStepChange}
                    setTransactionId={setTransactionId}
                    modelMetadataId={modelMetadataId}
                />
            );
        }

        if (importStep === 3) {
            return (
                <SolidImportTransaction
                    transactionId={transactionId}
                    setImportStatusResult={setImportStatusResult}
                    setImportStep={handleStepChange}
                />
            );
        }

        return (
            <SolidImportTransactionStatus
                importStatusResult={importStatusResult}
                transactionId={transactionId}
                setOpenImportDialog={setOpenImportDialog}
                handleFetchUpdatedRecords={handleFetchUpdatedRecords}
            />
        );
    };

    return (
        <SolidDialog
            open={openImportDialog}
            onOpenChange={setOpenImportDialog}
            className='solid-import-dialog'
            style={{ width: "min(840px, calc(100vw - 1.5rem))" }}
        >
            <SolidDialogHeader className="solid-filter-dialog-head solid-import-dialog-head">
                <div>
                    <SolidDialogTitle className="solid-filter-dialog-title m-0">Import Data</SolidDialogTitle>
                    <SolidDialogDescription className="solid-filter-dialog-subtitle solid-import-dialog-subtitle">
                        Upload a CSV or Excel file, map its columns, and import records in four short steps.
                    </SolidDialogDescription>
                </div>
                <SolidDialogClose className="solid-filter-dialog-close" />
            </SolidDialogHeader>
            <SolidDialogSeparator className="solid-filter-dialog-sep" />
            <SolidDialogBody className='solid-import-dialog-body'>
                <div className="solid-import-shell">
                    <SolidImportStepper
                        importStep={importStep}
                        maxStepReached={maxStepReached}
                        setImportStep={handleStepChange}
                    />
                    {renderStepContent()}
                </div>
            </SolidDialogBody>
        </SolidDialog>
    )
}
