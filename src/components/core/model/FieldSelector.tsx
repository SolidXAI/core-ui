
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Calculator,
  Calendar,
  Clock9,
  Code2,
  Feather,
  Fingerprint,
  FunctionSquare,
  Hash,
  Image,
  Images,
  ListChecks,
  ListFilter,
  Mail,
  Share2,
  Shield,
  Sigma,
  Timer,
  ToggleLeft,
  Type,
} from "lucide-react";

type FieldSelectorProps = {
  handleTypeSelect: (value: string, label: string) => void;
  modelMetaData?: any;
};

type FieldOption = {
  label: string;
  description: string;
  Icon: LucideIcon;
  value: string;
  tone: "blue" | "violet" | "green" | "orange" | "cyan";
};

const fieldToneMap: Record<string, FieldOption["tone"]> = {
  int: "blue",
  bigint: "blue",
  decimal: "blue",
  shortText: "violet",
  longText: "violet",
  richText: "violet",
  json: "cyan",
  boolean: "green",
  date: "orange",
  datetime: "orange",
  time: "orange",
  relation: "cyan",
  mediaSingle: "violet",
  mediaMultiple: "violet",
  email: "cyan",
  password: "cyan",
  selectionStatic: "green",
  selectionDynamic: "green",
  computed: "blue",
  uuid: "blue",
};

const solidFieldOptions: FieldOption[] = [
  { label: "Integer", description: "Whole number (int)", Icon: Hash, value: "int", tone: fieldToneMap.int },
  { label: "Big Integer", description: "Large whole number (bigint)", Icon: Calculator, value: "bigint", tone: fieldToneMap.bigint },
  { label: "Decimal", description: "64-bit floating-point number", Icon: Sigma, value: "decimal", tone: fieldToneMap.decimal },
  { label: "Short Text", description: "Small text field", Icon: Type, value: "shortText", tone: fieldToneMap.shortText },
  { label: "Long Text", description: "Large text field", Icon: AlignLeft, value: "longText", tone: fieldToneMap.longText },
  { label: "Rich Text", description: "Rich text editor", Icon: Feather, value: "richText", tone: fieldToneMap.richText },
  { label: "JSON", description: "JSON data format", Icon: Code2, value: "json", tone: fieldToneMap.json },
  { label: "Boolean", description: "True / False value", Icon: ToggleLeft, value: "boolean", tone: fieldToneMap.boolean },
  { label: "Date", description: "Date field", Icon: Calendar, value: "date", tone: fieldToneMap.date },
  { label: "Datetime", description: "Date & time field", Icon: Clock9, value: "datetime", tone: fieldToneMap.datetime },
  { label: "Time", description: "Time picker", Icon: Timer, value: "time", tone: fieldToneMap.time },
  { label: "Relation", description: "Reference another entity", Icon: Share2, value: "relation", tone: fieldToneMap.relation },
  { label: "Single Media", description: "Single file upload", Icon: Image, value: "mediaSingle", tone: fieldToneMap.mediaSingle },
  { label: "Multiple Media", description: "Multiple file upload", Icon: Images, value: "mediaMultiple", tone: fieldToneMap.mediaMultiple },
  { label: "Email", description: "Email field", Icon: Mail, value: "email", tone: fieldToneMap.email },
  { label: "Password", description: "Password input", Icon: Shield, value: "password", tone: fieldToneMap.password },
  { label: "Static Selection", description: "Predefined values", Icon: ListChecks, value: "selectionStatic", tone: fieldToneMap.selectionStatic },
  { label: "Dynamic Selection", description: "Dynamic list", Icon: ListFilter, value: "selectionDynamic", tone: fieldToneMap.selectionDynamic },
  { label: "Computed", description: "Derive value from data", Icon: FunctionSquare, value: "computed", tone: fieldToneMap.computed },
  { label: "UUID", description: "Unique identifier", Icon: Fingerprint, value: "uuid", tone: fieldToneMap.uuid },
];

const FieldSelector = ({ handleTypeSelect }: FieldSelectorProps) => {
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const handleSelect = (option: FieldOption) => {
    setSelectedField(option.value);
    handleTypeSelect(option.value, option.label);
  };

  return (
    <div className="solid-field-selector-container">
      <div className="solid-field-selector-header">
        <p className="form-wrapper-heading text-base m-0">Select Field Type</p>
        <p className="solid-field-selector-subheading">Choose the data type you want to add to the model.</p>
      </div>
      <div className="solid-field-selector-grid">
        {solidFieldOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`solid-field-selector-card ${selectedField === option.value ? "is-active" : ""}`}
            onClick={() => handleSelect(option)}
          >
            <div className="solid-field-selector-card-inner">
              <span className={`solid-field-selector-icon solid-field-selector-icon-${option.tone}`}>
                <option.Icon size={18} strokeWidth={1.8} />
              </span>
              <div className="solid-field-selector-text">
                <span className="solid-field-selector-title">{option.label}</span>
                <span className="solid-field-selector-description">{option.description}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FieldSelector;
