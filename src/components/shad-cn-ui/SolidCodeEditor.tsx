import Editor from "@monaco-editor/react";

type SolidCodeEditorProps = {
  value?: string;
  onChange?: (value: string | undefined) => void;
  height?: string;
  fontSize?: string | number;
  readOnly?: boolean;
  className?: string;
  language?: string;
};

export function SolidCodeEditor({
  value = "",
  onChange,
  height = "300px",
  fontSize = "14px",
  readOnly = false,
  className,
  language = "javascript",
}: SolidCodeEditorProps) {
  return (
    <div
      className={className}
      style={{
        border: "1px solid var(--surface-border, #d0d7de)",
        borderRadius: "0.5rem",
        overflow: "hidden",
        background: "var(--surface-card, #fff)",
      }}
    >
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange?.(val ?? "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: "on",
          fontSize: typeof fontSize === "number" ? fontSize : parseInt(String(fontSize), 10) || 14,
          scrollBeyondLastLine: false,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
