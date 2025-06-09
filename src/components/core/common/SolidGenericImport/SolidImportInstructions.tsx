import { Button } from 'primereact/button'
import styles from './SolidImport.module.css'
import { useLazyGetImportInstructionsQuery } from '@/redux/api/importTransactionApi';
import { useEffect } from 'react';

export const SolidImportInstructions = ({ setImportStep, listViewMetaData }: any) => {

    const [getImportInstructions, { data: importInstructionsData, isLoading, isError }] =
        useLazyGetImportInstructionsQuery();

    console.log("modelMetadataid", listViewMetaData?.data?.solidView?.model?.id);

    useEffect(() => {
        if (listViewMetaData && listViewMetaData?.data?.solidView?.model?.id) {
            getImportInstructions({ id: listViewMetaData?.data?.solidView?.model?.id });
        }
    }, [listViewMetaData, getImportInstructions]);

    const standard = importInstructionsData?.data?.standard || {};
    const custom = importInstructionsData?.data?.custom || [];
    console.log("import instructions", importInstructionsData);

    return (
        <div>
            <div className={styles.SolidImportContextWrapper}>
                <div className='p-3 h-full'>
                    <div className='grid h-full'>
                        <div className='col-7' style={{ borderRight: '1px solid var(--primary-light-color)', overflowY: 'auto' }}>
                            <h5 className='solid-primary-black-text'>Standard Instructions</h5>
                            <ol className='p-0'>
                                <li>
                                    <p className='font-medium solid-primary-black-text'>CSV or Excel (based on radio button selected) template:</p>
                                    <div className='flex align-items-centerm gap-3'>
                                        <Button label='CSV Download' icon="pi pi-download" iconPos='right' size='small' />
                                        <Button label='Excel Download' icon="pi pi-download" iconPos='right' size='small' />
                                    </div>
                                </li>
                            </ol>
                        </div>
                        <div className='col-5' style={{ overflowY: 'auto' }}>
                            <h5 className='solid-primary-black-text'>Custom Instructions</h5>
                        </div>
                    </div>
                </div>
            </div>
            <div className='mt-3 flex align-items-center gap-3'>
                <Button label='Continue' size='small' onClick={() => setImportStep(2)} />
                <Button label='Cancel' size='small' outlined />
            </div>
        </div>
    )
}