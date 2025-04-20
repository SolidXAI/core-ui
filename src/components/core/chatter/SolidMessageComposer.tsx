"use client"
import { InputText } from 'primereact/inputtext'
import styles from './chatter.module.css'
import { Button } from 'primereact/button'
import { useCreateChatterMessageMutation } from '@/redux/api/solidChatterMessageApi'
import { useEffect, useState } from 'react'
import { useGetSolidViewLayoutQuery } from '@/redux/api/solidViewApi'
import { useSelector } from 'react-redux'

export const SolidMessageComposer = ({ type, solidFormViewMetaData, refetch }: { type?: string, solidFormViewMetaData?: any, refetch?: any }) => {
    const [message, setMessage] = useState('');
    const { user } = useSelector((state: any) => state.auth);

    // const { data: viewLayoutData } = useGetSolidViewLayoutQuery(null);
    const [createChatterMessage, { isLoading, isSuccess, isError }] = useCreateChatterMessageMutation();

    const tempEmails = [
        "johndoe@gmal.com",
        "tempmail@gmail.com",
        "example@mail.com"
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            const payload = {
                messageType: "custom",
                messageSubType: "audit_insert",
                messageBody: message,
                coModelEntityId: solidFormViewMetaData?.data?.solidView?.model?.id,
                coModelName: solidFormViewMetaData?.data?.solidView?.model?.singularName,
                userId: user?.user?.id
            };
            console.log(payload, user.user.id);
            await createChatterMessage(payload).unwrap();
            setMessage('');
        } catch (error) {
            console.error('Error creating message:', error);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            refetch()
        }
    }, [isSuccess]);

    return (
        <form className={styles.chatterMessageComposer} onSubmit={handleSubmit}>
            {type === 'email' &&
                <div className='flex align-items-center gap-1 text-sm mb-2'>
                    <span className='font-bold'>To:</span>
                    <div className={styles.chatterEmails}>
                        {tempEmails.map((mail, index) => (
                            <span key={index}>
                                {mail}
                            </span>
                        ))}
                    </div>
                    <div className={`pi pi-sort-down-fill text-primary ${styles.emailTooltipIcon}`} style={{ fontSize: 8 }}>
                        <div className={styles.emailsTooltip}>
                            {tempEmails.map((mail, index) => (
                                <span key={index} className='text-color text-sm'>
                                    {mail}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            }
            <InputText
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={type === 'email' ? 'Send a message to followers' : 'Log an internal note...'}
                className={`p-inputtext-sm w-full p-2 ${styles.chatterMessageInput}`}
            />
            <div className='mt-3 flex align-items-center gap-2'>
                <Button
                    label={type === 'email' ? 'Send' : 'Log'}
                    size='small'
                    type='submit'
                    loading={isLoading}
                />
                <Button
                    label='Cancel'
                    size='small'
                    type='button'
                    text
                    severity='contrast'
                    onClick={() => setMessage('')}
                />
            </div>
        </form>
    )
}