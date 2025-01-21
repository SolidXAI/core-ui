import React, { useState } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';  // Correct import
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';

const CodeEditor = ({ formik, field, height, fontSize, readOnly }: any) => {

  return (
    <CodeMirror
      id={field}
      value={formik?.values[field]}
      height={height ?? '300px'}
      style={{ fontSize: fontSize ?? '10px' }}
      theme={oneDark}
      readOnly={readOnly}
      extensions={[javascript(), EditorView.lineWrapping]}
      onChange={(e: any) => {
        formik.setFieldValue(field, e);
      }}
    // Line numbers are now handled through a theme or extension
    />
  );
};

export default CodeEditor;
