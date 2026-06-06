import React from "react";
import { env } from "../../../adapters/env";

interface PasswordHelperTextProps {
  text?: any;
}

export const SolidPasswordHelperText: React.FC<PasswordHelperTextProps> = ({ text }) => {
  const envPasswordHelperText = env("NEXT_PUBLIC_PASSWORD_COMPLEXITY_DESC") ?? "";

  if (!text && !envPasswordHelperText) return null;

  return (
    <div className="mt-6 text-sm flex flex-wrap">
      {text ?
        <div dangerouslySetInnerHTML={{ __html: text }}></div>
        :
        <div className="w-full">
          <div className="flex flex-wrap">
            {envPasswordHelperText.split("\\n").map((line, idx) => (
              <div key={idx} className="w-1/2 pt-0">
                <div className="flex gap-2">
                  <span>•</span>
                  <span>{line}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    </div>
  );
};
