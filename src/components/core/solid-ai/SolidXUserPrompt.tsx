'use client'
import { Avatar } from 'primereact/avatar'
import styles from './SolidXAI.module.css'
import { AiInteraction } from '@/types/solid-core'

export const SolidXUserPrompt = ({ interaction }: { interaction: AiInteraction }) => {
  return (
    <div className={`${styles.SolidXUserPromptWrapper}`}>
      <div className='flex align-items-start gap-3'>
        <div className={`mt-3 p-3 shadow-1 bg-bluegray-50  ${styles.SolidXUserPrompt}`}>
          {/* <div>
            Generate a clean, efficient Python machine learning model for predicting house prices using linear regression with sample data.
          </div> */}
          <div> 
            <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {interaction.message}
            </div>
            { }
          </div>
        </div>
        <div>
          <Avatar icon="pi pi-user" style={{ backgroundColor: '#2196F3', color: '#ffffff' }} shape="circle" />
        </div>
      </div>
    </div>
  )
}