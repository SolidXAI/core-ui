"use client";

import React from "react";

interface PasswordHelperTextProps {
  text?: string; // password complexity description (from env or API)
}

export const SolidPasswordHelperText: React.FC<PasswordHelperTextProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="mt-4 text-sm grid">
      <div className="col-12">
        <div className="grid">
          {text.split("\\n").map((line, idx) => (
            <div key={idx} className="col-6 pt-0">
              <div className="flex gap-2">
                <span>•</span>
                <span>{line}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
