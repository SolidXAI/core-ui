import { useEffect, useRef, type CSSProperties } from "react";
import Quill, { type QuillOptions } from "quill";
import "quill/dist/quill.snow.css";

type SolidRichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
  modules?: QuillOptions["modules"];
  formats?: string[] | null;
  style?: CSSProperties;
};

const defaultModules: NonNullable<QuillOptions["modules"]> = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const defaultFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "list",
  "indent",
  "align",
  "link",
  "image",
];

export function SolidRichTextEditor({
  value = "",
  onChange,
  readOnly = false,
  className,
  id,
  placeholder,
  modules = defaultModules,
  formats = defaultFormats,
  style,
}: SolidRichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const lastHtmlRef = useRef<string>("");
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) {
      return;
    }

    const quill = new Quill(containerRef.current, {
      theme: "snow",
      readOnly,
      placeholder,
      modules,
      formats,
    });

    quillRef.current = quill;

    const initialValue = value ?? "";
    const delta = quill.clipboard.convert({ html: initialValue });
    quill.setContents(delta, Quill.sources.SILENT);
    lastHtmlRef.current = initialValue;

    const handleChange = (_delta: unknown, _oldContents: unknown, source: string) => {
      if (source !== Quill.sources.USER) {
        return;
      }
      const html = quill.root.innerHTML;
      lastHtmlRef.current = html;
      onChangeRef.current?.(html);
    };

    quill.on("text-change", handleChange);

    return () => {
      quill.off("text-change", handleChange);
      quillRef.current = null;
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    const normalizedHtml = value ?? "";
    if (normalizedHtml === lastHtmlRef.current) {
      return;
    }

    const selection = quill.getSelection();
    const delta = quill.clipboard.convert({ html: normalizedHtml });
    quill.setContents(delta, Quill.sources.SILENT);
    if (selection) {
      const index = Math.min(selection.index, quill.getLength());
      const length = selection.length ?? 0;
      quill.setSelection(index, length, Quill.sources.SILENT);
    }
    lastHtmlRef.current = normalizedHtml;
  }, [value]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    quill.enable(!readOnly);
  }, [readOnly]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    quill.root.setAttribute("data-placeholder", placeholder ?? "");
  }, [placeholder]);

  return (
    <div id={id} className={className} style={style}>
      <div ref={containerRef} />
    </div>
  );
}
