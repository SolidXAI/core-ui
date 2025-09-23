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
    const [sending, setSending] = useState(false);
    const [triggerMcpClientJob, { isLoading }] = useTriggerMcpClientJobMutation();

    const handleSend = async () => {
        console.log(`handleSend invoked...`);

        if (!prompt.trim()) return;
        if (sending || !prompt.trim()) return;
        setSending(true);
        try {
            const response = await triggerMcpClientJob({ prompt }).unwrap();
            if (response?.data && onTriggerComplete) {
                console.log(`Invoking onTriggerComplete with data ${response.data.queueMessageId}`);
                onTriggerComplete(response.data.queueMessageId);
            }
            setPrompt('');
        } catch (err) {
            console.error("Failed to trigger MCP client job", err);
        } finally {
            setSending(false);
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
                <Button icon="pi pi-send" rounded raised size='small' onClick={handleSend} disabled={isLoading || sending} />
            </div>
        </div>
    );
};