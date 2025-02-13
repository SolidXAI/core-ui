"use client"
import { CancelButton } from "@/components/common/CancelButton";
import { DropzonePlaceholder } from "@/components/common/DropzonePlaceholder";
import { DropzoneUpload } from "@/components/common/DropzoneUpload";
import { SingleSelectAutoCompleteField } from "@/components/common/SingleSelectAutoCompleteField";
import { getSingularAndPlural } from "@/helpers/helpers";
import { handleError } from "@/helpers/ToastContainer";
import { useGetFieldDefaultMetaDataQuery } from "@/redux/api/fieldApi";
import { useDeleteMediaMutation } from "@/redux/api/mediaApi";
import { useCreatemoduleMutation, useDeletemoduleMutation, useUpdatemoduleMutation } from "@/redux/api/moduleApi";
import { useFormik } from "formik";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import React, { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSelector } from "react-redux";
import * as Yup from "yup";

const footer = (
  <>
    <Divider />
    <p className="mt-2">Suggestions</p>
    <ul className="pl-2 ml-2 mt-0 line-height-3">
      <li>At least one lowercase</li>
      <li>At least one uppercase</li>
      <li>At least one numeric</li>
      <li>Minimum 8 characters</li>
    </ul>
  </>
);

const CreateModule = ({ data }: any) => {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const pathname = usePathname()
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isImageDialogVisible, setImageDialogVisible] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(data ? true : false);

  const [menuIconPreview, setmenuIconPreview] = useState<
    string | ArrayBuffer | null
  >(null);

  const [
    CreateModule,
    { isLoading, isSuccess, isError, error, data: newModule },
  ] = useCreatemoduleMutation();

  const [
    UpdateModule,
    { isLoading: isModuleUpdateLoading, isSuccess: isModuleUpdateSuccess, isError: isModuleUpdateError, error: updateModuleError, data: updatedModule },
  ] = useUpdatemoduleMutation();

  const { data: fieldDefaultMetaData, isLoading: isFieldDefaultMetaDataLoading, error: FieldDefaultMetaDataError, refetch: fieldDefaultMetaDataRefech } = useGetFieldDefaultMetaDataQuery(null);

  const [
    deleteModule,
    { isLoading: isModuleDeleted, isSuccess: isDeleteModuleSuceess, isError: isModuleDeleteError, error: ModuleDeleteError, data: DeletedModule },
  ] = useDeletemoduleMutation();

  const [
    deleteMedia,
    { isLoading: isMediaDeleted, isSuccess: isDeleteMediaSuceess, isError: isMediaDeleteError, error: mediaDeleteError, data: DeletedMedia },
  ] = useDeleteMediaMutation();

  const initialValues = {
    name: data ? data.name : "",
    displayName: data ? data.displayName : "",
    description: data ? data.description : "",
    defaultDataSource: data ? data.defaultDataSource : "",
    isSystem: data ? data.isSystem : false,
    menuIconUrl: data ? data.menuIconUrl : "",
    menuSequenceNumber: data ? data.menuSequenceNumber : ""
  };

  const visibleModulePopup = useSelector(
    (state: any) => state.popup.visibleModulePopup
  );

  const validationSchema = Yup.object({
    name: Yup.string()
      // .matches(
      //   /^[a-z]+(-[a-z]+)*$/,
      //   "Invalid format. Use lowercase letters and hyphens only."
      // )
      .required("Name is required."),
    displayName: Yup.string().required("Display Name is required"),
    description: Yup.string().required("Description is required"),
    defaultDataSource: Yup.string(),
    menuIconUrl: Yup.string().nullable(),
    isSystem: Yup.boolean(),
    menuSequenceNumber: Yup.number(),

  });

  const dataSources = [
    { label: "Mysql", value: "mysql" },
    { label: "Postgres", value: "postgres" },
    { label: "Mssql", value: "mssql" },
    { label: "Oracle", value: "oracle" },
    { label: "Mariadb", value: "mariadb" },
  ];

  const isFormFieldValid = (formik: any, fieldName: string) =>
    formik.touched[fieldName] && formik.errors[fieldName];

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        let formData = new FormData();
        formData.append('name', values.name);
        formData.append('displayName', values.displayName.trim());
        formData.append('description', values.description);
        formData.append('defaultDataSource', values.defaultDataSource);
        formData.append('isSystem', values.isSystem == "true" ? "true" : "");
        if (values.menuIconUrl) {
          formData.append('menuIconUrl', values.menuIconUrl);
        }
        formData.append('menuSequenceNumber', values.menuSequenceNumber);

        // let formData = new FormData();
        // formData.append('name', values.name);
        // formData.append('displayName', values.displayName);
        // formData.append('description', values.description);
        // formData.append('defaultDataSource', values.defaultDataSource);
        if (data) {
          UpdateModule({ id: data.id, data: formData });
        } else {
          CreateModule(formData);
        }
      } catch (err) {
        console.error("Failed to create menu:", err);
      }
    },
  });


  const handleDropmenuIcon = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      formik.setFieldValue("menuIconUrl", file);

      // Show image preview
      const reader = new FileReader();
      reader.onloadend = () => setmenuIconPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      console.error("No file was accepted");
    }
  };

  const { getRootProps: getRootPropsmenuIcon, getInputProps: getInputPropsmenuIcon, isDragActive: isDragActivemenuIcon } = useDropzone({
    onDrop: handleDropmenuIcon,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/svg+xml': ['.svg']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
  });

  useEffect(() => {
    if (data && data?.menuIconUrl) {
      setmenuIconPreview(`${process.env.API_URL}/${data.menuIconUrl}`);
    }
  }, [data])

  const handleDeleteMenuIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setmenuIconPreview(null);
    formik.setFieldValue("menuIconUrl", null);
  }

  const deteleAction = async () => {
    deleteModule(data.id);
  }

  const showError = async () => {
    const errors = await formik.validateForm(); // Trigger validation and get the updated errors
    const errorMessages = Object.values(errors);

    if (errorMessages.length > 0 && toast.current) {
      handleError(errorMessages)
      // toast.current.show({
      //   severity: "success",
      //   summary: "Can you send me the report?",
      //   // sticky: true,
      //   life: 3000,
      //   //@ts-ignore
      //   content: (props) => (
      //     <div
      //       className="flex flex-column align-items-left"
      //       style={{ flex: "1" }}
      //     >
      //       {errorMessages.map((m: any, index) => (
      //         <div className="flex align-items-center gap-2" key={index}>
      //           <span className="font-bold text-900">{m}</span>
      //         </div>
      //       ))}
      //     </div>
      //   ),
      // });
    }
  };

  const showCustomeError = async (error: string[]) => {
    if (error.length > 0 && toast.current) {
      toast.current.show({
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
            {error.map((m: any, index) => (
              <div className="flex align-items-center gap-2" key={index}>
                <span className="font-bold text-900">{m}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
  };

  useEffect(() => {
    if (isSuccess == true || isDeleteModuleSuceess == true || isModuleUpdateSuccess == true) {
      router.push(`/admin/core/solid-core/module-metadata/list`);
    }
  }, [isSuccess, isDeleteModuleSuceess, isModuleUpdateSuccess])



  const serachDDefaultDataSource = async (event: any) => {
    const query = event.query;
    try {
      const filterredData: any = fieldDefaultMetaData.data.dataSource.filter((t: any) => t.name.toLowerCase().startsWith(query.toLowerCase()));
      const transformedData = filterredData.map((e: any) => ({ label: e.name, value: e.name, type: e.type }));
      return transformedData
    } catch (error) {
      console.error("Error fetching items:", error);
      return []
    }
  };


  // Error Handler 

  useEffect(() => {
    const errors = [
      { isError, error },
      { isError: isModuleUpdateError, error: updateModuleError },
      { isError: isModuleDeleteError, error: ModuleDeleteError },
      { isError: isMediaDeleteError, error: mediaDeleteError },
    ];

    // Handle any error
    errors.forEach(({ isError, error }) => {
      if (isError && error) {
        handleError(error); // Call the centralized error handler
      }
    });
  }, [isError, isModuleUpdateError, isModuleDeleteError, isMediaDeleteError])




  return (
    <div className="grid">
      <div className="col-12 xl:col-12 mx-auto">
        <div>
          <Toast ref={toast} />
          <form onSubmit={formik.handleSubmit}>
            {pathname.includes('create') ?
              <div className="flex gap-3 justify-content-between mb-5">
                <div className="form-wrapper-title" style={{ color: '#000' }}> Create Module</div>

                <div className="gap-3 flex">
                  <div>
                    <Button label="Save" size="small" onClick={() => showError()} type="submit" className="small-button" />
                  </div>
                  <CancelButton />
                </div>
              </div>
              :
              <div className="flex gap-3 justify-content-between mb-5">
                <div className="form-wrapper-title" style={{ color: '#000' }}> Edit Module</div>
                <div className="gap-3 flex">
                  {data?.isSystem !== true &&
                    <>
                      <div>
                        <Button label="Save" size="small" onClick={() => showError()} type="submit" className="small-button" />
                      </div>
                      <div>
                        <Button size="small" type="button" label="Delete" severity="danger" onClick={deteleAction} className="small-button" />
                      </div>
                    </>
                  }
                  <CancelButton />
                </div>
              </div>
            }
            <div className="grid formgrid">
              <div className="md:col-6 sm:col-12 mx-auto">
                <div className="form-wrapper mt-4">
                  <p className="form-wrapper-heading">Basic Info</p>
                  <div className="grid formgrid">
                    <div className="md:col-12 sm:col-12 mx-auto">
                      <div className="field">
                        <label htmlFor="displayName" className="form-label form-field-label">
                          Display Name <span style={{ color: 'red' }}>*</span>
                        </label>
                        <InputText
                          disabled={data ? true : false}
                          type="text"
                          id="displayName"
                          name="displayName"
                          // onChange={formik.handleChange}
                          onChange={(e) => {

                            formik.handleChange(e);
                            const { toKebabCase, toSnakeCase, toPluralCamelCase } = getSingularAndPlural(e.target.value);
                            if (pathname.includes('new')) {
                              formik.setFieldValue("name", toKebabCase);
                            }

                          }}
                          value={formik.values.displayName}
                          className={classNames("p-inputtext-sm small-input w-full", {
                            "p-invalid": isFormFieldValid(formik, "displayName"),
                          })}
                        />
                        {isFormFieldValid(formik, "displayName") && (
                          <Message
                            severity="error"
                            text={formik?.errors?.displayName?.toString()}
                          />
                        )}
                      </div>
                    </div>
                    <div className="md:col-12 sm:col-12 mx-auto">
                      <div className="field">
                        <label htmlFor="name" className="form-label form-field-label">
                          Name <span style={{ color: 'red' }}>*</span>
                        </label>
                        <InputText
                          disabled
                          type="text"
                          id="name"
                          name="name"
                          onChange={formik.handleChange}
                          value={formik.values.name}
                          className={classNames("p-inputtext-sm small-input w-full", {
                            "p-invalid": isFormFieldValid(formik, "name"),
                          })}
                        />
                        {isFormFieldValid(formik, "name") && (
                          <Message severity="error" text={formik?.errors?.name?.toString()} />
                        )}
                      </div>
                    </div>
                    <div className="md:col-12 sm:col-12 mx-auto">
                      <div className="field">
                        <label htmlFor="description" className="form-label form-field-label">
                          Description <span style={{ color: 'red' }}>*</span>
                        </label>
                        <InputTextarea
                          id="description"
                          name="description"
                          onChange={formik.handleChange}
                          value={formik.values.description}
                          className={classNames("p-inputtext-sm w-full", {
                            "p-invalid": isFormFieldValid(formik, "description"),
                          })}
                          rows={5}
                          cols={30}
                        />
                        {isFormFieldValid(formik, "description") && (
                          <Message
                            severity="error"
                            text={formik?.errors?.description?.toString()}
                          />
                        )}
                      </div>
                    </div>

                    <div className="md:col-12 sm:col-12 mx-auto">
                      <div className="field">
                        <label htmlFor="description" className="form-label form-field-label">
                          Menu Sequence Number
                        </label>
                        <InputText
                          id="menuSequenceNumber"
                          type="number"
                          onChange={formik.handleChange}
                          min={0}
                          value={formik.values.menuSequenceNumber}
                          className={classNames("p-inputtext-sm w-full", {
                            "p-invalid": isFormFieldValid(formik, "menuSequenceNumber"),
                          })}
                        />
                        {isFormFieldValid(formik, "menuSequenceNumber") && (
                          <Message
                            severity="error"
                            text={formik?.errors?.menuSequenceNumber?.toString()}
                          />
                        )}
                      </div>
                    </div>



                  </div>
                </div>
              </div>
              <div className="md:col-6 sm:col-12 mx-auto">
                <div className="form-wrapper mt-4">
                  <p className="form-wrapper-heading">Configurations</p>
                  <div className="grid formgrid">

                    <div className="md:col-12 sm:col-12 mx-auto">
                      <div className="field">
                        <label htmlFor="defaultDataSource" className="form-label form-field-label">
                          Default Data Source
                        </label>
                        <SingleSelectAutoCompleteField
                          disabled={data ? true : false}
                          key="defaultDataSource"
                          formik={formik}
                          isFormFieldValid={isFormFieldValid}
                          // relationField={false}
                          fieldName="defaultDataSource"
                          fieldNameId={null}
                          labelKey="label"
                          valueKey="value"
                          className="small-input"
                          searchData={serachDDefaultDataSource}
                          existingData={formik.values.defaultDataSource}
                        />
                        {/* <Dropdown
                      id="defaultDataSource"
                      name="defaultDataSource"
                      value={formik.values.defaultDataSource}
                      options={dataSources}
                      onChange={(e) =>
                        formik.setFieldValue("defaultDataSource", e.value)
                      }
                      placeholder="Select a Data Source"
                      className={classNames("p-inputtext-sm w-full", {
                        "p-invalid": isFormFieldValid(
                          formik,
                          "defaultDataSource"
                        ),
                      })}
                    /> */}
                        {isFormFieldValid(formik, "defaultDataSource") && (
                          <Message
                            severity="error"
                            text={formik?.errors?.defaultDataSource?.toString()}
                          />
                        )}
                      </div>
                    </div>

                    <div className="md:col-12 sm:col-12">
                      <div className="field">
                        <label htmlFor="menuIconUrl" className="form-label form-field-label">
                          Menu Icon <small className="text-red-500 helper-text">(only svg, png and jpeg are allowed)</small>
                        </label>
                        <div {...getRootPropsmenuIcon()} className="dropzone p-3 border-1 border-round surface-border">
                          <input {...getInputPropsmenuIcon()} />
                          {isDragActivemenuIcon ? (
                            <DropzonePlaceholder />
                          ) : (menuIconPreview ? (
                            <div className="relative">
                              <img src={menuIconPreview as string} alt="menuIcon Preview" style={{ maxWidth: "200px", maxHeight: "200px" }} />
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // setImageDialogVisible(true);
                                  handleDeleteMenuIcon(e)
                                }}
                                icon="pi pi-trash"
                                severity="secondary"
                                outlined
                                aria-label="Bookmark"
                                className="absolute right-0 top-0 bg-white z-5 m-2"
                                style={{
                                  height: 25,
                                  width: 25
                                }}
                              />
                              <DropzoneUpload />
                            </div>
                          ) : (<DropzonePlaceholder />)
                          )}
                        </div>
                        <p className="text-xs text-color-secondary">Note : For optimal display, use an image with dimensions of 24px width and 24px height.</p>
                        {isFormFieldValid(formik, "menuIconUrl") && (
                          <Message severity="error" text={formik?.errors?.menuIconUrl?.toString()} />
                        )}
                      </div>
                    </div>

                    {/* 
                    <div className="md:col-12 sm:col-12 mx-auto">
                      <div className="field">
                        <label htmlFor="menuIconUrl" className="form-label form-field-label">
                          Menu Icon
                        </label>
                        <InputText
                          type="text"
                          id="menuIconUrl"
                          name="menuIconUrl"
                          onChange={formik.handleChange}
                          value={formik.values.menuIconUrl}
                          className={classNames("p-inputtext-sm small-input w-full", {
                            "p-invalid": isFormFieldValid(formik, "menuIconUrl"),
                          })}
                        />
                        {isFormFieldValid(formik, "menuIconUrl") && (
                          <Message severity="error" text={formik?.errors?.menuIconUrl?.toString()} />
                        )}
                      </div>
                    </div> */}
                    {data &&
                      <div className="md:col-6 sm:col-12 mt-4">
                        <div className="field">
                          <div className="flex align-items-center">
                            <Checkbox
                              name="isSystem"
                              onChange={(e) => {
                                formik.setFieldValue("isSystem", e.checked);
                              }}
                              checked={formik.values.isSystem}
                            ></Checkbox>
                            <label htmlFor="isSystem" className="form-field-label ml-2">
                              Is System
                            </label>
                          </div>
                          {isFormFieldValid(formik, "isSystem") && (
                            <Message
                              severity="error"
                              text={formik?.errors?.isSystem?.toString()}
                            />
                          )}
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateModule;
