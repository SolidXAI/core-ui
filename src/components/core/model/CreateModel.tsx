"use client"

import { CancelButton } from "@/components/common/CancelButton";
import { handleError } from "@/helpers/ToastContainer";
import { useGetFieldDefaultMetaDataQuery } from "@/redux/api/fieldApi";
import { useCreatemodelMutation, useDeletemodelMutation, useLazyGetModelsQuery, useUpdatemodelMutation } from "@/redux/api/modelApi";
import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { TabPanel, TabView } from "primereact/tabview";
import { Toast } from "primereact/toast";
import qs from "qs";
import { useEffect, useRef, useState } from "react";
import FieldMetaData from "./FieldMetaData";
import ModelMetaData from "./ModelMetaData";
import { BackButton } from "@/components/common/BackButton";
import { SolidFormStepper } from "@/components/common/SolidFormStepper";


interface ErrorResponseData {
  message: string;
  statusCode: number;
  error: string;
}

const CreateModel = ({ data, params }: any) => {

  const toast = useRef<Toast>(null);
  const router = useRouter();
  const pathname = usePathname();
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

  const [activeIndex, setActiveIndex] = useState<number>(0);
  // added to track error to change tab color
  const [tabErrors, setTabErrors] = useState<{ [key: number]: boolean }>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const nextTab = () => {
    setActiveIndex(activeIndex + 1);
  };

  useEffect(() => {
    if (data) {
      const modelData = {
        ...data, moduleId: data?.module?.id
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
        let firstErrorTab: number | undefined;
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          const errorMessages = Object.values(errors);
          errorMessages.forEach((error) => {
            handleError([error]); // Call handleError for each error separately
          });
      
          firstErrorTab = 0; // Model Metadata tab has errors
        } else {
          setFormErrors({}); 
        }
  
        if (fieldMetaData.length === 0) {
          handleError(["Please add at least one field"]);
          firstErrorTab = firstErrorTab ?? 1; // If no prior error, set to Field tab
        }
  
        if (firstErrorTab !== undefined) {
          setTabErrors({ [firstErrorTab]: true }); // Set error only on the first tab with an issue
          setActiveIndex(firstErrorTab); // Switch to the tab with an error
        } else {
          handleFormSubmit();
        }
      });
    }
  };


  const handleFormSubmit = async () => {

    if (data) {
      const fieldData = fieldMetaData.map(({ createdAt, updatedAt, deletedAt, mediaStorageProvider, identifier, ...rest }: any) => {
        if (rest.mediaMaxSizeKb) {
          rest.mediaMaxSizeKb = rest.mediaMaxSizeKb ? rest.mediaMaxSizeKb * 1024 : 0
        }
        return rest
      });
      const { module, createdAt, updatedAt, id, deletedAt, ...modelData } = modelMetaData;
      const updateData = { ...modelData, displayName: modelData.displayName.trim(), fields: fieldData };
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
        const { module, ...modelData } = modelMetaData;
        const data = { ...modelData, displayName: modelData.displayName.trim(), fields: fieldData };
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
      toast?.current?.show({
        severity: "error",
        summary: "Can you send me the report?",
        // sticky: true,
        life: 3000,
        //@ts-ignore
        content: (props) => (
          <div
            className="flex flex-column align-items-left"
            style={{ flex: "1" }}
          >
            {errorMessages.map((m, index) => (
              <div className="flex align-items-center gap-2" key={index}>
                <span className="font-bold text-900">{String(m)}</span>
              </div>
            ))}
          </div>
        ),
      });
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
          handleError(error); // Call the centralized error handler
        }
      });
    }

  }, [isCreateModelError, isDeleteModelError, isUpdateModelError])

  // Added useEffect to remove active tab class border color if error is there.
  useEffect(() => {
    const tabHeaders = document.querySelectorAll(".p-tabview-nav li");
    if (tabHeaders.length > 0) {
      if (tabErrors[0]) {
        tabHeaders[0].classList.remove("p-highlight");
      }
      if (tabErrors[1]) {
        tabHeaders[1].classList.remove("p-highlight");
      }
    }
  }, [tabErrors]);



  return (
    <div className="solid-form-wrapper">
      <Toast ref={toast} />

      <div className="solid-form-header">
        {params.id === "new" ?
          <>
            <div className="flex align-items-center gap-3">
              <BackButton />
              <div className="form-wrapper-title">Create Model</div>
            </div>
            <div className="gap-3 flex">
              <Button label="Save" size="small" onClick={handleSubmit} type="submit" />
              <CancelButton />
            </div>
          </>
          :
          <>
            <div className="flex align-items-center gap-3">
              <BackButton />
              <div className="form-wrapper-title">Edit Model</div>
            </div>
            <div className="gap-3 flex">
              {data?.isSystem !== true &&
                <>
                  <div>
                    <Button label="Save" size="small" type="submit" onClick={handleSubmit} />
                  </div>
                  <div>
                    <Button outlined label="Delete" size="small" severity="danger" type="button" onClick={deleteModelFunction} />
                  </div>
                </>
              }
              <CancelButton />
            </div>
          </>
        }
      </div>
      <div className="solid-form-stepper">
        <SolidFormStepper />
      </div>
      <div className="p-4 solid-form-content">
        <div className="grid">
          <div className="col-8 mx-auto">
            <TabView
              activeIndex={activeIndex}
              onTabChange={(e) => {
                if (activeIndex == 0) {
                  formikModelMetadataRef.current.handleSubmit();
                  setActiveIndex(e.index)

                }
                if (activeIndex == 1) {
                  setActiveIndex(e.index)
                }

              }}
            >
              <TabPanel header="Model"
                headerClassName={tabErrors[0] ? "tab-error" : ""}>
                <ModelMetaData
                  modelMetaData={modelMetaData}
                  setModelMetaData={setModelMetaData}
                  allModelsNames={allModelsNames}
                  deleteModelFunction={deleteModelFunction}
                  nextTab={nextTab}
                  formikModelMetadataRef={formikModelMetadataRef}
                  params={params}
                  formErrors= {formErrors}
                ></ModelMetaData>
              </TabPanel>
              <TabPanel header="Fields" 
                headerClassName={tabErrors[1] ? "tab-error" : ""}>
                <FieldMetaData
                  modelMetaData={modelMetaData}
                  fieldMetaData={fieldMetaData}
                  setFieldMetaData={setFieldMetaData}
                  deleteModelFunction={deleteModelFunction}
                  nextTab={nextTab}
                  formikFieldsMetadataRef={formikFieldsMetadataRef}
                ></FieldMetaData>
              </TabPanel>
            </TabView>
          </div>
        </div>
      </div>
    </div >
  );
};

export default CreateModel;
