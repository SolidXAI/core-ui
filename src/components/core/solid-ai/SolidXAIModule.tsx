'use client'

import { SolidXAIEmptyPlaceholder } from "./SolidXAIEmptyPlaceholder"
import { SolidXAIInputBox } from "./SolidXAIInputBox"
import { SolidXAIModuleHeader } from "./SolidXAIModuleHeader"
import { SolidXAIThreadWrapper } from "./SolidXAIThreadWrapper"

export const SolidXAIModule = () => {
  return (
    <div className='relative' style={{height: 'calc(100% - 45px)'}}>
      {/* <SolidXAIModuleHeader /> */}
      <SolidXAIThreadWrapper />
      {/* <SolidXAIEmptyPlaceholder /> */}
      <SolidXAIInputBox />
    </div>
  )
}