'use client';

import { useSelector } from "react-redux";
import { SolidXAiIframe } from "../common/SolidXAiIframe";
export const SolidAiMainWrapper = ({ showHeader, inListView }: any) => {
    const userId = useSelector((state: any) => state.auth?.user?.user?.id);

    return (
        <div className='relative' style={{ height: inListView ? '100%' : 'calc(100% - 45px)', backgroundColor: 'var(--surface-section)' }}>
            {/* <SolidXAIModule></SolidXAIModule> */}
            <SolidXAiIframe url={`${process.env.MCP_SERVER_URL}/static/frontend.html?solidx-mcp-api-key=${process.env.MCP_API_KEY}&solidx-user-id=${userId}&solidx-show-header=${showHeader}&solidx-in-list-view=${inListView}`} />

        </div>
    );
};