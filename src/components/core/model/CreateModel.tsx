

import { useGetFieldDefaultMetaDataQuery } from "../../../redux/api/fieldApi";
import { useCreatemodelMutation, useDeletemodelMutation, useLazyGetModelsQuery, useUpdatemodelMutation } from "../../../redux/api/modelApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import qs from "qs";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../redux/features/toastSlice";
import FieldMetaData from "./FieldMetaData";
import ModelMetaData from "./ModelMetaData";
import { SolidFormStepper } from "../../../components/common/SolidFormStepper";
import { SolidBreadcrumb } from "../../../components/common/SolidBreadcrumb";
import { SolidFormHeader } from "../../../components/common/SolidFormHeader";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { SolidButton, SolidDialog, SolidDivider, SolidPopover, SolidPopoverContent, SolidPopoverTrigger, SolidTabGroup } from "../../shad-cn-ui";
import { Settings, Trash2 } from "lucide-react";
import { SolidFormFooter } from "../form/SolidFormFooter";

interface ErrorResponseData {
  message: string;
  statusCode: number;
  error: string;
}

const TABS = ["model", "fields"] as const;
type TabValue = typeof TABS[number];

const getTabErrorState = (tab?: TabValue): Record<TabValue, boolean> => ({
  model: tab === "model",
  fields: tab === "fields",
});

const CreateModel = ({ data, params }: any) => {

  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [deleteEntity, setDeleteEntity] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(data ? true : false);
  const formikModelMetadataRef = useRef<any>();
  const formikFieldsMetadataRef = useRef();

  const [modelMetaData, setModelMetaData] = useState<any>();
  const [fieldMetaData, setFieldMetaData] = useState<any>([]);

  const { data: fieldDefaultMetaData, refetch } = useGetFieldDefaultMetaDataQuery(null);
  const [allModelsNames, setAllModelsNames] = useState([]);

  const [triggerGetModels, { data: allmodels, isLoading: isAllModelsLoaded, error: allModelsError }] =
    useLazyGetModelsQuery();


  const [
    createModel,
    { isLoading: isCreateModelLoading, isSuccess: isCreateModelSuccess, isError: isCreateModelError, error: createModelError, data: newModel },
  ] = useCreatemodelMutation();

  const [
    updateModel,
    { isLoading: isUpdatedModelUpdating, isSuccess: isUpdatedModelSuceess, isError: isUpdateModelError, error: updateModelError, data: updatedModel },
  ] = useUpdatemodelMutation();
  const [
    deleteModel,
    { isLoading: isModelDeleted, isSuccess: isDeleteModelSuceess, isError: isDeleteModelError, error: deleteModelError, data: DeletedModel },
  ] = useDeletemodelMutation();

  const [activeTab, setActiveTab] = useState<TabValue>("model");
  const [tabErrors, setTabErrors] = useState<Record<TabValue, boolean>>(getTabErrorState());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const nextTab = () => {
    const currentIndex = TABS.indexOf(activeTab);
    const nextValue = TABS[Math.min(currentIndex + 1, TABS.length - 1)];
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
      const isLegacyTable = data.isLegacyTableWithId || data.isLegacyTable
      const isLegacyTableWithId = data.isLegacyTable;
      const modelData = {
        ...data, moduleId: data?.module?.id, parentModelId: data?.parentModel, isLegacyTable, isLegacyTableWithId
      }

      setIsLoadingData(false);
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
  }, [isDeleteModelSuceess]);

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

    if (modelMetaData?.isLegacyTable && modelMetaData?.isLegacyTableWithId) {
      // UI: Both checked → Backend: both true
      legacyTableConfig = {
        isLegacyTable: true,
        isLegacyTableWithId: false
      };
    } else if (modelMetaData?.isLegacyTable && !modelMetaData?.isLegacyTableWithId) {
      // UI: Only isLegacyTable checked → Backend: only isLegacyTableWithId true
      legacyTableConfig = {
        isLegacyTable: false,
        isLegacyTableWithId: true
      };
    } else {
      // UI: Neither checked → Backend: both false
      legacyTableConfig = {
        isLegacyTable: false,
        isLegacyTableWithId: false
      };
    }

    if (modelMetaData?.isLegacyTable || modelMetaData?.isLegacyTableWithId) {
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

  const deleteModelFunction = async () => {
    deleteModel(data?.id);
  }

  useEffect(() => {
    if (isCreateModelSuccess == true || isUpdatedModelSuceess == true || isDeleteModelSuceess == true) {
      // router.push(`/admin/app-builder/model/all`);
      router.back();
    }
  }, [isCreateModelSuccess, isUpdatedModelSuceess, isDeleteModelSuceess])

  const showError = async (errors: any) => {
    const errorMessages = Object.values(errors);

    if (errorMessages.length > 0) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.SEND_REPORT, detail: errorMessages.map(String).join(', '), life: 3000 }));
    }
  };

  const isFetchBaseQueryErrorWithErrorResponse = (error: any): error is FetchBaseQueryError & { data: ErrorResponseData } => {
    return error && typeof error === 'object' && 'data' in error && 'message' in error.data;
  }

  // const handleError = (errorToast: any) => {
  //   let errorMessage: any = ['An error occurred'];

  //   if (isFetchBaseQueryErrorWithErrorResponse(errorToast)) {
  //     errorMessage = errorToast.data.message;
  //   } else {
  //     errorMessage = ['Something went wrong'];
  //   }

  //   toast?.current?.show({
  //     severity: 'error',
  //     summary: 'Error',
  //     detail: errorMessage,
  //     life: 3000,
  //     //@ts-ignore
  //     content: (props) => (
  //       <div className="flex flex-column align-items-left" style={{ flex: "1" }}>
  //         {Array.isArray(errorMessage) ? (
  //           errorMessage.map((message, index) => (
  //             <div className="flex align-items-center gap-2" key={index}>
  //               <span className="font-bold text-900">{message.trim()}</span>
  //             </div>
  //           ))
  //         ) : (
  //           <div className="flex align-items-center gap-2">
  //             <span className="font-bold text-900">{errorMessage?.trim()}</span>
  //           </div>
  //         )}
  //       </div>
  //     ),
  //   });
  // };


  // Error Handler 
  // Added useEffect to remove active tab class border color if error is there.

  useEffect(() => {
    const errors = [
      { isError: isCreateModelError, error: createModelError },
      { isError: isDeleteModelError, error: deleteModelError },
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

  }, [isCreateModelError, isDeleteModelError, isUpdateModelError])
  const [formActionsMenuOpen, setFormActionsMenuOpen] = useState(false);
  const formActionDropdown = () => (
    <SolidPopover open={formActionsMenuOpen} onOpenChange={setFormActionsMenuOpen}>
      <SolidPopoverTrigger asChild>
        <SolidButton
          variant="ghost"
          size="sm"
          className="solid-icon-button"
          aria-label="Model actions"
        >
          <Settings size={16} />
        </SolidButton>
      </SolidPopoverTrigger>
      <SolidPopoverContent
        side="bottom"
        align="end"
        className="solid-form-actions-popover"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="solid-row-action-button solid-row-action-button-danger"
          onClick={() => {
            setFormActionsMenuOpen(false);
            setDeleteEntity(true);
          }}
        >
          <Trash2 size={14} className="solid-row-action-button-icon" />
          <span className="solid-row-action-button-label">Delete</span>
        </button>
      </SolidPopoverContent>
    </SolidPopover>
  );

  const [isDirty, setIsDirty] = useState(false);
  const isCreateMode = params.id === "new";
  const headerTitleBase = isCreateMode ? "Create Model" : "Edit Model";
  const headerTitle = `${headerTitleBase}${modelMetaData?.displayName ? ` - ${modelMetaData.displayName}` : ""}`;
  const canShowActionsMenu = !isCreateMode && data?.isSystem !== true;
  const handleCancel = () => router.back();


  return (
    <div className="solid-form-wrapper">
      <div className="solid-form-section" style={{ borderRight: params.embeded !== true ? '1px solid var(--primary-light-color)' : '' }} >
        <div>
          <div className="solid-form-header flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="flex flex-column gap-1">
              {/* <span className="text-sm text-color-secondary uppercase tracking-wider">Model</span>
            <div className="form-wrapper-title solid-long-text-wrapper m-0">{headerTitle}</div> */}
            </div>
            <div className="flex align-items-center gap-2">
              <SolidButton
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCancel}
                className="bg-primary-reverse"
              >
                Cancel
              </SolidButton>
              {isDirty && (
                <SolidButton size="sm" type="button" onClick={handleSubmit}>
                  Save
                </SolidButton>
              )}
              {canShowActionsMenu && formActionDropdown()}
            </div>
          </div>
          {/* <SolidFormHeader /> */}
          <div className="px-4 py-3 md:p-4 solid-form-content">
          <SolidTabGroup
            className="relative"
            panelClassName="px-0"
            tabs={[
              {
                value: "model",
                label: <span className={tabErrors.model ? "tab-error-heading" : ""}>Model</span>,
                content: (
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
                  ></ModelMetaData>
                ),
              },
              {
                value: "fields",
                label: <span className={tabErrors.fields ? "tab-error-heading" : ""}>Fields</span>,
                content: (
                  <FieldMetaData
                    modelMetaData={modelMetaData}
                    fieldMetaData={fieldMetaData}
                    setFieldMetaData={setFieldMetaData}
                    deleteModelFunction={deleteModelFunction}
                    nextTab={nextTab}
                    formikFieldsMetadataRef={formikFieldsMetadataRef}
                    params={params}
                    setIsDirty={setIsDirty}
                  ></FieldMetaData>
                ),
              },
            ]}
            value={activeTab}
            onValueChange={(value) => {
              const next = TABS.find((tab) => tab === value);
              if (next) {
                handleTabChange(next);
              }
            }}
          />
          </div>
        </div>
        <SolidFormFooter params={params}></SolidFormFooter>

      </div>
      {/* <div style={{ width: '22.5%' }}></div> */}
      <SolidDialog header="Delete Model" headerClassName="py-2" className="solid-confirm-dialog" contentClassName="px-0 pb-0" visible={deleteEntity} style={{ width: '20vw' }} onHide={() => { if (!deleteEntity) return; setDeleteEntity(false); }}>
        <SolidDivider className="m-0" />
        <div className="p-4">
          <p className="m-0 solid-primary-title" style={{ fontSize: 16 }}>
            Are you sure you want to delete this Model?
          </p>
          <p className="" style={{ color: 'var{--solid-grey-500}' }}>{modelMetaData?.singularName}</p>
          <div className="flex align-items-center gap-2 mt-3">
            <SolidButton size="sm" onClick={deleteModelFunction}>
              Delete
            </SolidButton>
            <SolidButton size="sm" variant="outline" onClick={() => setDeleteEntity(false)}>
              Cancel
            </SolidButton>
          </div>
        </div>
      </SolidDialog>

    </div>
  );
};

export default CreateModel;
