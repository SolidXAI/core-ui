"use client"
import styles from './SolidXAI.module.css'

export const SolidXAIEmptyPlaceholder = () => {
    return (
        <div className={`${styles.SolidXAIEmptyPlaceholder} px-5 w-full`}>
            <div className='font-medium text-lg solid-primary-black-text text-center'>Hey John, What can i help you?</div>
            {/* <div className={`${styles.SolidXAIEmptyPlaceholderBg}`}></div> */}
        </div>
    )
}