"use client"
import { Button } from 'primereact/button'
import styles from './SolidXAI.module.css'
import { SolidXAIIcon } from './SolidXAIIcon'
import { AiInteraction } from '@/types/solid-core'


export const SolidXAIResponse = ({ interaction }: { interaction: AiInteraction }) => {
    return (
        <div className={`${styles.SolidXAIResponseWrapper}`}>
            <div className='flex align-items-start gap-3'>
                <div>
                    <Button icon={<SolidXAIIcon />} size="small" raised text rounded />
                </div>
                <div className={`mt-3 p-3 ${styles.SolidXAIResponse}`}>
                    {/* <div>
                        A machine learning model for predicting house prices using linear regression has been generated and is ready for training with your data.
                    </div> */}
                    <div>
                        {interaction.message}
                    </div>
                </div>
            </div>
        </div>
    )
}