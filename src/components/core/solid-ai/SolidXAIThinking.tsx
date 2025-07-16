"use client"

import { SolidXAIIcon } from "./SolidXAIIcon"
import { Button } from "primereact/button"
import styles from './SolidXAI.module.css'

export const SolidXAIThinking = () => {
    return (
        <div className="flex align-items-center gap-3">
            <Button icon={<SolidXAIIcon />} size="small" raised text rounded />
            <div className={styles.SolidXAIThinkingAnimation}></div>
        </div>
    )
}