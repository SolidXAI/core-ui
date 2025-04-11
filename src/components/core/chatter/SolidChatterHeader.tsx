import React from 'react'
import { SolidMessageComposer } from './SolidMessageComposer'
import { Button } from 'primereact/button'
import styles from './chatter.module.css'
interface Props {
    activeTab: any,
    handleTabClick: any,
    visibleBox: any
}
export const SolidChatterHeader = (props: Props) => {
    const { activeTab, visibleBox, handleTabClick } = props;
    return (
        <div className={styles.chatterTitle}>
            <div className='flex justify-content-between align-items-center'>
                <div className="form-wrapper-title">
                    Activity
                </div>
                <div className='flex align-items-center gap-2'>
                    <Button
                        label="Send Message"
                        size="small"
                        type="button"
                        onClick={() => handleTabClick('email-message')}
                        {...(activeTab !== 'email-message' && {
                            severity: 'secondary',
                            outlined: true,
                        })}
                    />
                    <Button
                        label="Log Note"
                        size="small"
                        type="button"
                        onClick={() => handleTabClick('log')}
                        {...(activeTab !== 'log' ? {
                            severity: 'secondary',
                            outlined: true,
                        } :
                            {
                                outlined: true,
                            }
                        )}
                    />
                    <Button
                        icon="pi pi-search"
                        text
                        size='small'
                        severity="secondary"
                        aria-label="Search"
                        style={{ width: 20 }}
                    />
                </div>
            </div>
            {visibleBox &&
                <div className='mt-4'>
                    {visibleBox === "email-message" &&
                        <SolidMessageComposer type={"email"} />
                    }

                    {visibleBox === "log" &&
                        <SolidMessageComposer />
                    }
                </div>
            }
        </div>
    )
}