import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

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
  const [editorTheme, setEditorTheme] = useState<"vs" | "vs-dark">("vs");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const syncTheme = () => {
      const isDarkTheme =
        root.dataset.theme === "dark" ||
        root.classList.contains("dark") ||
        document.body?.dataset.theme === "dark";

      setEditorTheme(isDarkTheme ? "vs-dark" : "vs");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={className}
      style={{
        width: "100%",
        minWidth: 0,
        border: "1px solid var(--surface-border, #d0d7de)",
        borderRadius: "0.5rem",
        overflow: "hidden",
        background: editorTheme === "vs-dark" ? "var(--surface-ground, #111827)" : "var(--surface-card, #fff)",
      }}
    >
      <Editor
        width="100%"
        height={height}
        theme={editorTheme}
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
