import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  ArrowUpWideNarrow,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  CalendarMinus,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Code,
  Cog,
  Columns3,
  Copy,
  Download,
  DownloadCloud,
  ExternalLink,
  Eye,
  EyeOff,
  File,
  FilePenLine,
  FileSpreadsheet,
  FileText,
  FileType,
  Filter,
  FilterX,
  History,
  Image as ImageIcon,
  Inbox,
  Info,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Star,
  Terminal,
  Trash2,
  Upload,
  UploadCloud,
  User,
  Users,
  Wifi,
  X,
  XCircle
} from "lucide-react";

type IconComponent = LucideIcon;

const ICON_MAP = {
  "si-android": Bot,
  "si-angle-double-left": ChevronsLeft,
  "si-angle-double-right": ChevronsRight,
  "si-angle-down": ChevronDown,
  "si-angle-left": ChevronLeft,
  "si-angle-right": ChevronRight,
  "si-angle-up": ChevronUp,
  "si-arrow-left": ArrowLeft,
  "si-arrow-right": ArrowRight,
  "si-bars": Menu,
  "si-bell": Bell,
  "si-calendar": Calendar,
  "si-calendar-minus": CalendarMinus,
  "si-calendar-plus": CalendarPlus,
  "si-chart-bar": BarChart3,
  "si-check": Check,
  "si-check-circle": CheckCircle2,
  "si-chevron-down": ChevronDown,
  "si-chevron-left": ChevronLeft,
  "si-chevron-right": ChevronRight,
  "si-chevron-up": ChevronUp,
  "si-clone": Copy,
  "si-cloud-download": DownloadCloud,
  "si-cloud-upload": UploadCloud,
  "si-code": Code,
  "si-cog": Cog,
  "si-comments": MessageSquare,
  "si-copy": Copy,
  "si-download": Download,
  "si-ellipsis-h": MoreHorizontal,
  "si-ellipsis-v": MoreVertical,
  "si-envelope": Mail,
  "si-exclamation-circle": AlertCircle,
  "si-exclamation-triangle": AlertTriangle,
  "si-external-link": ExternalLink,
  "si-eye": Eye,
  "si-eye-slash": EyeOff,
  "si-file": File,
  "si-file-edit": FilePenLine,
  "si-file-excel": FileSpreadsheet,
  "si-file-pdf": FileText,
  "si-file-word": FileType,
  "si-filter": Filter,
  "si-filter-fill": Filter,
  "si-filter-slash": FilterX,
  "si-history": History,
  "si-image": ImageIcon,
  "si-inbox": Inbox,
  "si-info-circle": Info,
  "si-lock": Lock,
  "si-minus": Minus,
  "si-objects-column": Columns3,
  "si-pencil": Pencil,
  "si-plus": Plus,
  "si-power-off": Power,
  "si-refresh": RefreshCcw,
  "si-save": Save,
  "si-search": Search,
  "si-send": Send,
  "si-sliders-h": SlidersHorizontal,
  "si-sort-down-fill": ArrowDownWideNarrow,
  "si-sort-up-fill": ArrowUpWideNarrow,
  "si-spinner": Loader2,
  "si-star": Star,
  "si-terminal": Terminal,
  "si-th-large": LayoutGrid,
  "si-times": X,
  "si-times-circle": XCircle,
  "si-trash": Trash2,
  "si-upload": Upload,
  "si-user": User,
  "si-users": Users,
  "si-wifi": Wifi
} satisfies Record<string, IconComponent>;

export type SolidIconName = keyof typeof ICON_MAP;

const SPIN_CLASSNAMES = new Set(["pi-spin", "si-spin"]);

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function isSolidIconName(name: string): name is SolidIconName {
  return Object.prototype.hasOwnProperty.call(ICON_MAP, name);
}

export interface SolidIconProps extends React.ComponentPropsWithoutRef<"svg"> {
  name: SolidIconName;
  size?: number | string;
  spin?: boolean;
}

export const ICON_KEYS = Object.keys(ICON_MAP) as SolidIconName[];

export const SolidIcon = React.forwardRef<SVGSVGElement, SolidIconProps>(
  ({ name, size = "1em", spin, className, ...rest }, ref) => {
    const IconComponent = ICON_MAP[name] ?? CircleHelp;

    return (
      <IconComponent
        ref={ref}
        size={size}
        className={cx("solid-icon", spin && "solid-icon--spin", className)}
        {...rest}
      />
    );
  }
);

export type SolidIconMeta = {
  name: SolidIconName;
  spin?: boolean;
};

export function parseSolidIconMeta(value?: string | null): SolidIconMeta | undefined {
  if (!value) return undefined;
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return undefined;

  let spin = false;
  let matchedName: SolidIconName | undefined;

  for (const token of tokens) {
    if (SPIN_CLASSNAMES.has(token)) {
      spin = true;
      continue;
    }

    if (!token.startsWith("pi-") && !token.startsWith("si-")) {
      continue;
    }

    const normalized = token.startsWith("pi-") ? `si-${token.slice(3)}` : token;
    if (isSolidIconName(normalized)) {
      matchedName = normalized;
    }
  }

  if (!matchedName) return undefined;

  return { name: matchedName, spin };
}

export function normalizeSolidIconName(value?: string | null): SolidIconName | undefined {
  return parseSolidIconMeta(value)?.name;
}
