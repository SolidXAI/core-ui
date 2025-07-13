"use client"
import styles from './SolidXAI.module.css'
import { SolidXAIIcon } from './SolidXAIIcon'
export const SolidXAIModuleHeader = () => {
    return (
        <div className={`flex align-items-center justify-content-between p-3 secondary-border-bottom ${styles.SolidXAIHeader}`}>
            <div className='flex align-items-center gap-3'>
                <SolidXAIIcon size={29} /> <div className='text-lg font-medium solid-primary-black-text'>SolidX AI</div>
            </div>
        </div>
    )
}