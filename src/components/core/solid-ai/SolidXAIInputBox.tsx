"use client";
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import styles from './SolidXAI.module.css';
import { useState } from 'react';
import { useTriggerMcpClientJobMutation } from '@/redux/api/aiInteractionApi';

interface SolidXAIInputBoxProps {
    onTriggerComplete?: (uuid: string) => void;
}

export const SolidXAIInputBox = ({ onTriggerComplete }: SolidXAIInputBoxProps) => {
    const [prompt, setPrompt] = useState('');
    const [triggerMcpClientJob, { isLoading }] = useTriggerMcpClientJobMutation();

    const handleSend = async () => {
        if (!prompt.trim()) return;
        try {
            const response = await triggerMcpClientJob({ prompt }).unwrap();
            if (response?.data && onTriggerComplete) {
                onTriggerComplete(response.data);
            }
            setPrompt('');
        } catch (err) {
            console.error("Failed to trigger MCP client job", err);
        }
    };

    return (
        <div className={styles.SolidXAIInputWrapper}>
            <InputTextarea
                placeholder='Ask AI Anything'
                rows={3}
                className={styles.SolidAIInput}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
            />
            <div className='flex justify-content-end mb-3 mr-3'>
                <Button icon="pi pi-send" rounded raised size='small' onClick={handleSend} disabled={isLoading} />
            </div>
        </div>
    );
};