import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from 'primereact/button'
import styles from './SolidImport.module.css'
import { DocumentSvg } from './DocumentSvg';
export const SolidImportDropzone = ({ setImportStep, setImportTransactionContext }: any) => {
    const [file, setFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv']
        },
        multiple: false,
    });

    const removeFile = () => {
        setFile(null);
    };

    const formatBytes = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div>
            <div className={styles.SolidImportContextWrapper}>
                <div {...getRootProps({ className: styles.dropzone })} className='h-full flex align-items-center justify-content-center'>
                    <input {...getInputProps()} />
                    {!file ? (
                        <div className={""}>
                            <div className='flex justify-content-center'>
                                <DocumentSvg />
                            </div>
                            <h5 className='text-center solid-primary-black-text'>Drop or upload a file to import</h5>
                            <p className='text-center m-0'>Excel files are recommended as formatting is automatic.<br />
                                But, you can also use .csv files</p>
                            <div className='flex justify-content-center mt-3'>
                                <Button label="Click to browse" size="small" onClick={open} severity='secondary' outlined />
                            </div>
                        </div>
                    ) : (
                        <div className="flex align-items-start gap-3 p-3" style={{ border: '1px solid var(--primary-light-color)', borderRadius: 6 }} onClick={(e) => e.stopPropagation()}>
                            <div>
                                <p className='m-0'><strong>File:</strong> {file.name}</p>
                                <p className='m-0'><strong>Type:</strong> {file.type || 'Unknown'}</p>
                                <p className='m-0'><strong>Size:</strong> {formatBytes(file.size)}</p>
                            </div>
                            <div>
                                <Button size="small" icon="pi pi-trash" text onClick={removeFile} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className='mt-3 flex align-items-center gap-3'>
                <Button label='Continue' size='small' onClick={() => setImportTransactionContext(true)} />
                <Button label='Cancel' size='small' outlined onClick={() => setImportStep(1)} />
            </div>
        </div>
    )
}