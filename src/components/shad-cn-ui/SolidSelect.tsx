import React from "react";
import { ChevronDown } from "lucide-react";

type SolidSelectOption = Record<string, any>;

type SolidSelectProps = {
  value?: any;
  options?: SolidSelectOption[];
  optionLabel?: string;
  optionValue?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (event: { value: any }) => void;
  id?: string;
  native?: boolean;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SolidSelect({
  value,
  options = [],
  optionLabel = "label",
  optionValue = "value",
  placeholder,
  className,
  disabled,
  onChange,
  id,
  native = true,
}: SolidSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [openUpward, setOpenUpward] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const normalized = options.map((option, index) => ({
    key: String(index),
    label: option?.[optionLabel] ?? "",
    value: option?.[optionValue],
  }));

  const selectedIndex = normalized.findIndex((item) => item.value === value);
  const selectedKey = selectedIndex >= 0 ? normalized[selectedIndex].key : "";
  const selectedOption = selectedIndex >= 0 ? normalized[selectedIndex] : null;

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  React.useLayoutEffect(() => {
    if (!open || native || !rootRef.current || !menuRef.current) return;

    const rootRect = rootRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rootRect.bottom;
    const spaceAbove = rootRect.top;
    const needsOpenUpward = spaceBelow < menuHeight + 8 && spaceAbove > spaceBelow;

    setOpenUpward(needsOpenUpward);
  }, [open, native, options.length]);

  if (!native) {
    return (
      <div ref={rootRef} className={cx("solid-select-wrap", "solid-select-wrap-custom", className)}>
        <button
          id={id}
          type="button"
          className="solid-select solid-select-trigger"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => {
            if (disabled) return;
            setOpen((prev) => !prev);
          }}
        >
          <span className={cx("solid-select-trigger-label", !selectedOption && "solid-select-placeholder")}>
            {selectedOption?.label || placeholder || "Select"}
          </span>
          <span className="solid-select-icon" aria-hidden="true">
            <ChevronDown size={14} />
          </span>
        </button>
        {open ? (
          <div
            ref={menuRef}
            className={cx("solid-select-menu", openUpward && "solid-select-menu-top")}
            role="listbox"
          >
            {normalized.map((item) => (
              <button
                key={item.key}
                type="button"
                role="option"
                className={cx("solid-select-menu-item", item.value === value && "is-selected")}
                aria-selected={item.value === value}
                onClick={() => {
                  onChange?.({ value: item.value });
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cx("solid-select-wrap", className)}>
      <select
        id={id}
        className="solid-select"
        value={selectedKey}
        disabled={disabled}
        onChange={(event) => {
          const next = normalized.find((item) => item.key === event.target.value);
          onChange?.({ value: next?.value });
        }}
      >
        <option value="" disabled>
          {placeholder || "Select"}
        </option>
        {normalized.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
      <span className="solid-select-icon" aria-hidden="true">
        <ChevronDown size={14} />
      </span>
    </div>
  );
}
