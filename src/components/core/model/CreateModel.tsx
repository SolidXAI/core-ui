
import { useGetFieldDefaultMetaDataQuery } from "../../../redux/api/fieldApi";
import { useCreatemodelMutation, useLazyGetModelsQuery, useUpdatemodelMutation } from "../../../redux/api/modelApi";
import { useRouter } from "../../../hooks/useRouter";
import qs from "qs";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../redux/features/toastSlice";
import FieldMetaData from "./FieldMetaData";
import ModelMetaData from "./ModelMetaData";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { SolidButton, SolidTabGroup } from "../../shad-cn-ui";
import { SolidFormFooter } from "../form/SolidFormFooter";
import { ModuleMetadataExplorer } from "../module/ModuleMetadataExplorer";
import "./CreateModel.css";

const TABS = ["model", "fields", "explorer"] as const;
type TabValue = typeof TABS[number];

const getTabErrorState = (tab?: TabValue): Record<TabValue, boolean> => ({
  model: tab === "model",
  fields: tab === "fields",
  explorer: false,
});

const CreateModel = ({ data, params }: any) => {

  const dispatch = useDispatch();
  const router = useRouter();
  const isCreateMode = params.id === "new";
  const formikModelMetadataRef = useRef<any>();
  const formikFieldsMetadataRef = useRef();

  const [modelMetaData, setModelMetaData] = useState<any>();
  const [fieldMetaData, setFieldMetaData] = useState<any>([]);

  useGetFieldDefaultMetaDataQuery(null);
  const [allModelsNames, setAllModelsNames] = useState([]);

  const [triggerGetModels, { data: allmodels }] =
    useLazyGetModelsQuery();


  const [
    createModel,
    { isSuccess: isCreateModelSuccess, isError: isCreateModelError, error: createModelError },
  ] = useCreatemodelMutation();

  const [
    updateModel,
    { isSuccess: isUpdatedModelSuceess, isError: isUpdateModelError, error: updateModelError },
  ] = useUpdatemodelMutation();
  const [activeTab, setActiveTab] = useState<TabValue>("model");
  const [tabErrors, setTabErrors] = useState<Record<TabValue, boolean>>(getTabErrorState());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const deleteModelFunction = async () => {};
  const availableTabs: readonly TabValue[] = isCreateMode ? ["model", "fields"] : TABS;

  const nextTab = () => {
    const currentIndex = availableTabs.indexOf(activeTab as (typeof availableTabs)[number]);
    const nextValue = availableTabs[Math.min(Math.max(currentIndex, 0) + 1, availableTabs.length - 1)];
    setActiveTab(nextValue);
  };

  const handleTabChange = (nextValue: TabValue) => {
    if (nextValue === activeTab) {
      return;
    }
    if (activeTab === "model") {
      formikModelMetadataRef.current?.handleSubmit();
    }
    setActiveTab(nextValue);
  };

  useEffect(() => {
    if (data) {
      const isLegacyTable = data.legacyTableType !== 'none'
      const hasExistingId = data.legacyTableType === 'existing_id'
      const modelData = {
        ...data, moduleId: data?.module?.id, parentModelId: data?.parentModel, isLegacyTable, hasExistingId
      }

      setModelMetaData(modelData);
      const fieldData = data.fields.map((f: any) => {
        const fieldCopy = { ...f }; // Create a shallow copy of the field object
        fieldCopy.identifier = f.id; // Add the identifier property
        if (fieldCopy.type == "mediaSingle" || fieldCopy.type == "mediaMultiple") {
          fieldCopy.mediaMaxSizeKb = f.mediaMaxSizeKb / 1024; // Add the identifier property

        }
        return fieldCopy;
      })
      setFieldMetaData(fieldData.sort((a: any, b: any) => b.id - a.id))
    }
  }, [data])


  useEffect(() => {
    const queryData = {
      offset: 0,
      limit: 1000,
    };
    const queryString = qs.stringify(queryData, {
      encodeValuesOnly: true
    });
    triggerGetModels(queryString);
  }, []);

  useEffect(() => {
    if (allmodels) {
      if (data) {
        setAllModelsNames(allmodels?.records.filter((i: any) => i.id !== data.id).map((e: any) => e.singularName));

      } else {

        setAllModelsNames(allmodels?.records.map((e: any) => e.singularName));
      }
    }
  }, [allmodels, data]);


  const handleSubmit = async () => {

    if (formikModelMetadataRef.current) {
      await formikModelMetadataRef.current.submitForm(); // Call the handleSubmit function from the formik instance

      // @ts-ignore
      // formikModelMetadataRef.current.validateForm().then(() => {
      //   if (Object.keys(formikModelMetadataRef?.current?.errors).length === 0) {

      //     if (fieldMetaData.length > 0) {
      //       handleFormSubmit();
      //     } else {
      //       if (activeIndex === 0) {
      //         nextTab();
      //         // showError({ error: "Please add Atleast one field" });
      //         handleError(["Please add Atleast one field"])
      //       } else {
      //         handleError(["Please add Atleast one field"])
      //         // showError({ error: "Please add Atleast one field" });
      //       }
      //     }
      //   }
      // });

      formikModelMetadataRef.current.validateForm().then((errors: any) => {
        let firstErrorTab: TabValue | undefined;
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          const errorMessages = Object.values(errors);
          errorMessages.forEach((error) => {
            dispatch(showToast({ severity: 'error', summary: 'Error', detail: Array.isArray(error) ? error.join(', ') : String(error) }));
          });

          firstErrorTab = "model"; // Model Metadata tab has errors
        } else {
          setFormErrors({});
        }

        if (fieldMetaData.length === 0) {
          dispatch(showToast({ severity: 'error', summary: 'Error', detail: ERROR_MESSAGES.ADD_ATLEAST_ONE_FIELD }));
          firstErrorTab = firstErrorTab ?? "fields"; // If no prior error, set to Field tab
        }

        if (firstErrorTab !== undefined) {
          setTabErrors(getTabErrorState(firstErrorTab)); // Set error only on the first tab with an issue
          setActiveTab(firstErrorTab); // Switch to the tab with an error
        } else {
          setTabErrors(getTabErrorState());
          handleFormSubmit();
        }
      });
    }
  };


  const handleFormSubmit = async () => {

    let legacyTableConfig = {};

    let legacyTableType = 'none';
    if (modelMetaData?.isLegacyTable && modelMetaData?.hasExistingId) {
      legacyTableType = 'existing_id';
    } else if (modelMetaData?.isLegacyTable) {
      legacyTableType = 'generated_id';
    }
    legacyTableConfig = { legacyTableType };

    if (modelMetaData?.isLegacyTable) {
      const hasPrimaryKey = fieldMetaData.some(
        (field: any) => field.isPrimaryKey === true
      );

      if (!hasPrimaryKey) {
        dispatch(showToast({ severity: "error", summary: "Primary Key Required", detail: "Legacy tables set at least one field marked as Primary Key. Please mark a field as Primary Key before proceeding.", life: 5000 }));
        return;
      }
    }

    if (data) {
      const fieldData = fieldMetaData.map(({ createdAt, updatedAt, deletedAt, mediaStorageProvider, identifier, ...rest }: any) => {
        if (rest.mediaMaxSizeKb) {
          rest.mediaMaxSizeKb = rest.mediaMaxSizeKb ? rest.mediaMaxSizeKb * 1024 : 0
        }
        return rest
      });
      const { module, parentModel, createdAt, updatedAt, id, deletedAt, ...modelData } = modelMetaData;
      const updateData = { ...modelData, displayName: modelData.displayName.trim(), fields: fieldData, ...legacyTableConfig };
      updateModel({ id: data.id, data: updateData });
    }
    else {
      if (modelMetaData) {
        const fieldData = fieldMetaData.map(({ mediaStorageProvider, identifier, ...rest }: any) => {
          if (rest.mediaMaxSizeKb) {
            rest.mediaMaxSizeKb = rest.mediaMaxSizeKb ? rest.mediaMaxSizeKb * 1024 : 0
          }
          return rest
        });
        const { module, parentModel, ...modelData } = modelMetaData;
        const data = { ...modelData, displayName: modelData.displayName.trim(), fields: fieldData, ...legacyTableConfig };
        createModel(data);
        if (isCreateModelSuccess) {

        }
      }
    }
  };

  useEffect(() => {
    if (isCreateModelSuccess == true || isUpdatedModelSuceess == true) {
      // router.push(`/admin/app-builder/model/all`);
      router.back();
    }
  }, [isCreateModelSuccess, isUpdatedModelSuceess])

  useEffect(() => {
    const errors = [
      { isError: isCreateModelError, error: createModelError },
      { isError: isUpdateModelError, error: updateModelError },
    ];
    if (errors.length > 0) {
      // Handle any error
      errors.forEach(({ isError, error }) => {
        if (isError && error) {
          const errorMessage = error && typeof error === 'object' && 'data' in error && 'message' in (error as any).data
            ? (error as any).data.message
            : 'Something went wrong';
          const detail = Array.isArray(errorMessage) ? errorMessage.join(', ') : String(errorMessage);
          dispatch(showToast({ severity: 'error', summary: 'Error', detail }));
        }
      });
    }

  }, [isCreateModelError, isUpdateModelError])

  const [isDirty, setIsDirty] = useState(false);
  const explorerModuleName = data?.module?.name ?? modelMetaData?.module?.name ?? "";
  const explorerModelSingularName = data?.singularName ?? modelMetaData?.singularName ?? "";
  const isReadOnlyModelExplorer = Boolean(
    modelMetaData?.isSystem ||
    data?.isSystem ||
    explorerModuleName.toLowerCase() === "solid-core"
  );
  const shouldShowTabSave = activeTab !== "explorer" && isDirty;

  const modelTabContent = (
    <div className="solid-model-form-content is-tabbed">
      {shouldShowTabSave && activeTab === "model" && (
        <div className="solid-model-form-actions">
          <SolidButton size="sm" type="button" onClick={handleSubmit}>
            Save
          </SolidButton>
        </div>
      )}
      <ModelMetaData
        modelMetaData={modelMetaData}
        setModelMetaData={setModelMetaData}
        allModelsNames={allModelsNames}
        deleteModelFunction={deleteModelFunction}
        nextTab={nextTab}
        formikModelMetadataRef={formikModelMetadataRef}
        params={params}
        formErrors={formErrors}
        setIsDirty={setIsDirty}
      />
    </div>
  );

  const fieldsTabContent = (
    <div className="solid-model-form-content is-tabbed">
      {shouldShowTabSave && activeTab === "fields" && (
        <div className="solid-model-form-actions">
          <SolidButton size="sm" type="button" onClick={handleSubmit}>
            Save
          </SolidButton>
        </div>
      )}
      <FieldMetaData
        modelMetaData={modelMetaData}
        fieldMetaData={fieldMetaData}
        setFieldMetaData={setFieldMetaData}
        deleteModelFunction={deleteModelFunction}
        nextTab={nextTab}
        formikFieldsMetadataRef={formikFieldsMetadataRef}
        params={params}
        setIsDirty={setIsDirty}
      />
    </div>
  );


  return (
    <div className="solid-form-wrapper">
      <div className="solid-form-section" style={{ borderRight: params.embeded !== true ? '1px solid var(--primary-light-color)' : '' }} >
        <div className="solid-model-form-workspace">
          <SolidTabGroup
            className="solid-model-form-tabs"
            listClassName="solid-model-form-tablist"
            panelClassName="solid-model-form-tabpanel"
            tabs={[
              {
                value: "model",
                label: <span className={`solid-model-form-tab-label ${tabErrors.model ? "tab-error-heading" : ""}`}>Model</span>,
                content: modelTabContent,
              },
              {
                value: "fields",
                label: <span className={`solid-model-form-tab-label ${tabErrors.fields ? "tab-error-heading" : ""}`}>Fields</span>,
                content: fieldsTabContent,
              },
              ...(!isCreateMode
                ? [
                    {
                      value: "explorer",
                      label: <span className="solid-model-form-tab-label">Explorer</span>,
                      content: (
                        <ModuleMetadataExplorer
                          moduleName={explorerModuleName}
                          modelSingularName={explorerModelSingularName}
                          readOnly={isReadOnlyModelExplorer}
                          allowSeed={false}
                        />
                      ),
                    },
                  ]
                : []),
            ]}
            value={activeTab}
            onValueChange={(value) => {
              const next = availableTabs.find((tab) => tab === value);
              if (next) {
                handleTabChange(next);
              }
            }}
          />
        </div>
        <SolidFormFooter params={params}></SolidFormFooter>
      </div>
    </div>
  );
};

export default CreateModel;
