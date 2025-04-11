import { InputText } from 'primereact/inputtext'
import styles from './chatter.module.css'
import { Button } from 'primereact/button'
export const SolidMessageComposer = ({ type }: { type?: string }) => {
    const tempEmails = [
        "johndoe@gmal.com",
        "tempmail@gmail.com",
        "example@mail.com"
    ]
    return (
        <form className={styles.chatterMessageComposer}>
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
                placeholder={type === 'email' ? 'Send a message to followers' : 'Log an internal note...'}
                className={`p-inputtext-sm w-full p-2 ${styles.chatterMessageInput}`}
            />
            <div className='mt-3 flex align-items-center gap-2'>
                <Button
                    label={type === 'email' ? 'Send' : 'Log'}
                    size='small'
                    type='submit'
                />
                <Button
                    label='Cancel'
                    size='small'
                    type='button'
                    text
                    severity='contrast'
                />
            </div>
        </form>
    )
}