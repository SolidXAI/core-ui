import { env } from "../adapters/env";

const encodeAssetUrl = (src: string) => src.replace(/ /g, "%20");

export const normalizeAssetUrl = (src?: string | null) => {
  if (!src) return "";

  const trimmedSrc = src.trim();
  if (!trimmedSrc) return "";

  const resolvedSrc =
    trimmedSrc.startsWith("blob:") ||
    trimmedSrc.startsWith("http") ||
    trimmedSrc.startsWith("/")
      ? trimmedSrc
      : `${env("API_URL")}/${trimmedSrc}`;

  return encodeAssetUrl(resolvedSrc);
};

export const toCssBackgroundImage = (src?: string | null) => {
  const normalizedSrc = normalizeAssetUrl(src);
  if (!normalizedSrc) return undefined;

  return `url("${normalizedSrc.replace(/"/g, '\\"')}")`;
};
