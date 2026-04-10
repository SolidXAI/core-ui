
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { getSingularAndPlural } from "../../../helpers/helpers";
import { useGetFieldDefaultMetaDataQuery } from "../../../redux/api/fieldApi";
import { useLazyGetModelsQuery } from "../../../redux/api/modelApi";
import { useLazyGetmodulesQuery } from "../../../redux/api/moduleApi";
import { useFormik } from "formik";
import { snakeCase } from "lodash";
import { classNames } from "primereact/utils";
import qs from "qs";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../redux/features/toastSlice";
import * as Yup from "yup";
import { SolidAutocomplete, SolidCheckbox, SolidInput, SolidPanel, SolidTextarea } from "../../shad-cn-ui";
import { useSolidAutocompleteField } from "../../../hooks/useSolidAutocompleteField";
import styles from "../form/fields/solidFields.module.css";

const ModelMetaData = React.forwardRef(({ modelMetaData, setModelMetaData, allModelsNames, deleteModelFunction, nextTab, formikModelMetadataRef, params, formErrors, setIsDirty }: any, ref) => {

  // const ModelMetaData = ({ modelMetaData, setModelMetaData, deleteModelFunction, nextTab, formikModelMetadataRef }: any) => {   

  const dispatch = useDispatch();

  const [triggerGetModules, { data: moduleData, isFetching: isModuleFetching, error: moduleError }] = useLazyGetmodulesQuery();
  const [triggerGetModels, { data: modelData, isFetching: isModelFetching, error: modelError }] = useLazyGetModelsQuery();
  const { data: fieldDefaultMetaData, isLoading, error, refetch } = useGetFieldDefaultMetaDataQuery(null);
  

  const initialValues = {
    singularName: modelMetaData ? modelMetaData?.singularName : "",
    pluralName: modelMetaData ? modelMetaData?.pluralName : "",
    displayName: modelMetaData ? modelMetaData?.displayName : "",
    description: modelMetaData ? modelMetaData?.description : "",
    dataSource: modelMetaData ? modelMetaData?.dataSource : "",
    dataSourceType: modelMetaData ? modelMetaData?.dataSourceType : "",
    tableName: modelMetaData ? modelMetaData?.tableName : null,
    moduleId: modelMetaData ? modelMetaData?.module?.id : "",
    module: modelMetaData ? modelMetaData?.module : "",
    isSystem: modelMetaData ? modelMetaData?.isSystem : false,
    enableSoftDelete: modelMetaData ? modelMetaData?.enableSoftDelete : "",
    enableAuditTracking: modelMetaData ? modelMetaData?.enableAuditTracking : true,
    internationalisation: modelMetaData ? modelMetaData?.internationalisation : "",
    draftPublishWorkflow: modelMetaData ? modelMetaData?.draftPublishWorkflow : "",
    isChild: modelMetaData ? modelMetaData?.isChild : "",
    parentModelId: modelMetaData ? modelMetaData?.parentModel?.id : "",
    parentModel: modelMetaData ? modelMetaData?.parentModel : "",
    isLegacyTable: modelMetaData ? modelMetaData?.isLegacyTable : false,
    isLegacyTableWithId: modelMetaData ? modelMetaData?.isLegacyTableWithId : false,
  //   isLegacyTable: modelMetaData 
  //   ? (modelMetaData.isLegacyTable && modelMetaData.isLegacyTableWithId && params.id !== 'new') 
  //     ? true  
  //     : modelMetaData.isLegacyTableWithId 
  //       ? true  
  //       : false 
  //   : false,
    
  // isLegacyTableWithId: modelMetaData 
  //   ? (modelMetaData.isLegacyTable && modelMetaData.isLegacyTableWithId &&  params.id !== 'new') 
  //     ? true  
  //     : false  
  //   : false,
  };

  const [showTableName, setShowTableName] = useState<any>(false);
  const [showParentModel, setShowParentModel] = useState<any>(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);


  useEffect(() => {
    if (modelMetaData && modelMetaData.tableName) {
      setShowTableName(true)
    }
    if (modelMetaData && modelMetaData.isChild) {
      setShowParentModel(true)
    }
    else if (modelMetaData && !modelMetaData.isChild) {
      setShowParentModel(false)
    }
  }, [modelMetaData])

  const validationSchema = Yup.object({
    singularName: Yup.string()
      // .matches(
      //   /^[a-z]+(-[a-z]+)*$/,
      //   "Invalid format. Use lowercase letters and hyphens only"
      // )
      .notOneOf(allModelsNames, ERROR_MESSAGES.FIELD_ALREADY_USE('Name', 'name'))
      .required(ERROR_MESSAGES.FIELD_REUQIRED('Singular Name')),
    pluralName: Yup.string()
      // .matches(
      //   /^[a-z]+(-[a-z]+)*$/,
      //   "Invalid format. Use lowercase letters and hyphens only"
      // )
      .required(ERROR_MESSAGES.FIELD_REUQIRED('Plural Name')),
    // tableName: Yup.string().required().matches(/^[a-z0-9_]+$/, ERROR_MESSAGES.SNAKE_CASE('Tabale')),
    displayName: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Display Name")),
    description: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Description Name")),
    dataSource: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Data Source")),
    dataSourceType: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Data Source Type")),
    moduleId: Yup.number().required(ERROR_MESSAGES.FIELD_REUQIRED("Module Id")),
    module: Yup.object().required(ERROR_MESSAGES.FIELD_REUQIRED("Module")),
    isSystem: Yup.boolean(),
    enableSoftDelete: Yup.boolean(),
    enableAuditTracking: Yup.boolean(),
    internationalisation: Yup.boolean(),
    draftPublishWorkflow: Yup.boolean(),
    isChild: Yup.boolean(),
    parentModelId: Yup.number().when("isChild", (isChild: any, schema) => {
      if (isChild.length > 0 && isChild[0] == true) {
        return schema.required(ERROR_MESSAGES.FIELD_REUQIRED('Parent Model Id'))
      } else {
        return schema.notRequired().nullable();
      }
    }),
    parentModel: Yup.object().when("isChild", (isChild: any, schema) => {
      if (isChild.length > 0 && isChild[0] == true) {
        return schema.required(ERROR_MESSAGES.FIELD_REUQIRED('Parent Model'))
      } else {
        return schema.notRequired().nullable();
      }
    }),
    isLegacyTable: Yup.boolean(),
    isLegacyTableWithId: Yup.boolean(),
  });



  const isFormFieldValid = (formik: any, fieldName: string) =>
    formik.touched[fieldName] && formik.errors[fieldName];

  const getFieldErrorMessage = (fieldName: string, fallbackField?: string) => {
    const errors = formik.errors as Record<string, any>;
    const message =
      errors[fieldName] ??
      (fallbackField ? errors[fallbackField] : undefined) ??
      formErrors[fieldName] ??
      (fallbackField ? formErrors[fallbackField] : undefined);
    return message;
  };

  const fieldHasError = (fieldName: string, fallbackField?: string) => {
    return Boolean(
      isFormFieldValid(formik, fieldName) ||
        (fallbackField && isFormFieldValid(formik, fallbackField)) ||
        formErrors[fieldName] ||
        (fallbackField && formErrors[fallbackField])
    );
  };

  const renderFieldError = (fieldName: string, fallbackField?: string) => {
    if (!fieldHasError(fieldName, fallbackField)) {
      return null;
    }

    const message = getFieldErrorMessage(fieldName, fallbackField);

    if (!message) {
      return null;
    }

    const errorText = Array.isArray(message) ? message.join(", ") : String(message);
    return <p className={styles.fieldError}>{errorText}</p>;
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    validateOnChange: true, // This ensures validation runs when a field value is changed
    enableReinitialize: true,
    innerRef: formikModelMetadataRef,
    onSubmit: async (values) => {
      const tableName = generateTableName(values.module.displayName, values.singularName);

      try {
        const modelData = {
          ...modelMetaData,
          singularName: values.singularName,
          pluralName: values.pluralName,
          displayName: values.displayName,
          description: values.description,
          dataSource: values.dataSource,
          dataSourceType: values.dataSourceType,
          tableName: values?.tableName || tableName,
          moduleId: values.moduleId,
          module: values.module,
          isSystem: values.isSystem ? values.isSystem === true : '',
          enableSoftDelete: values.enableSoftDelete === true ? true : '',
          enableAuditTracking: values.enableAuditTracking === true ? true : '',
          internationalisation: values.internationalisation === true ? true : '',
          draftPublishWorkflow: values.draftPublishWorkflow === true ? true : '',
          isChild: values.isChild === true ? true : '',
          ...(values.isChild == true && {
            parentModelId: values.parentModelId,
            parentModel: values.parentModel,
          }),
          isLegacyTable:values.isLegacyTable === true ? true : false,
          isLegacyTableWithId:values.isLegacyTableWithId === true ? true :false
           
        };
        setModelMetaData(modelData);
        nextTab()

      } catch (err) {
        console.error(ERROR_MESSAGES.CREATE_MODEL, err);
      }
    },
  });

  function generateTableName(moduleSlug: string, modelName: string): string {
    const snakeCaseModelName = snakeCase(modelName);
    const sankeCaseModuleName = snakeCase(moduleSlug);
    return `${sankeCaseModuleName}_${snakeCaseModelName}`;
  }

  const showError = async () => {
    const errors = await formik.validateForm(); // Trigger validation and get the updated errors
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.SEND_REPORT, detail: errorMessages.map(String).join(', '), life: 3000 }));
    }
  };


  const searchModule = async (event: any) => {
    try {
      const query = event.query;
      const queryData = {
        limit: 10,
        offset: 0,
        filters: {
          name: {
            $containsi: query,
          },
        },
      };

      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true,
      });

      const result = await triggerGetModules(queryString).unwrap();

      if (result && result.records) {
        const updatedSuggestion = [...result.records];
        return updatedSuggestion
      } else {
        return []
      }
    } catch (error) {
      return []
    }
  };


  const searchModel = async (event: any) => {
    try {
      const query = event.query;
      const queryData = {
        limit: 10,
        offset: 0,
        filters: {
          singularName: {
            $containsi: query,
          },
        },
      };

      // Add module filter dynamically
      if (selectedModule?.name) {
        (queryData.filters as any)["module"] = {
          name: { $containsi: selectedModule.name },
        };
      }


      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true,
      });

      const result = await triggerGetModels(queryString).unwrap();

      if (result && result.records) {
        const updatedSuggestion = [...result.records];
        return updatedSuggestion
      } else {
        return []
      }
    } catch (error) {
      return []
    }
  };


  const serachDataSource = async (event: any) => {
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


  const serachDataSourceType = async (event: any) => {
    const query = event.query;
    try {

      const filterredData: any = fieldDefaultMetaData.data.dataSource.filter((t: any) => t.type.toLowerCase().startsWith(query.toLowerCase()));
      const transformedData = filterredData.map((e: any) => ({ label: e.type, value: e.type }))
      return transformedData;
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      return [];

    }
  };


  // useEffect(() => {
  //   if (modelMetaData) {
  //     setModelMetaData(modelMetaData.parentCategoryId);

  //     // formik.setFieldValue("parentCategoryId", modelMetaData.parentCategoryId);
  //   }
  // }, [modelMetaData])


  // Set the formik reference to the formik instance
  // Set the formik reference to the formik instance
  useEffect(() => {
    if (formikModelMetadataRef) {
      formikModelMetadataRef.current = formik; // Assign the formik instance to the ref
    }
  }, [formik, formikModelMetadataRef]);


  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1; // Increment count on every render
  });


  useEffect(() => {
    formik.validateForm();
    setModelMetaData(formik.values);

  }, [formik.values])

  useEffect(() => {
    if (formik.dirty) {
      setIsDirty(true);
    }
  }, [formik.dirty]);

  const moduleField = useSolidAutocompleteField({
    formik,
    fieldName: "module",
    fieldNameId: "moduleId",
    labelKey: "displayName",
    valueKey: "id",
    searchData: searchModule,
    existingData: formik.values.module,
    relationField: true,
    additionalAction: (e: any) => setSelectedModule(e.value),
  });

  const dataSourceField = useSolidAutocompleteField({
    formik,
    fieldName: "dataSource",
    labelKey: "label",
    valueKey: "value",
    searchData: serachDataSource,
    existingData: formik.values.dataSource,
    additionalAction: (e: any) => formik.setFieldValue("dataSourceType", e.target.value.type),
  });

  const parentModelField = useSolidAutocompleteField({
    formik,
    fieldName: "parentModel",
    fieldNameId: "parentModelId",
    labelKey: "displayName",
    valueKey: "id",
    searchData: searchModel,
    existingData: formik.values.parentModel,
    relationField: true,
  });

  return (

    <>
      <form onSubmit={formik.handleSubmit}>
        <div className="">
          <div className="grid formgrid">
            <div className="field col-12 lg:col-6 lg:pr-3">
              <SolidPanel header={"Basic Info"} className="solid-column-panel">
                <div className={styles.fieldWrapper}>
                  <label htmlFor="moduleId" className={styles.fieldLabel}>
                    Module
                  </label>
                  <div
                    className={classNames(
                      "solid-standard-autocomplete w-full",
                      fieldHasError("module", "moduleId") && styles.fieldInvalidControl
                    )}
                  >
                    <SolidAutocomplete
                      disabled={params.id !== "new"}
                      value={moduleField.selectedItem}
                      suggestions={moduleField.filteredItems}
                      completeMethod={moduleField.searchItems}
                      onChange={moduleField.handleChange}
                      dropdown
                      field="displayName"
                      className="w-full"
                    />
                  </div>
                  {renderFieldError("module", "moduleId")}
                </div>

                <div className={styles.fieldWrapper}>
                  <label htmlFor="dataSource" className={styles.fieldLabel}>
                    Data Source
                  </label>
                  <div
                    className={classNames(
                      "solid-standard-autocomplete w-full",
                      fieldHasError("dataSource") && styles.fieldInvalidControl
                    )}
                  >
                    <SolidAutocomplete
                      disabled={params.id !== "new"}
                      value={dataSourceField.selectedItem}
                      suggestions={dataSourceField.filteredItems}
                      completeMethod={dataSourceField.searchItems}
                      onChange={dataSourceField.handleChange}
                      dropdown
                      field="label"
                      className="w-full"
                    />
                  </div>
                  {formik.values.dataSourceType && (
                    <p className="form-field-label text-sm">
                      Your datasource will connect to a {formik.values.dataSourceType} database
                    </p>
                  )}
                  {renderFieldError("dataSource")}
                </div>
              </SolidPanel>

              <SolidPanel header={"Configurations"} className="solid-column-panel mt-3 mb-3 lg:mt-5">
                <div className="mt-2">
                  <SolidCheckbox
                    name="enableSoftDelete"
                    disabled={params.id !== "new"}
                    checked={!!formik.values.enableSoftDelete}
                    onChange={(event) => {
                      formik.setFieldValue("enableSoftDelete", event.currentTarget.checked);
                    }}
                    label="Enable Soft Delete"
                  />
                  {params.id !== "new" && (
                    <p className="form-field-label mt-1 text-sm">
                      Soft-delete can only be set during initial creation to maintain data integrity
                    </p>
                  )}
                  {renderFieldError("enableSoftDelete")}
                </div>

                <div className="mt-3">
                  <SolidCheckbox
                    name="isChild"
                    disabled={params.id !== "new"}
                    checked={!!formik.values.isChild}
                    onChange={(event) => {
                      formik.setFieldValue("isChild", event.currentTarget.checked);
                    }}
                    label="Is Child"
                  />
                  {params.id !== "new" && (
                    <p className="form-field-label mt-1 text-sm">
                      Is Current Model child of another Model
                    </p>
                  )}
                  {renderFieldError("isChild")}
                </div>

                {showParentModel && (
                  <div className={styles.fieldWrapper}>
                    <label htmlFor="parentModelId" className={styles.fieldLabel}>
                      Parent Model
                    </label>
                    <div
                      className={classNames(
                        "solid-standard-autocomplete w-full",
                        fieldHasError("parentModel", "parentModelId") && styles.fieldInvalidControl
                      )}
                    >
                      <SolidAutocomplete
                        disabled={params.id !== "new"}
                        value={parentModelField.selectedItem}
                        suggestions={parentModelField.filteredItems}
                        completeMethod={parentModelField.searchItems}
                        onChange={parentModelField.handleChange}
                        dropdown
                        field="displayName"
                        className="w-full"
                      />
                    </div>
                    {renderFieldError("parentModel", "parentModelId")}
                  </div>
                )}

                <div className="mt-3">
                  <SolidCheckbox
                    name="enableAuditTracking"
                    checked={!!formik.values.enableAuditTracking}
                    onChange={(event) => {
                      formik.setFieldValue("enableAuditTracking", event.currentTarget.checked);
                    }}
                    label="Enable Audit Tracking"
                  />
                  {renderFieldError("enableAuditTracking")}
                </div>

                <div className="mt-3">
                  <SolidCheckbox
                    name="internationalisation"
                    checked={!!formik.values.internationalisation}
                    onChange={(event) => {
                      formik.setFieldValue("internationalisation", event.currentTarget.checked);
                    }}
                    label="Is Internationalisation Enabled"
                  />
                </div>

                <div className="mt-3">
                  <SolidCheckbox
                    name="draftPublishWorkflow"
                    checked={!!formik.values.draftPublishWorkflow}
                    onChange={(event) => {
                      formik.setFieldValue("draftPublishWorkflow", event.currentTarget.checked);
                    }}
                    label="Draft/Publish Workflow"
                  />
                </div>

                <div className="mt-3">
                  <SolidCheckbox
                    name="isLegacyTable"
                    checked={!!formik.values.isLegacyTable}
                    onChange={(event) => {
                      const isChecked = event.currentTarget.checked;
                      formik.setFieldValue("isLegacyTable", isChecked);
                      if (!isChecked) {
                        formik.setFieldValue("isLegacyTableWithId", false);
                      }
                    }}
                    label="Is Legacy Table"
                  />
                </div>

                {formik.values.isLegacyTable && (
                  <>
                    <div className="ml-4 mt-2">
                      <SolidCheckbox
                        name="isLegacyTableWithId"
                        checked={!!formik.values.isLegacyTableWithId}
                        onChange={(event) => {
                          formik.setFieldValue("isLegacyTableWithId", event.currentTarget.checked);
                        }}
                        label="Has existing Id"
                      />
                    </div>
                    <p className="form-field-label mt-2 text-sm">
                      Note: Legacy tables require at least one field marked as Primary Key during model creation
                    </p>
                  </>
                )}
              </SolidPanel>
            </div>
            <div className="field col-12 lg:col-6 lg:pl-3">
              <SolidPanel header={"Basic Settings"} className="solid-column-panel">
                <div className={styles.fieldWrapper}>
                  <label htmlFor="displayName" className={styles.fieldLabel}>
                    Display Name
                  </label>
                  <SolidInput
                    type="text"
                    id="displayName"
                    name="displayName"
                    className={styles.fieldInput}
                    value={formik.values.displayName}
                    onChange={(e) => {
                      formik.handleChange(e);
                      const { toCamelCase, toSnakeCase, toPluralCamelCase } = getSingularAndPlural(e.target.value);
                      if (params.id === "new") {
                        formik.setFieldValue("singularName", toCamelCase);
                        formik.setFieldValue("pluralName", toPluralCamelCase);
                        formik.setFieldValue("tableName", toSnakeCase);
                      }
                    }}
                  />
                  {renderFieldError("displayName")}
                </div>

                <div className={styles.fieldWrapper}>
                  <label htmlFor="singularName" className={styles.fieldLabel}>
                    Singular Name
                  </label>
                  <SolidInput
                    type="text"
                    id="singularName"
                    name="singularName"
                    className={styles.fieldInput}
                    value={formik.values.singularName}
                    disabled
                    onChange={formik.handleChange}
                  />
                  {renderFieldError("singularName")}
                </div>

                <div className={styles.fieldWrapper}>
                  <label htmlFor="pluralName" className={styles.fieldLabel}>
                    Plural Name
                  </label>
                  <SolidInput
                    type="text"
                    id="pluralName"
                    name="pluralName"
                    className={styles.fieldInput}
                    value={formik.values.pluralName}
                    disabled
                    onChange={formik.handleChange}
                  />
                  {renderFieldError("pluralName")}
                </div>

                <div className={styles.fieldWrapper}>
                  <label htmlFor="tableName" className={styles.fieldLabel}>
                    Table Name
                  </label>
                  <SolidInput
                    type="text"
                    id="tableName"
                    name="tableName"
                    className={styles.fieldInput}
                    value={formik.values.tableName}
                    disabled={params.id !== "new"}
                    onChange={formik.handleChange}
                  />
                  {renderFieldError("tableName")}
                </div>

                <div className={styles.fieldWrapper}>
                  <label htmlFor="description" className={styles.fieldLabel}>
                    Description
                  </label>
                  <SolidTextarea
                    id="description"
                    name="description"
                    className={styles.fieldTextarea}
                    value={formik.values.description}
                    rows={5}
                    onChange={formik.handleChange}
                  />
                  {renderFieldError("description")}
                </div>
              </SolidPanel>
            </div>

            {/* <div className="md:col-6 sm:col-12">
                  <div className="field">
                    <label htmlFor="pluralName" className="form-label form-field-label">
                      Plural Name
                    </label>
                    <InputText
                      type="text"
                      id="pluralName"
                      name="pluralName"
                      onChange={formik.handleChange}
                      value={formik.values.pluralName}
                      className={classNames("p-inputtext-sm w-full small-input", {
                        "p-invalid": isFormFieldValid(formik, "pluralName"),
                      })}
                    />
                    {isFormFieldValid(formik, "pluralName") && (
                      <Message severity="error" text={formik?.errors?.pluralName?.toString()} />
                    )}
                  </div>
                </div> */}


            {/* <div className="md:col-6 sm:col-12">
                  <div className="field form-dropdown-select">
                    <label htmlFor="dataSourceType" className="form-labe form-field-label">
                      Data Source
                    </label>
                    <Dropdown
                      id="dataSourceType"
                      name="dataSourceType"
                      value={formik.values.dataSourceType}
                      options={dataSourceTypes}
                      onChange={(e) => {
                        formik.setFieldValue("dataSourceType", e.value);
                        // if (e.value == "mariadb") {
                        //   formik.setFieldValue("dataSourceType", "mongodb");
                        // }
                        // else {
                        //   formik.setFieldValue("dataSourceType", "rdbms");
                        // }
                      }
                      }
                      placeholder="Select a Data Source"
                      className={classNames("p-inputtext-sm w-full", {
                        "p-invalid": isFormFieldValid(formik, "dataSource"),
                      })}
                    />
                    {isFormFieldValid(formik, "dataSource") && (
                      <Message severity="error" text={formik?.errors?.dataSource?.toString()} />
                    )}
                  </div>
                </div> */}


          </div>
        </div>
      </form>
    </>
  );
});

export default ModelMetaData;
