'use client';
import qs from "qs";
import { SolidXAIEmptyPlaceholder } from "./SolidXAIEmptyPlaceholder";
import { createSolidEntityApi } from '@/redux/api/solidEntityApi'

import { SolidXAIInputBox } from "./SolidXAIInputBox";
import { SolidXAIThreadWrapper } from "./SolidXAIThreadWrapper";
import { useEffect, useState } from 'react';
import { SolidXAIModuleHeader } from "./SolidXAIModuleHeader";
import { useSelector } from "react-redux";

export const SolidXAIModule = ({ showHeader, inListView }: any) => {
  const [latestInteractionId, setLatestInteractionId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const userId = useSelector((state: any) => state.auth?.user?.user?.id);

  // TODO: START REFACTORING - reusable code alert
  // TODO: This method can be refactored out into a separate file... 
  // TODO: It is present in a commented form in this file src/components/core/extension/solid-core/moduleMetadata/list/GenerateModuleCodeRowAction.tsx
  // TODO: It is present in a commented form in this file src/components/core/extension/solid-core/modelMetadata/list/GenerateModelCodeRowAction.tsx

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
        console.log(`Attempting to fetch mq message status with query string: ${queryString}`);
        
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
  // TODO: END REFACTORING - reusable code alert

  useEffect(() => {
    if (!latestInteractionId) return;

    setThinking(true);

    (async () => {
      try {
        // TODO: If you encounter SolidX AI Interactions that can go on longer than 30 X 500 ms then you can increase the frequency & duration here...
        // TODO: If we exceed timeout, show a little refresh icon or implement scroll up to refresh...
        const completed = await fetchMqMessageStatus(120, 500, latestInteractionId);
        console.log("MQ message completed status:", completed);
      } catch (err) {
        console.error("Failed to fetch MQ message status:", err);
      } finally {
        setThinking(false);
      }
    })();

  }, [latestInteractionId]);

  return (
    <div className='relative' style={{ height: inListView ? '100%' : 'calc(100% - 45px)', backgroundColor: 'var(--surface-section)' }}>
      {showHeader &&
        <SolidXAIModuleHeader />
      }
      <SolidXAIThreadWrapper
        threadId={`thread-${userId}`}
        latestInteractionId={latestInteractionId}
        thinking={thinking}
      />
      <SolidXAIInputBox onTriggerComplete={setLatestInteractionId} />
    </div>
  );
};