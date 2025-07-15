"use client"
import { SolidXAIResponse } from './SolidXAIResponse'
import { SolidXAIThinking } from './SolidXAIThinking'
import { SolidXUserPrompt } from './SolidXUserPrompt'
import styles from './SolidXAI.module.css'
import { useEffect, useRef } from 'react'

export const SolidXAIThreadWrapper = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    });
    return (
        <div
            ref={containerRef}
            className={`px-3 pt-3 flex flex-column gap-3 overflow-y-auto overflow-x-hidden ${styles.SolidXAIThreadWrapper}`}
        >
            <SolidXUserPrompt />
            <SolidXAIResponse />
            <SolidXAIThinking />
        </div>
    )
}