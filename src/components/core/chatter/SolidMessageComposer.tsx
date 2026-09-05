import './solid-chatter.css';import { usePostChatterMessageMutation } from '../../../redux/api/solidChatterMessageApi'
import { useEffect, useState, useRef } from 'react'
import { ERROR_MESSAGES } from '../../../constants/error-messages'
import { SolidButton, SolidTextarea } from '../../shad-cn-ui'
import { FileText, Paperclip, X } from 'lucide-react'
import { buildMessageBodyWithMentionTokens } from './chatterMentions'
import { useChatterMentions } from './useChatterMentions'
import { SolidChatterMentionMenu } from './SolidChatterMentionMenu'

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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // const { data: viewLayoutData } = useGetSolidViewLayoutQuery(null);
    const [postChatterMessage, { isLoading, isSuccess }] = usePostChatterMessageMutation();
    const {
        mentions,
        mentionRange,
        mentionSuggestions,
        activeMentionIndex,
        isFetchingMentionUsers,
        handleMentionTextChange,
        handleMentionKeyDown,
        handleMentionKeyUp,
        handleMentionClick,
        handleSelectMention,
        resetMentions,
    } = useChatterMentions({
        value: message,
        onChange: setMessage,
        textareaRef,
    });

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
            const messageBody = buildMessageBodyWithMentionTokens(message, mentions);
            const formData = new FormData();
            formData.append('messageSubType', "note");
            formData.append('messageBody', messageBody.body);
            formData.append('coModelEntityId', id);
            formData.append('coModelName', modelSingularName);
            if (messageBody.mentions.length > 0) {
                formData.append('messageBodyMentions', JSON.stringify(messageBody.mentions));
            }

            if (modelUserKey) formData.append('modelUserKey', modelUserKey);
            selectedFiles.forEach((file) => {
                formData.append(`messageAttachments`, file);
            });

            await postChatterMessage(formData).unwrap();
            setMessage('');
            setSelectedFiles([]);
            resetMentions();
            onCancel?.();
        } catch (error) {
            console.error(ERROR_MESSAGES.FETCHING_MESSAGE, error);
        }
    };

    const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        handleMentionKeyDown(event);
        if (event.defaultPrevented) return;

        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    };

    const resetComposer = () => {
        setMessage('');
        setSelectedFiles([]);
        resetMentions();
        onCancel?.();
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
        <form className={"solid-chatter-message-composer"} onSubmit={handleSubmit}>
            {/* {type === 'email' &&
                <div className='mb-2 flex items-center gap-1 text-sm'>
                    <span className='font-bold'>To:</span>
                    <div className={"solid-chatter-emails"}>
                        {tempEmails.map((mail, index) => (
                            <span key={index}>
                                {mail}
                            </span>
                        ))}
                    </div>
                    <div className={`si si-sort-down-fill text-[var(--primary-color)] ${"solid-chatter-email-tooltip-icon"}`} style={{ fontSize: 8 }}>
                        <div className={"solid-chatter-emails-tooltip"}>
                            {tempEmails.map((mail, index) => (
                                <span key={index} className='text-color text-sm'>
                                    {mail}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            } */}
            <div className={`${"solid-chatter-message-wrapper"} flex flex-col gap-2 w-full`}>
                <div className='flex items-center justify-between'>
                    <p className='form-field-label m-0'>
                        {type === 'email' ? 'Email Message' : 'Internal Note'}
                    </p>
                </div>
                <SolidTextarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleMentionTextChange}
                    onKeyDown={handleComposerKeyDown}
                    onKeyUp={handleMentionKeyUp}
                    onClick={handleMentionClick}
                    placeholder={type === 'email' ? 'Send a message to followers' : 'Log an internal note.'}
                    className="w-full p-2"
                    rows={4}
                />
                <p className={"solid-chatter-composer-help"}>
                    Type @ to mention a user. Press Ctrl+Enter to save.
                </p>
                {mentionRange && (
                    <SolidChatterMentionMenu
                        isLoading={isFetchingMentionUsers}
                        users={mentionSuggestions}
                        activeIndex={activeMentionIndex}
                        onSelect={handleSelectMention}
                    />
                )}
                <div className='flex items-center justify-between flex-wrap gap-2'>
                    <div className='flex items-center gap-2'>
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
                    <div className='flex items-center gap-2'>
                        <SolidButton
                            type='submit'
                            size='sm'
                            className='gap-2 solid-purple-button'
                            variant='primary'
                            loading={isLoading}
                            disabled={!message.trim() && selectedFiles.length === 0}
                        >
                            {type === 'email' ? 'Send' : 'Log'}
                        </SolidButton>
                        <SolidButton
                            type='button'
                            size='sm'
                            variant='ghost'
                            onClick={resetComposer}
                        >
                            Cancel
                        </SolidButton>
                    </div>
                </div>
            </div>
            {selectedFiles.length > 0 && (
                <div className={"solid-chatter-selected-files"}>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className={"solid-chatter-selected-file-card"}>
                            <div className={"solid-chatter-selected-file-icon"}>
                                <FileText size={16} />
                            </div>
                            <div className={"solid-chatter-selected-file-meta"}>
                                <p className={"solid-chatter-selected-file-name"}>{file.name}</p>
                                <span className={"solid-chatter-selected-file-size"}>{formatFileSize(file.size)}</span>
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
