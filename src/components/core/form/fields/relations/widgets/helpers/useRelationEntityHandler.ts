import { useState } from "react";
import qs from "qs";
import { createSolidEntityApi } from "../../../../../../../redux/api/solidEntityApi";

export const useRelationEntityHandler = ({ fieldContext, formik, autoCompleteLimit = 1000 }: any) => {
  const fieldMetadata = fieldContext.fieldMetadata;
  const fieldLayoutInfo = fieldContext.field;

  const entityApi = createSolidEntityApi(fieldMetadata.relationCoModelSingularName);
  const { useLazyGetSolidEntitiesQuery } = entityApi;
  const [triggerGetSolidEntities] = useLazyGetSolidEntitiesQuery();

  const parentEntityApi = createSolidEntityApi(fieldContext.modelName);
  const { useUpdateSolidEntityMutation, usePatchUpdateSolidEntityMutation } = parentEntityApi;
  const [updateSolidEntity] = usePatchUpdateSolidEntityMutation();


  const handleRelationUpdate = async (updatedItems: any[]) => {
    const parentId = fieldContext.data?.id;
    const fieldName = fieldLayoutInfo.attrs.name;

    if (!parentId || parentId === "new") {
      return;
    }

    const formData = new FormData();

    updatedItems.forEach((item, index) => {
      formData.append(`${fieldName}Ids[${index}]`, item.value);
    });

    formData.append(`${fieldName}Command`, "update");

    try {
      await updateSolidEntity({ id: parentId, data: formData }).unwrap();
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        `Failed to update ${fieldMetadata.displayName}`;
    }


  };


  const [autoCompleteItems, setAutoCompleteItems] = useState([]);

  const fetchRelationEntities = async (autocompleteQs = "", limit = autoCompleteLimit) => {
    // const queryData = {
    //   offset: 0,
    //   limit: limit,
    //   filters: {
    //     [fieldMetadata?.relationModel?.userKeyField?.name]: {
    //       '$containsi': query
    //     }
    //   }
    // };

    // const autocompleteQs = qs.stringify(queryData, { encodeValuesOnly: true });

    const response = await triggerGetSolidEntities(autocompleteQs);
    const data = response.data;

    if (data) {
      const mappedItems = data.records.map((item: any) => ({
        label: item[fieldMetadata?.relationModel?.userKeyField?.name],
        value: item['id'],
        original: item
      }));
      setAutoCompleteItems(mappedItems);
    }
  };

  const populateFormikWithRelatedEntities = async () => {

    /**
     * Example:
     * permissions filtered by roles.id = current role id
     */

    const relationFieldName =
      fieldContext.fieldMetadata?.relationCoModelFieldName ??
      fieldContext.modelName;

    const parentId = fieldContext.data?.id ?? -1;

    const queryData = {
      offset: 0,
      limit: autoCompleteLimit,
      filters: {
        $and: [
          {
            [relationFieldName]: {
              id: { $eq: parentId },
            },
          },
        ],
      },
    };

    const qsString = qs.stringify(queryData, {
      encodeValuesOnly: true,
    });

    const response = await triggerGetSolidEntities(qsString);
    const data = response.data;

    if (!data) return;

    const mappedItems = data.records.map((item: any) => ({
      label: item[fieldMetadata?.relationModel?.userKeyField?.name],
      value: item.id,
      original: item,
    }));

    /**
     * IMPORTANT:
     * 1. Set checkbox options
     * 2. Set formik selected values (checked state)
     */
    formik.setFieldValue(fieldLayoutInfo.attrs.name, mappedItems);
  };

  const addNewRelation = (values: any) => {
    const currentData = formik.values[fieldLayoutInfo.attrs.name] || [];
    const jsonValues = Object.fromEntries(values.entries());
    const newItem = {
      label: jsonValues[fieldMetadata?.relationModel?.userKeyField?.name],
      value: "new",
      original: jsonValues,
    };

    const updatedItems = [...currentData, newItem];
    formik.setFieldValue(fieldLayoutInfo.attrs.name, updatedItems);

    setAutoCompleteItems((prev: any) => {
      const exists = prev.some((item: any) => item.label === newItem.label);
      return exists ? prev : [...prev, newItem];
    });

    // Trigger update immediately after inline create
    handleRelationUpdate(updatedItems);
  };

  return {
    autoCompleteItems,
    fetchRelationEntities,
    populateFormikWithRelatedEntities,
    handleRelationUpdate,
    addNewRelation
  };
};
