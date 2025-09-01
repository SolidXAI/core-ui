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
    const containerRef = useRef<HTMLDivElement | null>(null);
    const hasScrolledOnceRef = useRef(false);

    // Create the RTK slices for this entity
    const aiInteractionApi = createSolidEntityApi('aiInteraction');
    const { useLazyGetSolidEntitiesQuery } = aiInteractionApi;
    const [triggerGetAiInteractions, { data: aiInteractionsData }] = useLazyGetSolidEntitiesQuery();

    // State used to show all aiInteractions in the system.
    // TODO: shall we create an interface to represent the aiInteraction model records from the server?
    const [interactions, setInteractions] = useState<AiInteraction[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isPaginating, setIsPaginating] = useState(false);
    const limit = 100;

    // Trigger a call to fetch all aiInteractions. 
    useEffect(() => {
        if (!threadId) return;

        const queryParams: any = {
            limit,
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
        if (!offset || offset === 0) return; // avoid double-fetching newest data

        const queryParams: any = {
            limit,
            offset, // ✅ this is your pagination offset
            filters: {
                threadId: {
                    $eq: threadId,
                },
            },
            sort: ['id:desc'], // maintain consistent sort
        };

        const queryString = qs.stringify(queryParams, { encodeValuesOnly: true });

        triggerGetAiInteractions(queryString);
    }, [offset, threadId]);

    useEffect(() => {
        const container = containerRef.current;
        if (!aiInteractionsData?.records || !container) return;

        const prevScrollHeight = container.scrollHeight;

        const sorted = [...aiInteractionsData.records].sort((a, b) => a.id - b.id);

        setInteractions((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const unique = sorted.filter((i) => !existingIds.has(i.id));

            if (offset === 0 && !isPaginating) {
                // 🆕 This is a fresh load (or update triggered by new interaction)
                return sorted; // replace everything
            }

            return isPaginating
                ? [...unique, ...prev] // prepend older interactions
                : [...prev, ...unique]; // append new interactions
        });

        if (aiInteractionsData.records.length < limit) {
            setHasMore(false);
        }

        // After pagination, restore scroll position
        if (isPaginating) {
            setTimeout(() => {
                const newScrollHeight = container.scrollHeight;
                container.scrollTop = newScrollHeight - prevScrollHeight;
                setIsPaginating(false);
            }, 0);
        }
    }, [aiInteractionsData])

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0 && hasMore) {
                setIsPaginating(true);
                setOffset((prev) => prev + limit);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore]);

    useEffect(() => {
        if (interactions.length === 0 || isPaginating) return;
        const scrollOptions: ScrollIntoViewOptions = {
            behavior: hasScrolledOnceRef.current ? 'smooth' : 'auto',
        };
        const timeout = setTimeout(() => {
            bottomRef.current?.scrollIntoView(scrollOptions);
            hasScrolledOnceRef.current = true;
        }, 50);

        return () => clearTimeout(timeout);
    }, [interactions, thinking]);

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
            ref={containerRef}
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