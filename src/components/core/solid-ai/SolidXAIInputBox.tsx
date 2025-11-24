"use client";
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import styles from './SolidXAI.module.css';
import { useState } from 'react';
import { useTriggerMcpClientJobMutation } from '@/redux/api/aiInteractionApi';
import { usePathname } from 'next/navigation';
import { ERROR_MESSAGES } from '@/constants/error-messages';
import axios from 'axios';

interface SolidXAIInputBoxProps {
    onTriggerComplete?: (uuid: string) => void;
    threadId?: string;
    userId?: string;
}

export const SolidXAIInputBox = ({ onTriggerComplete, threadId,userId }: SolidXAIInputBoxProps) => {
    const pathName = usePathname()
    const [prompt, setPrompt] = useState('');
    const [sending, setSending] = useState(false);
    // const [triggerMcpClientJob, { isLoading }] = useTriggerMcpClientJobMutation();
    const [isLoading, setIsLoading] = useState(false);
    const handleSend = async () => {
        console.log(`handleSend invoked...`);

        if (!prompt.trim()) return;
        if (sending || !prompt.trim()) return;
        setSending(true);
        try {

            // split by "/" and filter out empty strings
            const segments = pathName.split("/").filter(Boolean);

            // pick the 3rd segment (index 2, since it's 0-based)
            const moduleName = segments[2];

            // const response = await triggerMcpClientJob({ prompt,moduleName }).unwrap();
            // ---- AXIOS INTEGRATION START ----
            const payload = {
                prompt,
                moduleName,   // keep this if backend needs it
            };
            setIsLoading(true);

            const response = await axios.post(
                `${process.env.MCP_SERVER_URL}/ai-interactions`,
                payload,
                {
                    headers: {
                        "solidx-mcp-api-key": process.env.MCP_API_KEY,
                        "solidx-user-id": userId,
                        "solidx-mcp-thread-id": threadId,
                        "Content-Type": "application/json",
                    },
                    maxBodyLength: Infinity,
                }
            );
            console.log("response", response);
            if (response?.data.success == true && onTriggerComplete) {
                setIsLoading(false);
                console.log(`Invoking onTriggerComplete with data ${response?.data?.data?.aiInteractionId}`);
                onTriggerComplete(response?.data?.data?.aiInteractionId);
            }
            setPrompt('');
        } catch (err) {
            console.error(ERROR_MESSAGES.FAILED_TRIGGER_MCP_CLIENT_JOB, err);
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