"use client"
import { Dialog } from 'primereact/dialog';
import React, { useState } from 'react'
import { SolidImportStepper } from './SolidImportStepper';
import { SolidImportInstructions } from './SolidImportInstructions';
import { SolidImportWrapper } from './SolidImportWrapper';

export const SolidGenericImport = ({
    openImportDialog,
    setOpenImportDialog,
    listViewMetaData,
    handleFetchUpdatedRecords
}: any) => {
    const [importStep, setImportStep] = useState<number>(1)
    return (
        <Dialog
            header={<h5 className='m-0'>Import Data</h5>}
            visible={openImportDialog}
            style={{ width: '60vw' }}
            onHide={() => { if (!openImportDialog) return; setOpenImportDialog(false); }}
            headerClassName="px-4 py-2 secondary-border-bottom"
            contentClassName="p-0"
        >
            <SolidImportStepper importStep={importStep} setImportStep={setImportStep} />
            <div className='px-4 py-3'>
                {importStep === 1 &&
                    <SolidImportInstructions setImportStep={setImportStep} listViewMetaData={listViewMetaData} />
                }
                {importStep === 2 &&
                    <SolidImportWrapper handleFetchUpdatedRecords={handleFetchUpdatedRecords} setImportStep={setImportStep} listViewMetaData={listViewMetaData} setOpenImportDialog={setOpenImportDialog}/>
                }
            </div>
        </Dialog>
    )
}