import type { SolidIconName } from "../components/shad-cn-ui/SolidIcon";
import { parseSolidIconMeta } from "../components/shad-cn-ui/SolidIcon";
import { hasSolidMaterialIconName } from "./solidIcons";

type MenuItemModelMeta = {
  displayName?: string | null;
  icon?: string | null;
  pluralName?: string | null;
  singularName?: string | null;
  title?: string | null;
};

export type MenuItemIconSource = {
  children?: MenuItemIconSource[] | null;
  icon?: string | { src?: string } | null;
  isSystem?: boolean | null;
  label?: string | null;
  model?: MenuItemModelMeta | null;
  modelMetadata?: MenuItemModelMeta | null;
  path?: string | null;
  solidView?: { model?: MenuItemModelMeta | null } | null;
  title?: string | null;
};

export type ResolvedMenuItemIcon =
  | { kind: "material"; name: string }
  | { kind: "solid"; name: SolidIconName; spin?: boolean };

const TITLE_ALIAS_RULES: Array<{pattern: RegExp;icon: ResolvedMenuItemIcon;}> = [
  { pattern: /\bwhats?\s?app\b/i, icon: { kind: "material", name: "whatsapp" } },
  { pattern: /\b(user|profile|account|contact)\b/i, icon: { kind: "material", name: "person" } },
  { pattern: /\b(users|profiles|accounts|contacts|members?|people|teams?|groups?)\b/i, icon: { kind: "material", name: "group" } },
  { pattern: /\b(roles?|permissions?|access)\b/i, icon: { kind: "material", name: "admin_panel_settings" } },
  { pattern: /\b(emails?|mail|inbox)\b/i, icon: { kind: "material", name: "email" } },
  { pattern: /\b(messages?|chats?|conversations?)\b/i, icon: { kind: "material", name: "message" } },
  { pattern: /\b(forms?|submissions?)\b/i, icon: { kind: "material", name: "dynamic_form" } },
  { pattern: /\b(reports?|analytics|dashboards?)\b/i, icon: { kind: "material", name: "analytics" } },
  { pattern: /\b(settings?|configs?|configuration|preferences?)\b/i, icon: { kind: "material", name: "settings" } },
  { pattern: /\b(files?|documents?|templates?)\b/i, icon: { kind: "material", name: "article" } },
];

function normalizeTextValue(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildMaterialIconCandidates(value?: string | null): string[] {
  const trimmed = normalizeTextValue(value);

  if (!trimmed) {
    return [];
  }

  const camelSeparated = trimmed.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  const snakeCase = camelSeparated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const compact = snakeCase.replace(/_/g, "");

  return Array.from(
    new Set([trimmed, trimmed.toLowerCase(), snakeCase, compact].filter(Boolean))
  );
}

function resolveMaterialIconName(value?: string | null): string | undefined {
  for (const candidate of buildMaterialIconCandidates(value)) {
    if (hasSolidMaterialIconName(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function cloneResolvedIcon(icon: ResolvedMenuItemIcon): ResolvedMenuItemIcon {
  if (icon.kind === "solid") {
    return {
      kind: "solid",
      name: icon.name,
      spin: icon.spin,
    };
  }

  return {
    kind: "material",
    name: icon.name,
  };
}

function getRawIconCandidates(item?: MenuItemIconSource | null): string[] {
  if (!item) {
    return [];
  }

  const candidates = [
    typeof item.icon === "string" ? item.icon : "",
    item.model?.icon,
    item.modelMetadata?.icon,
    item.solidView?.model?.icon,
  ];

  return Array.from(
    new Set(candidates.map(normalizeTextValue).filter(Boolean))
  );
}

function getAliasTextCandidates(item?: MenuItemIconSource | null): string[] {
  if (!item) {
    return [];
  }

  const candidates = [
    item.title,
    item.label,
    item.model?.displayName,
    item.model?.pluralName,
    item.model?.singularName,
    item.model?.title,
    item.modelMetadata?.displayName,
    item.modelMetadata?.pluralName,
    item.modelMetadata?.singularName,
    item.modelMetadata?.title,
    item.solidView?.model?.displayName,
    item.solidView?.model?.pluralName,
    item.solidView?.model?.singularName,
    item.solidView?.model?.title,
    ...getRawIconCandidates(item),
  ];

  return Array.from(
    new Set(candidates.map(normalizeTextValue).filter(Boolean))
  );
}

function resolveAliasedIcon(item?: MenuItemIconSource | null): ResolvedMenuItemIcon | undefined {
  const joinedText = getAliasTextCandidates(item).join(" ");

  if (!joinedText) {
    return undefined;
  }

  for (const rule of TITLE_ALIAS_RULES) {
    if (rule.pattern.test(joinedText)) {
      return cloneResolvedIcon(rule.icon);
    }
  }

  return undefined;
}

export function resolveMenuItemIcon( item?: MenuItemIconSource | null ): ResolvedMenuItemIcon | undefined {
  if (!item) {
    return undefined;
  }

  for (const rawIcon of getRawIconCandidates(item)) {
    const solidIcon = parseSolidIconMeta(rawIcon);

    if (solidIcon) {
      return {
        kind: "solid",
        name: solidIcon.name,
        spin: solidIcon.spin,
      };
    }

    const materialIcon = resolveMaterialIconName(rawIcon);

    if (materialIcon) {
      return {
        kind: "material",
        name: materialIcon,
      };
    }
  }

  const derivedMaterialIcon = getAliasTextCandidates(item)
    .map(resolveMaterialIconName)
    .find(Boolean);

  if (derivedMaterialIcon) {
    return {
      kind: "material",
      name: derivedMaterialIcon,
    };
  }

  return resolveAliasedIcon(item);
}