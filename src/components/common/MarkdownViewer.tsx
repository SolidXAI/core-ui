import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const MarkdownViewer = ({ data }: any) => {
  const [markdown, setMarkdown] = useState(data);

  return (
    <div>
      <ReactMarkdown className="markdown-view">{markdown}</ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;
