'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type MarkdownViewerProps = {
  data: string;
};

// Properly typed code renderer
const CodeBlock: any = ({ inline, className, children, ...props }:any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] ?? '';
  const codeString = String(children).replace(/\n$/, '');

  if (inline) {
    return (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <button
        className="absolute right-2 top-2 px-2 py-1 text-xs rounded bg-white text-black  transition"
        style={{ cursor: 'pointer',right:0 }}
        onClick={() => navigator.clipboard.writeText(codeString)}
      >
        Copy
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        PreTag="div"
        customStyle={{
          borderRadius: '0.5rem',
          padding: '1rem',
          fontSize: '0.85rem',
          background: '#282c34',
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ data }) => {
  return (
    <ReactMarkdown
      className="markdown-view space-y-4"
      components={{
        code: CodeBlock,
      }}
    >
      {data}
    </ReactMarkdown>
  );
};

export default MarkdownViewer;
