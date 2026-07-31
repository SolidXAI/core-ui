import React from "react";

type SolidMaterialSymbolProps = React.HTMLAttributes<HTMLSpanElement> & {
  name: string;
  size?: number | string;
  fallback?: React.ReactNode;
  onSupportChange?: (supported: boolean) => void;
};

const MATERIAL_SYMBOL_FONT_FAMILY = "\"Material Symbols Outlined\"";

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export const SolidMaterialSymbol = ({ name, size = 24, className, style, fallback: _fallback, onSupportChange: _onSupportChange, ...rest }: SolidMaterialSymbolProps) => {
  void _fallback;
  void _onSupportChange;

  return (
    <span
      {...rest}
      className={cx("material-symbols-outlined", className)}
      style={{
        fontFamily: MATERIAL_SYMBOL_FONT_FAMILY,
        fontWeight: 400,
        fontStyle: "normal",
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "normal",
        textTransform: "none",
        whiteSpace: "nowrap",
        wordWrap: "normal",
        direction: "ltr",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        fontFeatureSettings: "\"liga\"",
        WebkitFontFeatureSettings: "\"liga\"",
        ...style,
      }}
    >
      {name}
    </span>
  );
};
