'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const MarkdownViewer = ({ data }: any) => {
  const [markdown, setMarkdown] = useState(data);

  return (
    <>
      <ReactMarkdown className="markdown-view">{markdown}</ReactMarkdown>
    </>
  );
};

export default MarkdownViewer;
