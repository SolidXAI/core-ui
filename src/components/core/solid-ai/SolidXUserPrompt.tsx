'use client'
import { Avatar } from 'primereact/avatar'
import styles from './SolidXAI.module.css'
export const SolidXUserPrompt = () => {
  return (
    <div className={`${styles.SolidXUserPromptWrapper}`}>
      <div className='flex align-items-start gap-3'>
        <div className={`mt-3 p-3 shadow-1 bg-bluegray-50  ${styles.SolidXUserPrompt}`}>
          <div>
            Generate a clean, efficient Python machine learning model for predicting house prices using linear regression with sample data.
          </div>
        </div>
        <div>
          <Avatar icon="pi pi-user" style={{ backgroundColor: '#2196F3', color: '#ffffff' }} shape="circle" />
        </div>
      </div>
    </div>
  )
}