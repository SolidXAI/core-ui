import React, { useState } from 'react'
import { SolidImportDropzone } from './SolidImportDropzone'
import { SolidImportTransaction } from './SolidImportTransaction'

export const ImportWrapper = ({ setImportStep }: any) => {
    const [importTransactionContext, setImportTransactionContext] = useState(false);
    return (
        <div>
            {!importTransactionContext ?
                <SolidImportDropzone setImportStep={setImportStep} setImportTransactionContext={setImportTransactionContext} />
                :
                <SolidImportTransaction setImportTransactionContext={setImportTransactionContext} />
            }
        </div>
    )
}