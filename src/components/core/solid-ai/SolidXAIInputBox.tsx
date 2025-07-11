"use client"
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import styles from './SolidXAI.module.css'

export const SolidXAIInputBox = () => {
    return (
        <div className={styles.SolidXAIInputWrapper}>
            <InputTextarea placeholder='Ask AI Anything' rows={3} className={styles.SolidAIInput} />
            <div className='flex justify-content-end mb-3 mr-3'>
                <Button icon="pi pi-send" rounded raised aria-label="Filter" size='small'/>
            </div>
        </div>
    )
}