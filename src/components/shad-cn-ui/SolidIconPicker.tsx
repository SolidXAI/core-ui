import React from "react";
import { solidIcons } from "../../helpers/solidIcons";
import { SolidMaterialSymbol } from "../common/SolidMaterialSymbol";
import { SolidButton } from "./SolidButton";
import { SolidDialog, SolidDialogBody, SolidDialogFooter, SolidDialogHeader, SolidDialogTitle } from "./SolidDialog";
import { SolidInput } from "./SolidInput";

export type SolidIconPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

const categories = ["All", ...solidIcons.map(({ category }) => category)];
const icons = solidIcons.flatMap(({ category, icons }) => icons.map((name) => ({ name, category })));

function formatIconName(name: string) {
  return name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

/** Searchable Material Symbols picker for custom SolidX interfaces. */
export function SolidIconPicker({ value, onChange }: SolidIconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const filtered = icons.filter(({ name, category: iconCategory }) =>
    (category === "All" || iconCategory === category) && name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex items-center gap-3">
      {value ? <SolidMaterialSymbol name={value} size={32} aria-label={formatIconName(value)} /> : <span className="text-sm opacity-70">No icon selected</span>}
      <SolidButton type="button" size="small" variant="outline" onClick={() => setOpen(true)}>
        {value ? "Change icon" : "Select icon"}
      </SolidButton>
      {value && <SolidButton type="button" size="small" variant="ghost" onClick={() => onChange("")}>Remove</SolidButton>}

      <SolidDialog open={open} onOpenChange={setOpen} className="p-0" style={{ width: "min(900px, 94vw)", maxHeight: "85vh" }}>
        <SolidDialogHeader>
          <SolidDialogTitle>Select an icon</SolidDialogTitle>
        </SolidDialogHeader>
        <SolidDialogBody className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((item) => (
              <SolidButton key={item} type="button" size="small" variant={category === item ? "primary" : "outline"} onClick={() => setCategory(item)}>
                {item}
              </SolidButton>
            ))}
          </div>
          <SolidInput aria-label="Search icons" placeholder="Search icons" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 overflow-y-auto" style={{ maxHeight: "55vh" }}>
            {filtered.map(({ name }) => (
              <button
                key={name}
                type="button"
                className="flex flex-col items-center justify-center gap-2 rounded-md border p-2 hover:bg-muted"
                aria-label={formatIconName(name)}
                title={name}
                onClick={() => { onChange(name); setOpen(false); }}
              >
                <SolidMaterialSymbol name={name} size={24} />
                <span className="text-xs text-center">{formatIconName(name)}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="col-span-full text-sm opacity-70">No icons found.</p>}
          </div>
        </SolidDialogBody>
        <SolidDialogFooter>
          <SolidButton type="button" variant="outline" onClick={() => setOpen(false)}>Done</SolidButton>
        </SolidDialogFooter>
      </SolidDialog>
    </div>
  );
}
