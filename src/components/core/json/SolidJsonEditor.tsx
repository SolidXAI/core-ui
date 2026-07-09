import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import "jsoneditor/dist/jsoneditor.css";
import "./SolidJsonEditor.css";

export type SolidJsonEditorHandle = {
  format: () => void;
  getText: () => string;
};

type SolidJsonEditorProps = {
  value: any;
  resetToken: string;
  readOnly?: boolean;
  className?: string;
  onValueChange?: (value: any) => void;
  onTextChange?: (text: string) => void;
  onErrorChange?: (message: string | null) => void;
};

export const SolidJsonEditor = forwardRef<SolidJsonEditorHandle, SolidJsonEditorProps>(function SolidJsonEditor(
  {
    value,
    resetToken,
    readOnly = false,
    className = "",
    onValueChange,
    onTextChange,
    onErrorChange,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const latestValueRef = useRef<any>(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const emitState = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    try {
      const nextValue = editor.get();
      const nextText = editor.getText?.() ?? JSON.stringify(nextValue, null, 2);
      onValueChange?.(nextValue);
      onTextChange?.(nextText);
      onErrorChange?.(null);
    } catch (error: any) {
      const rawText = editor.getText?.() ?? "";
      onTextChange?.(rawText);
      onErrorChange?.(
        error?.message ? String(error.message) : "The JSON is currently invalid.",
      );
    }
  };

  useImperativeHandle(ref, () => ({
    format() {
      try {
        editorRef.current?.format?.();
      } catch (_error) {
        // jsoneditor already surfaces parse states through onErrorChange.
      }

      emitState();
    },
    getText() {
      return editorRef.current?.getText?.() ?? "";
    },
  }), []);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    let destroyed = false;

    void import("jsoneditor").then((jsonEditorModule: any) => {
      if (destroyed || !containerRef.current || editorRef.current) {
        return;
      }

      const JSONEditor = jsonEditorModule?.default ?? jsonEditorModule;
      editorRef.current = new JSONEditor(containerRef.current, {
        mode: "code",
        modes: ["code"],
        mainMenuBar: true,
        navigationBar: true,
        statusBar: true,
        search: true,
        enableSort: false,
        enableTransform: false,
        onChange: () => emitState(),
      });

      try {
        editorRef.current.set(latestValueRef.current);
      } catch (_error) {
        // Ignore seed failures and let jsoneditor surface them through its own state.
      }

      emitState();

      if (editorRef.current?.aceEditor?.setReadOnly) {
        editorRef.current.aceEditor.setReadOnly(readOnly);
      }
    });

    return () => {
      destroyed = true;
      editorRef.current?.destroy?.();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    try {
      editorRef.current.set(latestValueRef.current);
    } catch (_error) {
      // Ignore reset parse failures and surface them via emitState instead.
    }

    emitState();
  }, [resetToken]);

  useEffect(() => {
    if (!editorRef.current?.aceEditor?.setReadOnly) {
      return;
    }

    editorRef.current.aceEditor.setReadOnly(readOnly);
  }, [readOnly]);

  return (
    <div
      ref={containerRef}
      className={`solid-json-editor-host solid-json-editor ${readOnly ? "is-readonly" : ""} ${className}`.trim()}
    />
  );
});
