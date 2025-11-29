'use client';
import qs from "qs";
import { SolidXAIEmptyPlaceholder } from "./SolidXAIEmptyPlaceholder";
import { createSolidEntityApi } from '@/redux/api/solidEntityApi'
import { SolidXAIInputBox } from "./SolidXAIInputBox";
import { SolidXAIThreadWrapper } from "./SolidXAIThreadWrapper";
import { useEffect, useState } from 'react';
import { SolidXAIModuleHeader } from "./SolidXAIModuleHeader";
import { useSelector } from "react-redux";
import { ERROR_MESSAGES } from "@/constants/error-messages";
import axios from "axios";
export const SolidXAIModule = () => {
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
  const fetchMqMessageStatus = async (retries = 50, delay = 500, interactionId: string): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await axios.get(
          `${process.env.MCP_SERVER_URL}/ai-interactions/${interactionId}`,
          {
            headers: {
              "solidx-mcp-api-key": process.env.MCP_API_KEY,
            },
            maxBodyLength: Infinity,
          }
        );
        // const res = await getMqMessageStatus(queryString)
        if (res.data.success === true) {
          const messageStage = res.data.data.status;
          console.log("messageStatus: ", messageStage);
          // if (messageStage === "pending" ||messageStage === "mcp_tool_generating" || messageStage === "mcp_tool_failed" || messageStage === "mcp_client_failed") {
          //   return true
          // }
          if (messageStage === "mcp_tool_generated" || messageStage === "mcp_tool_failed" || messageStage === "mcp_client_failed") {
            return true
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
        console.error(ERROR_MESSAGES.FAILED_FETCH_MESSAGE, err);
      } finally {
        setThinking(false);
      }
    })();
  }, [latestInteractionId]);
  return (
    <>
      <SolidXAIModuleHeader />
      <SolidXAIThreadWrapper
        threadId={`thread-${userId}`}
        latestInteractionId={latestInteractionId}
        thinking={thinking}
      />
      <SolidXAIInputBox onTriggerComplete={setLatestInteractionId} threadId={`thread-${userId}`} userId={userId} />
    </>
  );
};