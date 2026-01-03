'use client';

import { SolidXAiIframe } from "../common/SolidXAiIframe";
export const SolidAiMainWrapper = ({ mcpUrl }: any) => {
    return (
        <SolidXAiIframe url={mcpUrl} />
    );
};