import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: { options: Array<{ value: T; label: ReactNode }>; value: T; onChange: (v: T) => void; ariaLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const place = () => {
      const el = root.querySelector<HTMLElement>(`[data-seg="${CSS.escape(value)}"]`);
      const thumb = thumbRef.current;
      if (!thumb) return;
      thumb.style.opacity = el ? "" : "0";
      if (!el) return;
      thumb.style.width = `${el.offsetWidth}px`;
      thumb.style.transform = `translateX(${el.offsetLeft - 2}px)`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(root);
    return () => ro.disconnect();
  }, [value, options.length]);
  return (
    <div ref={ref} className="thx-seg" role="radiogroup" aria-label={ariaLabel}>
      <span ref={thumbRef} className="thx-seg-thumb" style={{ left: 2 }} aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          data-seg={o.value}
          onClick={() => onChange(o.value)}
          className={cx("thx-seg-btn", o.value === value && "is-active")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return <div className={cx("thx-card", className)} style={style}>{children}</div>;
}

export function CardHeader({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="thx-card-h">
      <div>
        <h3 className="thx-card-title">{title}</h3>
        {sub && <div className="thx-card-sub">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export function Skeleton({ width = "100%", height = 10, radius, style }: { width?: number | string; height?: number; radius?: number; style?: CSSProperties }) {
  return <span className="thx-skel" style={{ width, height, borderRadius: radius, ...style }} aria-hidden />;
}
