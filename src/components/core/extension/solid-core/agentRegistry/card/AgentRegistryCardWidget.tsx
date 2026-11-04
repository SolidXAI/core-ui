import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SolidKanbanCardWidgetProps } from "../../../../../../types/solid-core";
import { SolidMaterialSymbol } from "../../../../../common/SolidMaterialSymbol";
import styles from "./AgentRegistryCardWidget.module.css";

function TruncatedText({ text, className, as: Tag }: { text: string; className: string; as: "h3" | "p" }) {
  const textRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [visibleText, setVisibleText] = useState(text);
  const truncated = visibleText !== text;
  const [position, setPosition] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  const tooltipId = useId();

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      if (!width) return;
      const probe = element.cloneNode(false) as HTMLSpanElement;
      Object.assign(probe.style, {
        position: "absolute", visibility: "hidden", pointerEvents: "none",
        width: `${width}px`, height: "auto", maxHeight: "none",
        display: "block", overflow: "visible", WebkitLineClamp: "unset",
      });
      probe.setAttribute("aria-hidden", "true");
      element.parentElement?.appendChild(probe);
      const maxHeight = Math.ceil(parseFloat(getComputedStyle(element).lineHeight) * (Tag === "h3" ? 1 : 2));
      const fits = () => probe.scrollWidth <= Math.ceil(width) && probe.scrollHeight <= maxHeight;
      probe.textContent = text;
      if (fits()) {
        setVisibleText(text);
      } else {
        const characters = Array.from(text);
        let low = 0;
        let high = characters.length;
        while (low < high) {
          const mid = Math.ceil((low + high) / 2);
          probe.textContent = characters.slice(0, mid).join("").trimEnd();
          const dots = document.createElement("button");
          dots.className = styles.ellipsis;
          dots.textContent = "...";
          probe.appendChild(dots);
          if (fits()) low = mid;
          else high = mid - 1;
        }
        setVisibleText(characters.slice(0, low).join("").trimEnd());
      }
      probe.remove();
      setPosition(null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(closeTimer.current);
    };
  }, [text, Tag]);

  const keepOpen = () => clearTimeout(closeTimer.current);
  const close = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPosition(null), 150);
  };

  return (
    <Tag className={styles.textContainer}>
      <span ref={textRef} className={className}>{visibleText}
      {truncated && <button
        type="button"
        className={styles.ellipsis}
        aria-label={`Show full ${Tag === "h3" ? "title" : "description"}`}
        aria-describedby={position ? tooltipId : undefined}
        onMouseEnter={(event) => {
          keepOpen();
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 368)), top: rect.bottom + 6, maxHeight: Math.max(80, window.innerHeight - rect.bottom - 14) });
        }}
        onFocus={(event) => {
          keepOpen();
          const rect = event.currentTarget.getBoundingClientRect();
          setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 368)), top: rect.bottom + 6, maxHeight: Math.max(80, window.innerHeight - rect.bottom - 14) });
        }}
        onMouseLeave={close}
        onBlur={close}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            setPosition(null);
          }
        }}
      >...</button>}</span>
      {position && createPortal(<div
        id={tooltipId}
        role="tooltip"
        className={styles.textPopover}
        style={position}
        onMouseEnter={keepOpen}
        onMouseLeave={close}
        onClick={(event) => event.stopPropagation()}
      >{text}</div>, document.body)}
    </Tag>
  );
}

function modelLabel(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const [provider, ...model] = value.trim().split(":");
  return model.length ? `${provider} · ${model.join(":")}` : value.trim();
}

/** Card renderer for Agent Registry records. */
export function AgentRegistryCardWidget({ rowData }: SolidKanbanCardWidgetProps) {
  const iconName = typeof rowData?.iconName === "string" && rowData.iconName.trim()
    ? rowData.iconName.trim()
    : "psychology";
  const name = typeof rowData?.name === "string" && rowData.name.trim() ? rowData.name.trim() : "Untitled";
  const title = typeof rowData?.title === "string" && rowData.title.trim() ? rowData.title.trim() : name;
  const description = typeof rowData?.description === "string" ? rowData.description.trim() : "";
  const status = typeof rowData?.status === "string" && rowData.status.trim() ? rowData.status.trim() : "";
  const configVersion = Number(rowData?.configVersion);
  const normalizedDescription = description.toLocaleLowerCase();
  const summary = normalizedDescription === title.toLocaleLowerCase() || normalizedDescription === name.toLocaleLowerCase() ? "" : description;
  const models = [
    { label: "Reasoning", value: modelLabel(rowData?.reasoningModelKey) },
    { label: "Fast", value: modelLabel(rowData?.fastModelKey) },
  ].filter((model) => model.value);

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconBadge} aria-label={`${title} icon`}>
          <SolidMaterialSymbol name={iconName} size={22} aria-hidden="true" />
        </div>
      </div>

      <div className={styles.heading}>
        <TruncatedText as="h3" className={styles.title} text={title} />
        {name !== title && <span className={styles.name} title={name}>{name}</span>}
      </div>

      {summary && <TruncatedText as="p" className={styles.description} text={summary} />}

      {models.length > 0 && <div className={styles.models} aria-label="Configured models">
        {models.map((model) => <div className={styles.modelRow} key={model.label} title={`${model.label}: ${model.value}`}>
          <span>{model.label}</span><strong>{model.value}</strong>
        </div>)}
      </div>}

      <div className={styles.footer}>
        <div className={styles.meta}>
          {status && <span className={`${styles.status} ${styles[`status_${status.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`] || ""}`}>{status.replace(/[_-]+/g, " ")}</span>}
          {Number.isFinite(configVersion) && configVersion > 0 && <span className={styles.badge} aria-label={`Configuration version ${configVersion}`}>Config v{configVersion}</span>}
        </div>
      </div>
    </article>
  );
}
