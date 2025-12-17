'use client'
import { Avatar } from 'primereact/avatar'
import styles from './SolidXAI.module.css'
import { AiInteraction } from '@/types/solid-core'
import moment from 'moment'

export const SolidXUserPrompt = ({ interaction }: { interaction: AiInteraction }) => {
  const timestamp = moment(interaction.created_at).format('HH:mm')

  return (
    <div className={`${styles.SolidXUserPromptWrapper} flex justify-content-end`}>
      <div className='flex align-items-start gap-3'>
        <div className={`mt-3 p-3 shadow-1 bg-bluegray-50  ${styles.SolidXUserPrompt} relative`}>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {interaction.message}
          </div>
        </div>
        <div className='text-center'>
          <Avatar icon="pi pi-user" style={{ backgroundColor: '#2196F3', color: '#ffffff' }} shape="circle" />
          <div className="text-xs text-black-400 mt-3">
            {timestamp}
          </div>
        </div>
      </div>
    </div>
  )
}
