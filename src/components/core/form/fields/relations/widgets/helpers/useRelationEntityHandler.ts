import { useState } from "react";
import qs from "qs";
import { createSolidEntityApi } from "../../../../../../../redux/api/solidEntityApi";

export type RelationItem = {
  label: string;
  value: any;
  original?: any;
};

export const useRelationEntityHandler = ({ fieldContext, autoCompleteLimit = 1000 }: any) => {
  const fieldMetadata = fieldContext.fieldMetadata;
  const fieldLayoutInfo = fieldContext.field;

  const entityApi = createSolidEntityApi(fieldMetadata.relationCoModelSingularName);
  const { useLazyGetSolidEntitiesQuery } = entityApi;
  const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

  const parentEntityApi = createSolidEntityApi(fieldContext.modelName);
  const { usePatchUpdateSolidEntityMutation, useUpdateSolidEntityMutation } = parentEntityApi;
  const [updateSolidEntity] = usePatchUpdateSolidEntityMutation();

  /**
   * AUTOCOMPLETE & CHECKBOX:
   * The currently linked items — drives what chips are shown in the autocomplete
   * and which checkboxes are checked.
   */
  const [currentValues, setCurrentValues] = useState<RelationItem[]>([]);

  /**
   * CHECKBOX ONLY:
   * All possible options to render as checkboxes.
   * For autocomplete this is not needed — options are fetched on user search input.
   */
  const [allOptions, setAllOptions] = useState<RelationItem[]>([]);

  /**
   * AUTOCOMPLETE ONLY:
   * The live suggestion list shown in the dropdown while the user is typing.
   * Populated by `fetchSuggestions` on each keystroke.
   */
  const [suggestions, setSuggestions] = useState<RelationItem[]>([]);

  // ─── Internal ────────────────────────────────────────────────────────────────

  const sendLinkCommand = async (item: RelationItem, command: "link" | "unlink") => {
    const parentId = fieldContext.data?.id;
    const fieldName = fieldLayoutInfo.attrs.name;

    if (!parentId || parentId === "new") return;

    const formData = new FormData();
    formData.append(`${fieldName}Ids[0]`, item.value);
    formData.append(`${fieldName}Command`, command);

    await updateSolidEntity({ id: parentId, data: formData }).unwrap();
  };

  // ─── Shared ──────────────────────────────────────────────────────────────────

  /**
   * Fetch currently linked items and populate `currentValues`.
   * Call on mount for both autocomplete and checkbox widgets.
   */
  const fetchCurrentValues = async () => {
    const relationFieldName =
      fieldContext.fieldMetadata?.relationCoModelFieldName ?? fieldContext.modelName;

    const parentId = fieldContext.data?.id ?? -1;

    const queryData = {
      offset: 0,
      limit: autoCompleteLimit,
      filters: {
        $and: [{ [relationFieldName]: { id: { $eq: parentId } } }],
      },
    };

    const response = await triggerGetSolidEntities(qs.stringify(queryData, { encodeValuesOnly: true }));
    if (!response.data) return;

    const mapped: RelationItem[] = response.data.records.map((item: any) => ({
      label: item[fieldMetadata?.relationModel?.userKeyField?.name],
      value: item.id,
      original: item,
    }));

    setCurrentValues(mapped);
  };

  /**
   * Link an item: fire the API call, and on success update `currentValues`.
   * Used by both autocomplete (onSelect) and checkbox (onChange when unchecked).
   */
  const linkItem = async (item: RelationItem) => {
    try {
      await sendLinkCommand(item, "link");
      setCurrentValues((prev) =>
        prev.some((s) => s.value === item.value) ? prev : [...prev, item]
      );
    } catch (error: any) {
      console.error(error?.data?.message || error?.message || `Failed to link ${fieldMetadata.displayName}`);
    }
  };

  /**
   * Unlink an item: fire the API call, and on success update `currentValues`.
   * Used by both autocomplete (onUnselect) and checkbox (onChange when checked).
   */
  const unlinkItem = async (item: RelationItem) => {
    try {
      await sendLinkCommand(item, "unlink");
      setCurrentValues((prev) => prev.filter((s) => s.value !== item.value));
    } catch (error: any) {
      console.error(error?.data?.message || error?.message || `Failed to unlink ${fieldMetadata.displayName}`);
    }
  };

  // ─── Autocomplete-specific ───────────────────────────────────────────────────

  /**
   * Fetch suggestions for the autocomplete dropdown based on the user's search query.
   * Call this inside `completeMethod` of the AutoComplete component.
   */
  const fetchSuggestions = async (autocompleteQs = "") => {
    const response = await triggerGetSolidEntities(autocompleteQs);
    if (!response.data) return;

    const mapped: RelationItem[] = response.data.records.map((item: any) => ({
      label: item[fieldMetadata?.relationModel?.userKeyField?.name],
      value: item["id"],
      original: item,
    }));

    setSuggestions(mapped);
  };

  // ─── Checkbox-specific ───────────────────────────────────────────────────────

  /**
   * Fetch all possible options for the checkbox list.
   * Call this on mount for the checkbox widget.
   */
  const fetchAllOptions = async (autocompleteQs = "") => {
    const response = await triggerGetSolidEntities(autocompleteQs);
    if (!response.data) return;

    const mapped: RelationItem[] = response.data.records.map((item: any) => ({
      label: item[fieldMetadata?.relationModel?.userKeyField?.name],
      value: item["id"],
      original: item,
    }));

    setAllOptions(mapped);
  };

  // ─── Inline create ───────────────────────────────────────────────────────────

  /**
   * Handle an inline-created entity: link it and add to both `currentValues`
   * and `allOptions` (so it shows up in the checkbox list immediately).
   */
  const addNewRelation = async (values: any) => {
    const jsonValues = Object.fromEntries(values.entries());
    const newItem: RelationItem = {
      label: jsonValues[fieldMetadata?.relationModel?.userKeyField?.name],
      value: "new",
      original: jsonValues,
    };

    await linkItem(newItem);

    // Also add to allOptions so checkbox widget shows the new item
    setAllOptions((prev) =>
      prev.some((s) => s.value === newItem.value) ? prev : [...prev, newItem]
    );
  };

  return {
    // State
    currentValues,
    allOptions,
    suggestions,
    // Shared
    fetchCurrentValues,
    linkItem,
    unlinkItem,
    // Autocomplete-specific
    fetchSuggestions,
    // Checkbox-specific
    fetchAllOptions,
    // Inline create
    addNewRelation,
  };
};