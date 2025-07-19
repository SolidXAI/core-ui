'use client';
import qs from "qs";
import { SolidXAIEmptyPlaceholder } from "./SolidXAIEmptyPlaceholder";
import { createSolidEntityApi } from '@/redux/api/solidEntityApi'

import { SolidXAIInputBox } from "./SolidXAIInputBox";
import { SolidXAIThreadWrapper } from "./SolidXAIThreadWrapper";
import { useEffect, useState } from 'react';

export const SolidXAIModule = () => {
  const [latestInteractionId, setLatestInteractionId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  const mqMessageApi = createSolidEntityApi("mqMessage");
  const {
    useGetSolidEntitiesQuery: useGetMqMessageQuery,
    useLazyGetSolidEntitiesQuery: useLazyGetMqMessageQuery,
  } = mqMessageApi;

  const [getMqMessageStatus, {
    data: mqMessageData,
    error: mqMessageDataError,
    isLoading: mqMessageDataIsLoading,
    isError: mqMessageDataIsError
  }] = useLazyGetMqMessageQuery();

  const fetchMqMessageStatus = async (retries = 50, delay = 500, messageId: string): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const query = {
          filters: {
            messageId: {
              $eq: messageId
            }
          }
        };
        const queryString = qs.stringify(query, {
          encodeValuesOnly: true,
        });
        const res = await getMqMessageStatus(queryString)
        if (res.isSuccess === true) {
          if (res.data.records.length > 0) {
            const messageStage = res.data.records[0].stage;
            console.log("messageStatus: ", messageStage);
            if (messageStage === "succeeded") {
              return true
            }
            if (messageStage === "failed") {
              return false
            }
          }
        }
      } catch (e) {
        // ignore and retry
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return false;
  };

  useEffect(() => {
    if (!latestInteractionId) return;

    setThinking(true);

    (async () => {
      try {
        const completed = await fetchMqMessageStatus(30, 500, latestInteractionId);
        console.log("MQ message completed status:", completed);
      } catch (err) {
        console.error("Failed to fetch MQ message status:", err);
      } finally {
        setThinking(false);
      }
    })();

  }, [latestInteractionId]);

  return (
    <div className='relative' style={{ height: 'calc(100% - 45px)' }}>
      <SolidXAIThreadWrapper
        threadId="thread-1"
        latestInteractionId={latestInteractionId}
        thinking={thinking}
      />
      <SolidXAIInputBox onTriggerComplete={setLatestInteractionId} />
    </div>
  );
};