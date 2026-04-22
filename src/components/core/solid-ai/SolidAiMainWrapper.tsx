

// import { SolidXAiIframe } from "../common/SolidXAiIframe";
import { SolidAiChat } from "./SolidAiChat";

export const SolidAiMainWrapper = ({ mcpUrl }: any) => {
    return (
        // <SolidXAiIframe url={mcpUrl} />
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 70px)", minHeight: 0 }}>
            <SolidAiChat />
        </div>
    );
};