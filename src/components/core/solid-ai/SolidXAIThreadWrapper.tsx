"use client"
import qs from "qs";
import { SolidXAIResponse } from './SolidXAIResponse'
import { SolidXAIThinking } from './SolidXAIThinking'
import { SolidXUserPrompt } from './SolidXUserPrompt'
import styles from './SolidXAI.module.css'
import { useEffect, useRef, useState } from 'react'
import { createSolidEntityApi } from '@/redux/api/solidEntityApi'
import { AiInteraction } from '@/types/solid-core'

type SolidXAIThreadWrapperProps = {
    threadId: string;
    latestInteractionId?: string | null;
    thinking?: boolean;
};

export const SolidXAIThreadWrapper = ({ threadId, latestInteractionId, thinking }: SolidXAIThreadWrapperProps) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);

    // Create the RTK slices for this entity
    const aiInteractionApi = createSolidEntityApi('aiInteraction');
    const { useLazyGetSolidEntitiesQuery } = aiInteractionApi;
    const [triggerGetAiInteractions, { data: aiInteractionsData }] = useLazyGetSolidEntitiesQuery();

    // State used to show all aiInteractions in the system.
    // TODO: shall we create an interface to represent the aiInteraction model records from the server?
    const [interactions, setInteractions] = useState<AiInteraction[]>([]);

    useEffect(() => {
        if (aiInteractionsData?.records) {
            const sorted = [...aiInteractionsData.records].sort(
                (a, b) => a.id - b.id
            );
            setInteractions(sorted);
        }
    }, [aiInteractionsData]);

    // Trigger a call to fetch all aiInteractions. 
    useEffect(() => {
        const queryParams: any = {
            limit: 100,
            offset: 0,
            filters: {
                'threadId': {
                    '$eq': threadId
                }
            },
            // Ensures first interaction comes first
            sort: ['id:desc'],
        };

        const queryString = qs.stringify(queryParams, { encodeValuesOnly: true });
        triggerGetAiInteractions(queryString);
    }, [threadId, latestInteractionId, thinking]);

    useEffect(() => {
        if (interactions.length === 0) return;

        const timeout = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 50); // small delay to ensure DOM is ready

        return () => clearTimeout(timeout);
    }, [interactions, thinking]);


    // useEffect(() => {
    //     if (containerRef.current) {
    //          containerRef.current.scrollTo({
    //         top: containerRef.current.scrollHeight,
    //         behavior: 'smooth',
    //     });
    //     }
    // }, [interactions, thinking]);

    // return (
    //     <div
    //         ref={containerRef}
    //         className={`px-3 pt-3 flex flex-column gap-3 overflow-y-auto overflow-x-hidden ${styles.SolidXAIThreadWrapper}`}
    //     >
    //         <SolidXUserPrompt />
    //         <SolidXAIResponse />
    //         <SolidXAIThinking />
    //     </div>
    // )

    return (
        <div
            className={`px-3 pt-3 flex flex-column gap-3 overflow-y-auto overflow-x-hidden ${styles.SolidXAIThreadWrapper}`}
        >
            {interactions.map((interaction) => {
                const { role } = interaction;

                switch (role) {
                    case 'human':
                        return <SolidXUserPrompt key={interaction.id} interaction={interaction} />;
                    case 'gen-ai':
                        return <SolidXAIResponse key={interaction.id} interaction={interaction} />;
                    default:
                        return null;
                }
            })}

            {thinking && <SolidXAIThinking />}
            <div ref={bottomRef} />
        </div>
    );
}