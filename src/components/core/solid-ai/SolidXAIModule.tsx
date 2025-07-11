'use client'

import { SolidXAIEmptyPlaceholder } from "./SolidXAIEmptyPlaceholder"
import { SolidXAIInputBox } from "./SolidXAIInputBox"
import { SolidXAIModuleHeader } from "./SolidXAIModuleHeader"
import { SolidXAIThreadWrapper } from "./SolidXAIThreadWrapper"

export const SolidXAIModule = () => {
  return (
    <div className='h-full relative'>
      <SolidXAIModuleHeader />
      {/* <SolidXAIThreadWrapper /> */}
      <SolidXAIEmptyPlaceholder />
      <SolidXAIInputBox />
    </div>
  )
}