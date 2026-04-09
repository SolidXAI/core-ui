import React, { useEffect, useMemo, useRef, useState } from "react";

type SolidAutocompleteProps = {
  value?: any;
  suggestions?: any[];
  completeMethod?: (event: { query: string }) => void | Promise<void>;
  onChange?: (event: { value: any }) => void;
  onSelect?: (event: { value: any }) => void;
  onUnselect?: (event: { value: any }) => void;
  disabled?: boolean;
  readOnly?: boolean;
  emptyMessage?: string;
  id?: string;
  virtualScrollerOptions?: any;
  field?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  dropdown?: boolean;
  forceSelection?: boolean;
  multiple?: boolean;
  maxVisibleChips?: number;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getDisplayValue(value: any, field: string) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    const direct = value?.[field];
    if (direct != null) return String(direct);
    if (value?.label != null) return String(value.label);
  }
  return "";
}

export function SolidAutocomplete({
  value,
  suggestions = [],
  completeMethod,
  onChange,
  onSelect,
  onUnselect,
  id,
  disabled,
  readOnly,
  emptyMessage,
  field = "label",
  placeholder,
  className,
  inputClassName,
  dropdown,
  forceSelection,
  multiple,
  maxVisibleChips = 2,
}: SolidAutocompleteProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (multiple) return;
    if (!value || typeof value === "string") {
      setQuery(typeof value === "string" ? value : "");
      return;
    }
    setQuery("");
  }, [value, field, multiple]);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  const runCompleteMethod = (nextQuery: string, immediate = false) => {
    if (!completeMethod) return;
    if (completeTimerRef.current) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    if (immediate) {
      void completeMethod({ query: nextQuery });
      return;
    }
    completeTimerRef.current = window.setTimeout(() => {
      void completeMethod({ query: nextQuery });
    }, 140);
  };

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setManageOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const normalizedSuggestions = useMemo(
    () =>
      (suggestions || []).map((item) => ({
        raw: item,
        label: getDisplayValue(item, field),
      })),
    [suggestions, field]
  );

  const selectedItems = useMemo(() => {
    const isRenderable = (item: any) => {
      if (item === null || item === undefined || item === "") return false;
      const label = getDisplayValue(item, field);
      return typeof label === "string" ? label.trim().length > 0 : !!label;
    };

    if (multiple) {
      if (!Array.isArray(value)) return [];
      return value.filter(isRenderable);
    }
    if (!value || typeof value === "string") return [];
    return isRenderable(value) ? [value] : [];
  }, [multiple, value, field]);

  const visibleSelectedItems = selectedItems.slice(0, maxVisibleChips);
  const hiddenSelectedItems = selectedItems.slice(maxVisibleChips);

  useEffect(() => {
    if (multiple && hiddenSelectedItems.length === 0 && manageOpen) {
      setManageOpen(false);
    }
  }, [multiple, hiddenSelectedItems.length, manageOpen]);

  const toItemKey = (item: any, index: number) => {
    if (item && typeof item === "object") {
      if (item.value !== undefined && item.value !== null) return String(item.value);
      if (item.id !== undefined && item.id !== null) return String(item.id);
    }
    const label = getDisplayValue(item, field);
    return label ? `${label}-${index}` : String(index);
  };

  const toComparableKey = (item: any) => {
    if (item && typeof item === "object") {
      if (item.value !== undefined && item.value !== null) return `value:${String(item.value)}`;
      if (item.id !== undefined && item.id !== null) return `id:${String(item.id)}`;
    }
    return `label:${getDisplayValue(item, field)}`;
  };

  const removeSelectedAt = (index: number) => {
    if (multiple) {
      const existing = Array.isArray(value) ? [...value] : [];
      existing.splice(index, 1);
      onChange?.({ value: existing });
      return;
    }
    onChange?.({ value: null });
  };

  const clearAllSelected = () => {
    onChange?.({ value: multiple ? [] : null });
    setManageOpen(false);
  };

  const commitSelection = (item: any) => {
    if (multiple) {
      const existing = Array.isArray(value) ? [...value] : [];
      const exists = existing.some((entry) => toComparableKey(entry) === toComparableKey(item));
      if (!exists) {
        onChange?.({ value: [...existing, item] });
      }
      setQuery("");
      setOpen(false);
      setManageOpen(false);
      setActiveIndex(-1);
      return;
    }
    setQuery("");
    onChange?.({ value: item });
    onSelect?.({ value: item });
    setOpen(false);
    setManageOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={rootRef} id={id} className={cx("solid-autocomplete", className)}>
      <div className={cx("solid-autocomplete-control solid-autocomplete-chip-control", isFocused && "is-focused")}>
        {visibleSelectedItems.map((item, index) => (
          <span key={toItemKey(item, index)} className="solid-autocomplete-chip">
            <span className="solid-autocomplete-chip-label">{getDisplayValue(item, field)}</span>
            <button
              type="button"
              className="solid-autocomplete-chip-remove"
              onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onUnselect?.({ value: item });
              removeSelectedAt(index);
            }}
              aria-label="Remove selection"
            >
              <i className="pi pi-times" />
            </button>
          </span>
        ))}
        {multiple && hiddenSelectedItems.length > 0 && (
          <button
            type="button"
            className="solid-autocomplete-chip-manage"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setOpen(false);
              setManageOpen((prev) => !prev);
            }}
          >
            +{hiddenSelectedItems.length} more
          </button>
        )}
        <input
          className={cx("solid-input solid-autocomplete-input solid-autocomplete-inline-input", inputClassName)}
          value={query}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={selectedItems.length > 0 ? "" : placeholder}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
            setManageOpen(false);
            runCompleteMethod(query, true);
          }}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            setManageOpen(false);
            runCompleteMethod(next, false);
          }}
          onClick={() => {
            setOpen(true);
            setManageOpen(false);
          }}
          onBlur={() => {
            setIsFocused(false);
            if (!forceSelection) return;
            const matched = normalizedSuggestions.find(
              (item) => item.label.toLowerCase() === query.toLowerCase()
            );
            if (matched) {
              onChange?.({ value: matched.raw });
              setQuery("");
            }
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              setOpen(true);
              return;
            }
            if (!normalizedSuggestions.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % normalizedSuggestions.length);
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((prev) =>
                prev <= 0 ? normalizedSuggestions.length - 1 : prev - 1
              );
            }
            if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              commitSelection(normalizedSuggestions[activeIndex].raw);
            }
            if (event.key === "Backspace" && !query && selectedItems.length > 0) {
              event.preventDefault();
              removeSelectedAt(selectedItems.length - 1);
            }
          }}
        />
        {dropdown && (
          <button
            type="button"
            className="solid-autocomplete-trigger"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              const nextOpen = !open;
              setOpen(nextOpen);
              if (nextOpen) {
                setManageOpen(false);
              }
              if (nextOpen) {
                runCompleteMethod(query, true);
              }
            }}
            aria-label="Toggle suggestions"
          >
            <i className={open ? "pi pi-chevron-up" : "pi pi-chevron-down"} />
          </button>
        )}
      </div>

      {multiple && manageOpen && selectedItems.length > 0 && (
        <div className="solid-autocomplete-manager-panel">
          <div className="solid-autocomplete-manager-header">
            <div className="solid-autocomplete-manager-title">Selected ({selectedItems.length})</div>
            <button type="button" className="solid-autocomplete-manager-clear" onClick={clearAllSelected}>
              Clear all
            </button>
          </div>
          <div className="solid-autocomplete-manager-body">
            {selectedItems.map((item, index) => (
              <span key={`managed-${toItemKey(item, index)}`} className="solid-autocomplete-chip">
                <span className="solid-autocomplete-chip-label">{getDisplayValue(item, field)}</span>
                <button
                  type="button"
                  className="solid-autocomplete-chip-remove"
                  onClick={() => removeSelectedAt(index)}
                  aria-label="Remove selection"
                >
                  <i className="pi pi-times" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {open && normalizedSuggestions.length > 0 && (
        <div className="solid-autocomplete-panel" role="listbox">
          {normalizedSuggestions.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              className={cx(
                "solid-autocomplete-option",
                activeIndex === index && "is-active"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commitSelection(item.raw)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
