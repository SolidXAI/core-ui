import { DropzonePlaceholder } from "../../../components/common/DropzonePlaceholder";
import { FileReaderExt } from "../../../components/common/FileReaderExt";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { getSingularAndPlural } from "../../../helpers/helpers";
import { useGetFieldDefaultMetaDataQuery } from "../../../redux/api/fieldApi";
import { useDeleteMediaMutation } from "../../../redux/api/mediaApi";
import { useCreatemoduleMutation, useDeletemoduleMutation, useUpdatemoduleMutation } from "../../../redux/api/moduleApi";
import { useFormik } from "formik";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../redux/features/toastSlice";
import { useDropzone } from "react-dropzone";
import * as Yup from "yup";
import { env } from "../../../adapters/env";
import styles from "../form/fields/solidFields.module.css";
import {
  SolidAutocomplete,
  SolidButton,
  SolidInput,
  SolidMessage,
  SolidPanel,
  SolidPopover,
  SolidPopoverContent,
  SolidPopoverTrigger,
  SolidProgressBar,
  SolidTextarea,
  SolidIcon,
} from "../../shad-cn-ui";
import { useSolidAutocompleteField } from "../../../hooks/useSolidAutocompleteField";
import { Settings, Trash2 } from "lucide-react";
import { SolidFormFooter } from "../form/SolidFormFooter";




const CreateModule = ({ params, data }: any) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname()
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [isImageDialogVisible, setImageDialogVisible] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(data ? true : false);

  const [menuIconPreview, setmenuIconPreview] = useState<
    string | ArrayBuffer | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadCompleted, setUploadCompleted] = useState<boolean>(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; type: string } | null>(null);
  const [uploadedSize, setUploadedSize] = useState<string>("0 MB");
  const [totalSize, setTotalSize] = useState<string>("0 KB");

  const formatFileSize = (size: number) => {
    return size >= 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(1)} MB`
      : `${(size / 1024).toFixed(1)} KB`;
  };

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


  const validationSchema = Yup.object({
    name: Yup.string()
      // .matches(
      //   /^[a-z]+(-[a-z]+)*$/,
      //   "Invalid format. Use lowercase letters and hyphens only"
      // )
      .required(ERROR_MESSAGES.FIELD_REUQIRED('Name')),
    displayName: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Display Name")),
    description: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Description Name")),
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
        console.error(ERROR_MESSAGES.FAILED_CREATE_MENU, err);
      }
    },
  });

  const handleDropmenuIcon = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadCompleted(false);
    setUploadProgress(0);
    setTotalSize(formatFileSize(file.size));
    setUploadedSize("0 KB");
    setFileDetails({ name: file.name, type: file.type });

    const reader = new FileReader();

    reader.onloadstart = () => {
      setUploadProgress(0);
      setUploadedSize("0 KB");
    };
    reader.onprogress = (event) => {
      if (event.loaded && event.total) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
        setUploadedSize(formatFileSize(event.loaded));
      }
    };

    reader.onloadend = () => {
      setUploadProgress(100);
      setUploadCompleted(true);
      setUploadedSize(totalSize); // Set uploaded size to total size after completion
    };

    reader.readAsDataURL(file);
    formik.setFieldValue("menuIconUrl", file);
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
    if (data) {
      setmenuIconPreview(`${env("API_URL")}/${data.menuIconUrl}`);

      const fileName = data?.menuIconUrl?.split("/").pop(); // Extract filename from URL
      setFileDetails({ name: fileName || "Unknown File", type: "Uploaded File" });

      // Set the upload progress to 100% since the file is already uploaded
      setUploadProgress(100);
      setUploadCompleted(true);

      // Ensure Formik has the existing file URL
      formik.setFieldValue("menuIconUrl", data.menuIconUrl);
    }
  }, [data])
  const handleCancelUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadProgress(0);
    setUploadCompleted(false);
    setFileDetails(null);
    formik.setFieldValue("menuIconUrl", null);
  };


  const deteleAction = async () => {
    deleteModule(data.id);
  }

  const showError = async () => {
    const errors = await formik.validateForm(); // Trigger validation and get the updated errors
    const errorMessages = Object.values(errors);

    if (errorMessages.length > 0) {
      const detail = Array.isArray(errorMessages) ? errorMessages.join(', ') : String(errorMessages);
      dispatch(showToast({ severity: 'error', summary: 'Error', detail }));
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
    if (error.length > 0) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.SEND_REPORT, detail: error.join(', '), life: 3000 }));
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
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      return []
    }
  };

  const defaultDataSourceField = useSolidAutocompleteField({
    formik,
    fieldName: "defaultDataSource",
    labelKey: "label",
    valueKey: "value",
    searchData: serachDDefaultDataSource,
    existingData: formik.values.defaultDataSource,
  });


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
        const errorMessage = error && typeof error === 'object' && 'data' in error && 'message' in (error as any).data
          ? (error as any).data.message
          : 'Something went wrong';
        const detail = Array.isArray(errorMessage) ? errorMessage.join(', ') : String(errorMessage);
        dispatch(showToast({ severity: 'error', summary: 'Error', detail }));
      }
    });
  }, [isError, isModuleUpdateError, isModuleDeleteError, isMediaDeleteError])

  const [formActionsMenuOpen, setFormActionsMenuOpen] = useState(false);

  const isCreateMode = pathname.includes('new');
  const headerTitle = isCreateMode ? "Create Module" : "Edit Module";
  const canShowActionsMenu = !isCreateMode && data?.isSystem !== true;

  const handleCancel = () => {
    router.back();
  };

  const formActionDropdown = () => (
    <SolidPopover open={formActionsMenuOpen} onOpenChange={setFormActionsMenuOpen}>
      <SolidPopoverTrigger asChild>
        <SolidButton
          variant="ghost"
          size="sm"
          className="solid-icon-button"
          aria-label="Module actions"
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
            deteleAction();
          }}
        >
          <Trash2 size={14} className="solid-row-action-button-icon" />
          <span className="solid-row-action-button-label">Delete</span>
        </button>
      </SolidPopoverContent>
    </SolidPopover>
  );

  return (
    <div className="solid-form-wrapper">
      <div className="solid-form-section" style={{ borderRight: params.embeded !== true ? '1px solid var(--primary-light-color)' : '' }} >
        <form style={{ width: '100%', background: "#fff" }} onSubmit={formik.handleSubmit}>
          <div className="solid-form-header flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="flex flex-column gap-1">
              {/* <span className="text-sm text-color-secondary uppercase tracking-wider">Module</span> */}
              {/* <div className="form-wrapper-title m-0">{headerTitle}</div> */}
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
              {formik.dirty && (
                <SolidButton size="sm" type="submit" onClick={() => showError()}>
                  Save
                </SolidButton>
              )}
              {canShowActionsMenu && formActionDropdown()}
            </div>
          </div>
          {/* <SolidFormHeader /> */}
          <div className="solid-form-content">
            {/* <p className="form-wrapper-heading text-base">Basic Info</p> */}
            <SolidPanel header={"Basic Info"} className="solid-column-panel">
              <div className="formgrid grid mt-3">
                <div className="field col-12 pb-3 lg:pb-0 lg:col-6">
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="displayName" className={`${styles.fieldLabel} form-field-label`}>
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <SolidInput
                      disabled={!!data}
                      type="text"
                      id="displayName"
                      name="displayName"
                      onChange={(e) => {
                        formik.handleChange(e);
                        const { toKebabCase } = getSingularAndPlural(e.target.value);
                        if (pathname.includes('new')) {
                          formik.setFieldValue("name", toKebabCase);
                        }
                      }}
                      value={formik.values.displayName}
                      className={styles.fieldInput}
                    />
                    {isFormFieldValid(formik, "displayName") && (
                      <p className={styles.fieldError}>{formik?.errors?.displayName?.toString()}</p>
                    )}
                  </div>
                </div>
                <div className="field col-12 lg:col-6">
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="name" className={`${styles.fieldLabel} form-field-label`}>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <SolidInput
                      disabled
                      type="text"
                      id="name"
                      name="name"
                      onChange={formik.handleChange}
                      value={formik.values.name}
                      className={styles.fieldInput}
                    />
                    {isFormFieldValid(formik, "name") && (
                      <p className={styles.fieldError}>{formik?.errors?.name?.toString()}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="formgrid grid mt-4">
                <div className="field col-12 pb-3 ld:pb-0 lg:col-6">
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="menuSequenceNumber" className={`${styles.fieldLabel} form-field-label`}>
                      Menu Sequence Number
                    </label>
                    <SolidInput
                      id="menuSequenceNumber"
                      type="number"
                      onChange={formik.handleChange}
                      min={0}
                      value={formik.values.menuSequenceNumber}
                      className={styles.fieldInput}
                    />
                    {isFormFieldValid(formik, "menuSequenceNumber") && (
                      <p className={styles.fieldError}>{formik?.errors?.menuSequenceNumber?.toString()}</p>
                    )}
                  </div>
                </div>
                <div className="field col-12 lg:col-6">
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="description" className={`${styles.fieldLabel} form-field-label`}>
                      Description <span className="text-red-500">*</span>
                    </label>
                    <SolidTextarea
                      id="description"
                      name="description"
                      onChange={formik.handleChange}
                      value={formik.values.description}
                      className={styles.fieldTextarea}
                      rows={5}
                      cols={30}
                    />
                    {isFormFieldValid(formik, "description") && (
                      <p className={styles.fieldError}>{formik?.errors?.description?.toString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </SolidPanel>
            {/* <Divider /> */}
            {/* <p className="form-wrapper-heading text-base" style={{ fontSize: 16 }}>Configurations</p> */}
            <SolidPanel header={"Configurations"} className="solid-column-panel mt-4">
              <div className="formgrid grid mt-3">
                <div className="field col-12 pb-3 lg:pb-0 lg:col-6">
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="defaultDataSource" className={`${styles.fieldLabel} form-field-label`}>
                      Default Data Source
                    </label>
                    <div className="solid-standard-autocomplete w-full">
                      <SolidAutocomplete
                        disabled={!!data}
                        value={defaultDataSourceField.selectedItem}
                        suggestions={defaultDataSourceField.filteredItems}
                        completeMethod={defaultDataSourceField.searchItems}
                        onChange={defaultDataSourceField.handleChange}
                        dropdown
                        field="label"
                        className="w-full"
                      />
                    </div>
                    {isFormFieldValid(formik, "defaultDataSource") && (
                      <p className={styles.fieldError}>{formik?.errors?.defaultDataSource?.toString()}</p>
                    )}
                  </div>
                </div>
                <div className="field col-12 lg:col-6">
                  <div className={`${styles.fieldWrapper} relative`}>
                    <label htmlFor="menuIconUrl" className={`${styles.fieldLabel} form-field-label`}>
                      Menu Icon <small className="text-red-500 helper-text">(only svg, png and jpeg are allowed)</small>
                    </label>
                    <div {...getRootPropsmenuIcon()} className="solid-dropzone-wrapper">
                      <input {...getInputPropsmenuIcon()} />
                      <DropzonePlaceholder />
                    </div>
                    {isFormFieldValid(formik, "menuIconUrl") && (
                      <SolidMessage severity="error" text={formik?.errors?.menuIconUrl?.toString()} className="mt-2" />
                    )}

                    {fileDetails && (
                      <div className="solid-file-upload-wrapper mt-4">
                        <div className="flex align-items-center gap-2">
                          <FileReaderExt fileDetails={fileDetails} />
                          <div className="w-full flex flex-column gap-1">
                            <div className="flex align-items-center justify-content-between">
                              <div className="font-bold solid-module-mobile-text-wrapper">{fileDetails.name}</div>
                              <button
                                type="button"
                                className="solid-file-icon-btn is-danger"
                                onClick={handleCancelUpload}
                              >
                                <SolidIcon name="si-times" aria-hidden />
                              </button>
                            </div>
                            {uploadCompleted ? (
                              <div className="flex align-items-center gap-2 text-sm">
                                {totalSize} of {totalSize}
                                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                                  <circle cx="2" cy="2" r="2" fill="#C1C1C1" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <mask id="mask0_2480_8635" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                                    <rect width="20" height="20" fill="#D9D9D9" />
                                  </mask>
                                  <g mask="url(#mask0_2480_8635)">
                                    <path d="M9.16 12.76L13.39 8.53L12.55 7.69L9.16 11.08L7.45 9.37L6.61 10.21L9.16 12.76ZM10 16C9.17 16 8.39 15.8424 7.66 15.5272C6.93 15.2124 6.295 14.785 5.755 14.245C5.215 13.705 4.7876 13.07 4.4728 12.34C4.1576 11.61 4 10.83 4 10C4 9.17 4.1576 8.39 4.4728 7.66C4.7876 6.93 5.215 5.215 5.755 5.755C6.295 5.215 6.93 4.7874 7.66 4.4722C8.39 4.1574 9.17 4 10 4C10.83 4 11.61 4.1574 12.34 4.4722C13.07 4.7874 13.705 5.215 14.245 5.755C14.785 6.295 15.2124 6.93 15.5272 7.66C15.8424 8.39 16 9.17 16 10C16 10.83 15.8424 11.61 15.5272 12.34C15.2124 13.07 14.785 13.705 14.245 14.245C13.705 14.785 13.07 15.2124 12.34 15.5272C11.61 15.8424 10.83 16 10 16Z" fill="var(--primary-color, var(--primary))" />
                                  </g>
                                </svg>
                                Completed
                              </div>
                            ) : (
                              <div className="flex align-items-center gap-2 text-sm">
                                {uploadedSize} of {totalSize}
                                <svg xmlns="http://www.w3.org/2000/svg" width="4" height="4" viewBox="0 0 4 4" fill="none">
                                  <circle cx="2" cy="2" r="2" fill="#C1C1C1" />
                                </svg>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M7.375 10.5V5.40625L5.75 7.03125L4.875 6.125L8 3L11.125 6.125L10.25 7.03125L8.625 5.40625V10.5H7.375ZM4.25 13C3.90625 13 3.61198 12.8776 3.36719 12.6328C3.1224 12.388 3 12.0938 3 11.75V9.875H4.25V11.75H11.75V9.875H13V11.75C13 12.0938 12.8776 12.388 12.6328 12.6328C12.388 12.8776 12.0938 13 11.75 13H4.25Z" fill="black" />
                                </svg>
                                Uploading ${uploadProgress}% Completed
                              </div>
                            )}
                          </div>
                        </div>
                        <SolidProgressBar value={uploadProgress} showValue={false} style={{ height: 4 }} className="mt-2" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SolidPanel>
          </div>
        </form>
        {/* <div style={{ width: '22.5%' }}></div> */}
        <SolidFormFooter params={params}></SolidFormFooter>
      </div>
    </div>
  );
};

export default CreateModule;
