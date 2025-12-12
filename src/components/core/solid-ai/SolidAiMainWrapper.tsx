'use client';

import { useSelector } from "react-redux";
import { SolidXAiIframe } from "../common/SolidXAiIframe";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
export const SolidAiMainWrapper = ({ showHeader, inListView }: any) => {
    const session: any = useSession()
    const [userId, setUserId] = useState();
    useEffect(() => {
        if (session?.data?.user?.user?.id) {
            setUserId(session?.data?.user?.user?.id)
        }
    }, [session])

    return (
        <SolidXAiIframe url={`${process.env.MCP_SERVER_URL}/static/frontend.html?solidx-mcp-api-key=${process.env.MCP_API_KEY}&solidx-user-id=${userId}&solidx-show-header=${showHeader ? "true" : false}&solidx-in-list-view=${inListView}`} />
        //  <SolidXAIModule></SolidXAIModule> 

    );
};