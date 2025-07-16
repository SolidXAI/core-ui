// 'use client'

// import { SolidXAIEmptyPlaceholder } from "./SolidXAIEmptyPlaceholder"
// import { SolidXAIModuleHeader } from "./SolidXAIModuleHeader"
// import { SolidXAIInputBox } from "./SolidXAIInputBox"
// import { SolidXAIThreadWrapper } from "./SolidXAIThreadWrapper"

// export const SolidXAIModule = () => {
//   return (
//     <div className='relative' style={{height: 'calc(100% - 45px)'}}>
//       {/* <SolidXAIModuleHeader /> */}
//       <SolidXAIThreadWrapper threadId="thread-1" />
//       {/* <SolidXAIEmptyPlaceholder /> */}
//       <SolidXAIInputBox />
//     </div>
//   )
// }

'use client';

import { SolidXAIEmptyPlaceholder } from "./SolidXAIEmptyPlaceholder";
import { SolidXAIInputBox } from "./SolidXAIInputBox";
import { SolidXAIThreadWrapper } from "./SolidXAIThreadWrapper";
import { useState } from 'react';

export const SolidXAIModule = () => {
  const [latestInteractionId, setLatestInteractionId] = useState<string | null>(null);

  return (
    <div className='relative' style={{ height: 'calc(100% - 45px)' }}>
      <SolidXAIThreadWrapper
        threadId="thread-1"
        latestInteractionId={latestInteractionId}
      />
      <SolidXAIInputBox onTriggerComplete={setLatestInteractionId} />
    </div>
  );
};