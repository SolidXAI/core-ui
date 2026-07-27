import { getRelationDisplayText } from "../../../../helpers/relationDisplay";
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";

type PillColorMap = Record<string, string>;

const DEFAULT_PILL_COLOR = "#e5e7eb";

function parseColorMap(value: unknown): PillColorMap {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object" && !Array.isArray(value)
    ? value as PillColorMap
    : {};
}

function getSelectionValueLabelMap(fieldMetadata: any): Record<string, string> {
  const entries = fieldMetadata?.selectionStaticValues;
  if (!Array.isArray(entries)) return {};

  return entries.reduce((mapping: Record<string, string>, entry: string) => {
    const [value, ...labelParts] = String(entry).split(":");
    const trimmedValue = value.trim();
    const label = labelParts.join(":").trim();

    if (trimmedValue) {
      mapping[trimmedValue] = label || trimmedValue;
    }

    return mapping;
  }, {});
}

function getReadableTextColor(backgroundColor: string) {
  const hex = backgroundColor.trim().replace("#", "");
  const normalizedHex = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex;

  if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
    return "var(--foreground)";
  }

  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.58 ? "#111827" : "#ffffff";
}

function getPillColor(colorMap: PillColorMap, rawValue: string, displayValue: string) {
  return colorMap[rawValue]
    ?? colorMap[displayValue]
    ?? colorMap[rawValue.toLowerCase()]
    ?? colorMap[displayValue.toLowerCase()]
    ?? colorMap.default
    ?? DEFAULT_PILL_COLOR;
}

function toDisplayValues(rowData: any, fieldMetadata: any) {
  const rawValue = rowData?.[fieldMetadata.name];
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return [];
  }

  const valueLabelMap = getSelectionValueLabelMap(fieldMetadata);
  const rawValues = String(rawValue).split(",").map((value) => value.trim()).filter(Boolean);

  return rawValues.map((value) => ({
    rawValue: value,
    displayValue: valueLabelMap[value] ?? getRelationDisplayText(value),
  }));
}

export const PillWidget = ({ rowData, fieldMetadata, column }: SolidListFieldWidgetProps) => {
  const colorMap = parseColorMap(
    column?.attrs?.pillColorMap
    ?? column?.attrs?.valueColorMap
    ?? column?.attrs?.colorMap
  );
  const values = toDisplayValues(rowData, fieldMetadata);

  if (values.length === 0) {
    return <span />;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {values.map(({ rawValue, displayValue }) => {
        const backgroundColor = getPillColor(colorMap, rawValue, displayValue);

        return (
          <span
            key={rawValue}
            style={{
              display: "inline-flex",
              alignItems: "center",
              maxWidth: "100%",
              padding: "0.16rem 0.48rem",
              borderRadius: "999px",
              backgroundColor,
              color: getReadableTextColor(backgroundColor),
              fontSize: "0.75rem",
              fontWeight: 600,
              lineHeight: 1.35,
              whiteSpace: "nowrap",
            }}
            title={displayValue}
          >
            {displayValue}
          </span>
        );
      })}
    </div>
  );
};
