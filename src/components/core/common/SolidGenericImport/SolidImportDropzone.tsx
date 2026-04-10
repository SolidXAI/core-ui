
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, FileText, Trash2, Upload } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../../redux/features/toastSlice';
import styles from './SolidImport.module.css'
import { DocumentSvg } from './DocumentSvg';
import { useCreateImportTransactionMutation } from '../../../../redux/api/importTransactionApi';
import { ERROR_MESSAGES } from '../../../../constants/error-messages';
import { SolidButton } from '../../../shad-cn-ui';
export const SolidImportDropzone = ({ setImportStep, setTransactionId, modelMetadataId }: any) => {
    const dispatch = useDispatch();

    const [file, setFile] = useState<File | null>(null);
    const [createImportTransaction, { isLoading }] = useCreateImportTransactionMutation();


    const uploadFile = async (uploadFile: File) => {
        const formData = new FormData();
        formData.append('fileLocation', uploadFile);
        formData.append('modelMetadataId', modelMetadataId);

        try {
            const response = await createImportTransaction(formData).unwrap();
            console.log('Upload success:', response);
            if (response?.statusCode === 200) {
                setFile(uploadFile);
                dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.FILE_UPLOAD, detail: ERROR_MESSAGES.FILE_UPLOAD_SUCCESSFULLY }));
                setTransactionId?.(response?.data?.id);
            } else {
                dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FAILED, detail: ERROR_MESSAGES.FAILED_UPLOAD_FILE }))
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.FAILED_UPLOAD_FILE, error);
            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.FAILED, detail: ERROR_MESSAGES.FAILED_UPLOAD_FILE }))
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            uploadFile(selectedFile); // 👈 Auto upload on drop
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

    const rootProps = getRootProps({ className: 'solid-import-dropzone-shell' });

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
                <div {...rootProps}>
                    <input {...getInputProps()} />
                    <div className="solid-import-dropzone-copy">
                        <div className='flex justify-content-center'>
                            <DocumentSvg />
                        </div>
                        <div className="solid-import-dropzone-kicker">Accepted formats</div>
                        <h5 className='text-center solid-primary-black-text solid-import-section-title solid-import-dropzone-title'>Drop or upload a file to import</h5>
                        <p className='text-center m-0 solid-import-section-copy'>Excel files are recommended as formatting is automatic. You can also import plain <code>.csv</code> files.</p>
                        <div className="solid-import-dropzone-format-list" aria-hidden="true">
                            <span className="solid-import-dropzone-format-pill">
                                <FileSpreadsheet size={13} />
                                Excel
                            </span>
                            <span className="solid-import-dropzone-format-pill">
                                <FileText size={13} />
                                CSV
                            </span>
                        </div>
                        <div className='flex justify-content-center mt-3'>
                            <SolidButton type="button" variant="outline" size="small" leftIcon={<Upload size={14} />} onClick={(event) => {
                                event.stopPropagation();
                                open();
                            }}>
                                Browse Files
                            </SolidButton>
                        </div>
                    </div>
                    {file &&
                        <div className="solid-import-file-card" onClick={(e) => e.stopPropagation()}>
                            <div className="solid-import-file-card-main">
                                <div className="solid-import-file-icon">
                                    <FileSpreadsheet size={18} />
                                </div>
                                <div className="solid-import-file-meta">
                                    <p className='m-0 solid-import-file-name'>{file.name}</p>
                                    <p className='m-0 solid-import-file-caption'>{file.type || 'Unknown type'}</p>
                                    <p className='m-0 solid-import-file-caption'>{formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <SolidButton type="button" variant="ghost" size="small" className="solid-import-file-remove" leftIcon={<Trash2 size={14} />} onClick={removeFile} />
                        </div>
                    }
                </div>
            </div>
            <div className='solid-import-actions'>
                <p className="solid-import-actions-copy">Upload one source file and continue to field mapping.</p>
                <SolidButton
                    type="button"
                    size='small'
                    onClick={() => {
                        if (!file) {
                            dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.MISSING_FILE, detail: ERROR_MESSAGES.FAILED_UPLOAD_FILE }));
                            return;
                        }
                        setImportStep(3);
                    }}
                    disabled={!file || isLoading}
                    loading={isLoading}
                >
                    Continue
                </SolidButton>
            </div>
        </div>
    )
}
