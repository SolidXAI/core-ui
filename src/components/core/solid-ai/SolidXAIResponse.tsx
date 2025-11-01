"use client"
import MarkdownViewer from "@/components/common/MarkdownViewer";
import { AiInteraction } from '@/types/solid-core';
import { Button } from 'primereact/button';
import styles from './SolidXAI.module.css';
import { SolidXAIIcon } from './SolidXAIIcon';
import moment from "moment";
import { SolidXAiJsonDisplay } from "./SolidXAiJsonDisplay";
import { SolidXAiMarkdownDisplay } from "./SolidXAiMarkdownDisplay";
import { SolidXAiPlainTextDisplay } from "./SolidXAiPlainTextDisplay";



export const SolidXAIResponse = ({ interaction }: { interaction: AiInteraction }) => {
    const renderContent = () => {

        switch (interaction.contentType) {
            case 'json':
                return (
                    <SolidXAiJsonDisplay interaction={interaction} />
                )
            case 'markdown':
                return (
                    <SolidXAiMarkdownDisplay interaction={interaction} />
                )
            case 'plain_text':
            default:
                return <SolidXAiPlainTextDisplay interaction={interaction} />
        }
    }
    const timestamp = moment(interaction.createdAt).format('HH:mm')
    return (
        <div className={`${styles.SolidXAIResponseWrapper}`}>
            {interaction.status !== "pending" &&
                <div className='flex align-items-start gap-3'>
                    <div className="text-center">
                        <Button icon={<SolidXAIIcon />} size="small" raised text rounded onClick={() => window.open(`/admin/core/solid-core/ai-interaction/form/${interaction.id}?viewMode=view`, '_blank')} />
                        <div className=" text-xs text-black-400 mt-3">
                            {timestamp}
                        </div>
                    </div>
                    <div className={`mt-3`} style={{ width: '100%' }}>
                        {renderContent()}
                    </div>

                </div>
            }
        </div>
    )
}
