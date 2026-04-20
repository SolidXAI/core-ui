import styles from './chatter.module.css'
import { useCreateChatterMessageMutation } from '../../../redux/api/solidChatterMessageApi'
import { useEffect, useState, useRef } from 'react'
import { ERROR_MESSAGES } from '../../../constants/error-messages'
import { useSession } from '../../../hooks/useSession'
import { SolidButton, SolidTextarea } from '../../shad-cn-ui'
import { FileText, Paperclip, X } from 'lucide-react'

interface SolidMessageComposerProps {
    type?: string;
    modelSingularName?: any;
    refetch?: any;
    id?: any;
    onCancel?: () => void;
    modelUserKey?: string;
}

export const SolidMessageComposer = ({ type, modelSingularName, refetch, id, onCancel, modelUserKey }: SolidMessageComposerProps) => {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const { data: session, status } = useSession();
    const user = session?.user;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // const { data: viewLayoutData } = useGetSolidViewLayoutQuery(null);
    const [createChatterMessage, { isLoading, isSuccess, isError }] = useCreateChatterMessageMutation();

    const tempEmails = [
        "johndoe@gmal.com",
        "tempmail@gmail.com",
        "example@mail.com"
    ]

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() && selectedFiles.length === 0) return;

        try {
            const formData = new FormData();
            formData.append('messageType', "custom");
            formData.append('messageSubType', "custom");
            formData.append('messageBody', message);
            formData.append('coModelEntityId', id);
            formData.append('coModelName', modelSingularName);
            formData.append('userId', user?.id || 1);

            if (modelUserKey) formData.append('modelUserKey', modelUserKey);
            selectedFiles.forEach((file, index) => {
                formData.append(`messageAttachments`, file);
            });

            await createChatterMessage(formData).unwrap();
            setMessage('');
            setSelectedFiles([]);
        } catch (error) {
            console.error(ERROR_MESSAGES.FETCHING_MESSAGE, error);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            refetch()
        }
    }, [isSuccess]);

    const formatFileSize = (size: number) => {
        if (!size) return "";
        return size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(1)} MB`
            : `${(size / 1024).toFixed(1)} KB`;
    };

    return (
        <form className={styles.chatterMessageComposer} onSubmit={handleSubmit}>
            {/* {type === 'email' &&
                <div className='flex align-items-center gap-1 text-sm mb-2'>
                    <span className='font-bold'>To:</span>
                    <div className={styles.chatterEmails}>
                        {tempEmails.map((mail, index) => (
                            <span key={index}>
                                {mail}
                            </span>
                        ))}
                    </div>
                    <div className={`si si-sort-down-fill text-primary ${styles.emailTooltipIcon}`} style={{ fontSize: 8 }}>
                        <div className={styles.emailsTooltip}>
                            {tempEmails.map((mail, index) => (
                                <span key={index} className='text-color text-sm'>
                                    {mail}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            } */}
            <div className={`${styles.solidMessageWrapper} flex flex-column gap-2 w-full`}>
                <div className='flex align-items-center justify-content-between'>
                    <p className='form-field-label m-0'>
                        {type === 'email' ? 'Email Message' : 'Internal Note'}
                    </p>
                </div>
                <SolidTextarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={type === 'email' ? 'Send a message to followers' : 'Log an internal note.'}
                    className="w-full p-1"
                    rows={4}
                />
                <div className='flex align-items-center justify-content-between flex-wrap gap-2'>
                    <div className='flex align-items-center gap-2'>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            style={{ display: 'none' }}
                        />
                        <SolidButton
                            type="button"
                            variant="outline"
                            size="sm"
                            className="solid-icon-button"
                            leftIcon={<Paperclip size={14} />}
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Attach files"
                            title="Attach files"
                        />
                        <span className='text-xs text-color-secondary'>Attach file</span>
                    </div>
                    <div className='flex align-items-center gap-2'>
                        <SolidButton
                            type='submit'
                            size='sm'
                            className='gap-2 solid-purple-button'
                            variant='primary'
                            loading={isLoading}
                        >
                            {type === 'email' ? 'Send' : 'Log'}
                        </SolidButton>
                        <SolidButton
                            type='button'
                            size='sm'
                            variant='ghost'
                            onClick={() => {
                                setMessage('');
                                setSelectedFiles([]);
                                onCancel?.();
                            }}
                        >
                            Cancel
                        </SolidButton>
                    </div>
                </div>
            </div>
            {selectedFiles.length > 0 && (
                <div className={styles.chatterSelectedFiles}>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className={styles.chatterSelectedFileCard}>
                            <div className={styles.chatterSelectedFileIcon}>
                                <FileText size={16} />
                            </div>
                            <div className={styles.chatterSelectedFileMeta}>
                                <p className={styles.chatterSelectedFileName}>{file.name}</p>
                                <span className={styles.chatterSelectedFileSize}>{formatFileSize(file.size)}</span>
                            </div>
                            <SolidButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="solid-icon-button"
                                leftIcon={<X size={12} />}
                                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                aria-label={`Remove ${file.name}`}
                            />
                        </div>
                    ))}
                </div>
            )}
        </form>
    )
}
