/**
 * Normalizes relation display values into safe text for UI rendering.
 *
 * Relation labels in Solid can come from a configured `userKeyField`, but in
 * some edge cases that field may contain locale maps or other JSON-shaped
 * values instead of plain text. These helpers prevent raw objects from being
 * passed into React by:
 * - returning scalar values as strings
 * - collapsing arrays into comma-separated text
 * - preferring common label-like object keys such as `label` or `displayName`
 * - falling back through nested object values and finally `JSON.stringify`
 *
 * `getRelatedRecordDisplayText` applies that normalization to a related record
 * and falls back from the configured user-key field to `displayName`, `name`,
 * and `id` when needed.
 *
 * For arbitrary JSON:
 * - arrays are normalized item-by-item and joined with `, `
 * - objects return the first readable nested text that can be derived
 * - if no readable nested text is found, the object is stringified as JSON
 *
 * Examples:
 * - `getRelationDisplayText("Acme")` -> `"Acme"`
 * - `getRelationDisplayText({ en_US: "Acme", fr_FR: "Acme FR" })` -> `"Acme"`
 * - `getRelationDisplayText({ label: "Acme", value: 12 })` -> `"Acme"`
 * - `getRelationDisplayText(["A", { en_US: "B" }])` -> `"A, B"`
 * - `getRelationDisplayText({ firstName: "Harish", lastName: "Patel" })` -> `"Harish"`
 * - `getRelationDisplayText({ foo: {}, bar: [] })` -> `"{}"`
 *   This reaches the final `JSON.stringify` fallback because no readable
 *   scalar text can be derived from the nested values.
 * - `getRelatedRecordDisplayText({ code: { en_US: "A-100" }, id: 7 }, "code")` -> `"A-100"`
 * - `getRelatedRecordDisplayText({ id: 7 }, "missingField")` -> `"7"`
 */
const RELATION_DISPLAY_CANDIDATE_KEYS = [
    "label",
    "displayName",
    "name",
    "title",
    "value",
    "text",
];

export const getRelationDisplayText = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => getRelationDisplayText(item))
            .filter(Boolean)
            .join(", ");
    }

    if (typeof value === "object") {
        const objectValue = value as Record<string, unknown>;

        for (const key of RELATION_DISPLAY_CANDIDATE_KEYS) {
            const candidate = objectValue[key];
            const candidateText = getRelationDisplayText(candidate);
            if (candidateText) {
                return candidateText;
            }
        }

        for (const candidate of Object.values(objectValue)) {
            const candidateText = getRelationDisplayText(candidate);
            if (candidateText) {
                return candidateText;
            }
        }

        try {
            return JSON.stringify(objectValue);
        } catch {
            return "";
        }
    }

    return String(value);
};

export const getRelatedRecordDisplayText = (record: Record<string, unknown> | null | undefined, userKeyField?: string): string => {
    if (!record) {
        return "";
    }

    const rawDisplayValue = userKeyField ? record[userKeyField] : undefined;

    return getRelationDisplayText(
        rawDisplayValue ?? record.displayName ?? record.name ?? record.id
    );
};
