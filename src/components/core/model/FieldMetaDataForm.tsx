
import { getSingularAndPlural } from "../../../helpers/helpers";
import { useGetFieldDefaultMetaDataQuery } from "../../../redux/api/fieldApi";
import { useLazyGetMediaStorageProvidersQuery } from "../../../redux/api/mediaStorageProviderApi";
import { useLazyGetModelsQuery, useUpdateUserKeyMutation } from "../../../redux/api/modelApi";
import { useLazyGetmodulesQuery } from "../../../redux/api/moduleApi";
import { useFormik } from "formik";
import { capitalize } from "lodash";
import { usePathname } from "../../../hooks/usePathname";
import qs from "qs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Yup from "yup";
import FieldSelector from "./FieldSelector";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { useSolidAutocompleteField } from "../../../hooks/useSolidAutocompleteField";
import {
  SolidAutocomplete,
  SolidButton,
  SolidCheckbox,
  SolidDatePicker,
  SolidDialog,
  SolidDialogBody,
  SolidInput,
  SolidTextarea,
  SolidNumberInput,
  SolidSelect,
  SolidSegmentedControl,
  SolidRadioGroup,
  SolidTabGroup,
  SolidMessage,
  SolidCodeEditor,
} from "../../shad-cn-ui";
import styles from "../form/fields/solidFields.module.css";



enum SolidFieldType {
  // numeric types
  int = 'int',
  bigint = 'bigint',
  float = 'float',
  // double = 'double',
  decimal = 'decimal',

  // text types
  shortText = 'shortText',
  longtext = 'longText',
  richText = 'richText',
  json = 'json',

  // boolean types
  boolean = 'boolean',

  // date
  date = 'date',
  datetime = 'datetime',
  time = 'time',

  // relation
  relation = 'relation',

  // media
  mediaSingle = 'mediaSingle',
  mediaMultiple = 'mediaMultiple',

  email = 'email',
  password = 'password',

  // selection
  selectionStatic = 'selectionStatic',
  selectionDynamic = 'selectionDynamic',

  computed = 'computed',

  uuid = 'uuid'
}

type ClassNamesArg = string | Record<string, boolean> | undefined | null | false;

function classNames(...args: ClassNamesArg[]) {
  const classes: string[] = [];
  args.forEach((arg) => {
    if (!arg) {
      return;
    }
    if (typeof arg === "string") {
      if (arg.trim()) {
        classes.push(arg);
      }
      return;
    }
    Object.entries(arg).forEach(([key, value]) => {
      if (value) {
        classes.push(key);
      }
    });
  });
  return classes.join(" ");
}

function createSimpleAutocompleteValue(value: any | undefined | null) {
  if (!value) return null;
  if (typeof value === "object") return value;
  return { label: value, value };
}

function createRelationAutocompleteValue(value: any | undefined | null, labelKey: string, valueKey: string = labelKey) {
  if (!value) return null;
  if (typeof value === "object") return value;
  return { [labelKey]: value, [valueKey]: value };
}

type LocalTabPanelProps = {
  header: string;
  className?: string;
  children: React.ReactNode;
};

type LocalTabViewProps = {
  children: React.ReactNode;
  panelContainerClassName?: string;
};

function TabPanel(_props: LocalTabPanelProps) {
  return null;
}

function TabView({ children, panelContainerClassName }: LocalTabViewProps) {
  const panels = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<LocalTabPanelProps> =>
      React.isValidElement(child) && child.type === TabPanel
  );
  const firstValue = panels[0]?.props.header ?? "";
  const [activeValue, setActiveValue] = React.useState(firstValue);

  React.useEffect(() => {
    if (!panels.some((panel) => panel.props.header === activeValue)) {
      setActiveValue(panels[0]?.props.header ?? "");
    }
  }, [panels, activeValue]);

  if (panels.length === 0) {
    return null;
  }

  const tabs = panels.map((panel) => ({
    value: panel.props.header,
    label: panel.props.header,
    hasError: panel.props.className?.includes("tab-error-heading"),
    content: (
      <div className={panel.props.className}>
        {panel.props.children}
      </div>
    ),
  }));

  return (
    <SolidTabGroup
      tabs={tabs}
      value={activeValue}
      onValueChange={setActiveValue}
      panelClassName={panelContainerClassName}
    />
  );
}

const SelectionStaticValues = ({ enumValue, onUpdate, onDelete, onAdd }: any) => {
  const [value, display] = enumValue.split(":");

  const handleValueChange = (newValue: string) => {
    onUpdate(`${newValue}:${display || ""}`);
  };

  const handleDisplayChange = (newDisplay: string) => {
    onUpdate(`${value || ""}:${newDisplay}`);
  };

  return (
    <div className="flex align-items-center gap-2 mt-2">

      {/* Input field for Value */}
      <SolidInput
        value={value || ""}
        onChange={(e) => handleValueChange(e.target.value)}
        placeholder="Value"
        className="w-full"
      />

      {/* Input field for Display */}
      <SolidInput
        value={display || ""}
        onChange={(e) => handleDisplayChange(e.target.value)}
        placeholder="Display"
        className="w-full"
      />



      {/* Plus Button to add a new row */}
      <SolidButton
        icon="pi pi-plus"
        size="small"
        onClick={onAdd}
        type="button"
      />

      {/* Trash Button to delete the row */}
      <SolidButton
        icon="pi pi-trash"
        size="small"
        onClick={onDelete}
        outlined
        severity="danger"
        type="button"
      />
    </div>
  );

}

interface SelectComputedFieldTriggerValuesProps {
  index: number;
  row: {
    moduleName: string;
    modelName: string;
    operations: string[];
  };
  onChange: (index: number, updatedRow: any) => void;
  onDelete: (index: number) => void;
  isLastRow: boolean;
  disableDelete: boolean;
  formik: any;
  isFormFieldValid: (formik: any, field: string) => boolean;
  searchModuleName: (event: any) => Promise<any[]>;
  searchModelName: (event: any) => Promise<any[]>;
  modelMetaData?: any,
  errors?: any,
  touched?: any,
}

const triggerOperationOptions = [
  { label: "beforeInsert", value: "before-insert" },
  { label: "afterInsert", value: "after-insert" },
  { label: "beforeUpdate", value: "before-update" },
  { label: "afterUpdate", value: "after-update" },
  { label: "beforeRemove", value: "before-delete" },
  { label: "afterRemove", value: "after-delete" },
];

const formatDisplayName = (value: string): string => {
  return value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};


const SelectComputedFieldTriggerValues: React.FC<SelectComputedFieldTriggerValuesProps> = ({
  index,
  row,
  onChange,
  onDelete,
  disableDelete,
  formik,
  isFormFieldValid,
  searchModuleName,
  searchModelName,
  modelMetaData,
  errors,
  touched,
}: any) => {
  const [filteredOperations, setFilteredOperations] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!row.moduleName && modelMetaData?.module?.name) {
      formik.setFieldValue(`computedFieldTriggerConfig[${index}].moduleName`, modelMetaData?.module?.name);
    }
    if (!row.modelName && modelMetaData?.singularName) {
      formik.setFieldValue(`computedFieldTriggerConfig[${index}].modelName`, modelMetaData?.singularName);
    }
  }, [modelMetaData?.module?.name, modelMetaData?.singularName]);

  const searchOperations = (event: any) => {
    const query = event.query.toLowerCase();
    setFilteredOperations(
      triggerOperationOptions.filter((item) =>
        item.label.toLowerCase().includes(query)
      )
    );
  };

  const triggerModuleField = useSolidAutocompleteField({
    formik,
    fieldName: `computedFieldTriggerConfig[${index}].moduleName`,
    fieldNameId: null,
    labelKey: "displayName",
    valueKey: "name",
    searchData: searchModuleName,
    existingData: row.moduleName
      ? {
        name: row.moduleName,
        displayName: row.displayName || formatDisplayName(row.moduleName),
      }
      : modelMetaData?.module?.name
        ? {
          name: modelMetaData.module.name,
          displayName: modelMetaData.module.displayName || formatDisplayName(modelMetaData.module.name),
        }
        : null,
    relationField: true,
  });

  const triggerModelField = useSolidAutocompleteField({
    formik,
    fieldName: `computedFieldTriggerConfig[${index}].modelName`,
    fieldNameId: null,
    labelKey: "displayName",
    valueKey: "singularName",
    searchData: searchModelName,
    existingData: row.modelName
      ? {
        singularName: row.modelName,
        displayName: row.displayName || formatDisplayName(row.modelName),
      }
      : modelMetaData?.singularName
        ? {
          singularName: modelMetaData?.singularName,
          displayName: modelMetaData?.displayName || formatDisplayName(modelMetaData.displayName),
        }
        : null,
    relationField: true,
  });

  return (
    <div className="flex align-items-center gap-3 mt-2 flex-wrap md:flex-nowrap">

      <div className="">
        <label
          htmlFor="moduleName"
          className={classNames("form-field-label", styles.fieldLabel)}
        >
          Module
        </label>
        <div className={classNames("mt-2 solid-standard-autocomplete", {
          [styles.fieldInvalidControl]: Boolean(errors?.moduleName),
        })}>
          <SolidAutocomplete
            value={triggerModuleField.selectedItem}
            suggestions={triggerModuleField.filteredItems}
            completeMethod={triggerModuleField.searchItems}
            onChange={triggerModuleField.handleChange}
            dropdown
            field="displayName"
            className="w-full"
          />
        </div>
        {errors?.moduleName && (
          <p className={styles.fieldError}>{errors.moduleName}</p>
        )}
      </div>

      <div className="">
        <label
          htmlFor="modelName"
          className={classNames("form-field-label", styles.fieldLabel)}
        >
          Model
        </label>
        <div className={classNames("mt-2 solid-standard-autocomplete", {
          [styles.fieldInvalidControl]: Boolean(errors?.modelName),
        })}>
          <SolidAutocomplete
            value={triggerModelField.selectedItem}
            suggestions={triggerModelField.filteredItems}
            completeMethod={triggerModelField.searchItems}
            onChange={triggerModelField.handleChange}
            dropdown
            field="displayName"
            className="w-full"
          />
        </div>
        {errors?.modelName && (
          <p className={styles.fieldError}>{errors.modelName}</p>
        )}
      </div>


      {/* operations */}
      <div>
        <label
          htmlFor="operations"
          className={classNames("form-field-label", styles.fieldLabel)}
        >
          Operations
        </label>
        <div className="mt-2">
          <SolidAutocomplete
            multiple
            dropdown
            value={triggerOperationOptions.filter(opt => (row.operations || []).includes(opt.value))}
            suggestions={filteredOperations}
            completeMethod={searchOperations}
            field="label"
            onChange={(e) =>
              onChange(index, {
                ...row,
                operations: (e.value || []).map((val: any) => val.value),
              })
            }
            placeholder="Select operations"
            className={classNames("solid-standard-autocomplete max-w-16rem", {
              [styles.fieldInvalidControl]: Boolean(errors?.operations),
            })}
          />
        </div>
        {errors?.operations && (
          <p className={styles.fieldError}>{errors.operations}</p>
        )}
      </div>

      {/* Trash Button to delete the row */}
      <SolidButton
        icon="pi pi-trash"
        size="small"
        onClick={() => onDelete(index)}
        disabled={disableDelete}
        outlined
        severity="danger"
        type="button"
      />
    </div>
  );

}

const fieldBasedPayloadFormating = (values: any, currentFields: string[], fieldMetaData: any) => {
  // const booleanFields: string | any[] = [
  //   "isSystem",
  //   "defaultValue",
  //   "required",
  //   "unique",
  //   "encrypt",
  //   "index",
  //   "private",
  //   "relationCreateInverse"];
  const transformedPayload = currentFields.reduce((acc: any, key: any) => {
    acc[key] = values[key]; // Set key and its value as the same string
    // if (booleanFields.includes(acc[key])) {
    //   acc[key] = values[key] == "false" ? "" : true
    // }
    return acc;
  }, {});
  transformedPayload.displayName = transformedPayload.displayName.trim()

  transformedPayload.identifier = fieldMetaData ? fieldMetaData.identifier : Date.now();
  if (fieldMetaData?.id) {
    transformedPayload.id = fieldMetaData.id
  }
  if (currentFields.includes("mediaStorageProviderId")) {
    transformedPayload.mediaStorageProvider = values.mediaStorageProvider
  }
  if (currentFields.includes("selectionDynamicProviderCtxt")) {
    const prettified = JSON.stringify(JSON.parse(values.selectionDynamicProviderCtxt), null, 2);

    transformedPayload.selectionDynamicProviderCtxt = prettified
  }

  if (currentFields.includes("computedFieldValueProviderCtxt")) {
    const prettified = JSON.stringify(JSON.parse(values.computedFieldValueProviderCtxt), null, 2);
    transformedPayload.computedFieldValueProviderCtxt = prettified
  }

  if (currentFields.includes("computedFieldTriggerConfig")) {
    // const prettified = JSON.stringify(values.computedFieldTriggerConfig, null, 2);
    transformedPayload.computedFieldTriggerConfig = values.computedFieldTriggerConfig
  }

  if (currentFields.includes("relationCreateInverse")) {
    transformedPayload.relationCreateInverse = values.relationCreateInverse == false ? false : true
  }
  if (transformedPayload.relationType == "many-to-one") {
    transformedPayload.relationCascade = values.relationCascade;
  }

  if (transformedPayload.relationType == "many-to-many") {
    transformedPayload.isRelationManyToManyOwner = true;
  }
  return transformedPayload

}

function fetchCurrentFields(solidFieldType: any, fieldDefaultMetaData: any) {

  if (solidFieldType) {
    const allowedFields = fieldDefaultMetaData?.data?.fieldTypes.filter((e: any) => e.fieldType === solidFieldType);
    if (allowedFields.length > 0) {
      return allowedFields[0].fields
    }

  }
  return [
    "name",
    "displayName",
    "type",
    "ormType",
    "required",
    "unique",
    "index",
    "private",
    "encrypt",
    "isUserKey"
  ];

}

const createValidationSchema = (currentFields: any, selectedType: any, allFields: any, fieldMetaData: any, encryptState: any) => {

  let reservedNames;

  if (fieldMetaData) {
    reservedNames = allFields.length > 0 ? allFields.filter((i: any) => i.id !== fieldMetaData.id).map((f: any) => f.name) : [];
  } else {

    reservedNames = allFields.length > 0 ? allFields.map((f: any) => f.name) : [];
  }



  const selectedTypeValue = selectedType?.value;

  const schema = {
    name: Yup.string()
      // .matches(/^[a-z]+(-[a-z]+)*$/,"Invalid format. Use lowercase letters and hyphens only")
      .notOneOf(reservedNames, ERROR_MESSAGES.FIELD_ALREADY_USE('Name', 'name'))
      .required(ERROR_MESSAGES.FIELD_REUQIRED('Name')),
    displayName: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Display Name')),
    description: Yup.string().nullable(),
    type: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Type')),
    isSystem: Yup.boolean(),
    // Conditionally add validation rules based on `currentFields`
    ...(currentFields.includes("ormType") && {
      ormType: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Orm Type')),
    }),
    ...(currentFields.includes("length") && {
      length: Yup.number().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Length', 'interger')).nullable(),
    }),
    // ...(currentFields.includes("defaultValue") && {
    //   defaultValue: Yup.string().required("Default Value is required"),
    // }),
    // Conditionally validate defaultValue based on SolidFieldType
    ...(currentFields.includes("defaultValue") && {
      defaultValue: Yup.mixed().nullable().when("type", (type: any) => {
        switch (selectedTypeValue) {
          case "int":
          case "bigint":
            return Yup.number().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Default value', 'integer'))
              .integer(ERROR_MESSAGES.FIELD_MUST_BE_AN('Default value', 'integer'));
          case "float":
          case "decimal":
            return Yup.number().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Default value', 'integer'))
          case "shortText":
          case "longText":
          case "richText":
          case "json":
            return Yup.string().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Default value', 'boolean'))
          case "boolean":
            return Yup.boolean().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Default value', 'boolean'))
          case "date":
          case "datetime":
          case "time":
            return Yup.date().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Default value', 'Date'))
          default:
            return Yup.mixed().nullable(); // Default fallback if no match
        }
      }),
    }),

    // Add more conditional fields as needed

    ...(currentFields.includes("regexPattern") && {
      regexPattern: Yup.string(),
      regexPatternNotMatchingErrorMsg: Yup.string(),
    }),
    ...(currentFields.includes("required") && {
      required: Yup.boolean(),
    }),
    ...(currentFields.includes("unique") && {
      unique: Yup.boolean(),
    }),
    ...(currentFields.includes("encrypt") && {
      encrypt: Yup.boolean(),
    }),
    ...(currentFields.includes("encryptionType") && encryptState == true && {
      encryptionType: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Encryption Type Value')
      ),
    }),
    ...(currentFields.includes("decryptWhen") && encryptState == true && {

      decryptWhen: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Decrypt When Value')),
    }),
    ...(currentFields.includes("index") && {
      index: Yup.boolean(),
    }),
    // ...(currentFields.includes("min") && {
    //   min: Yup.number().required("Min is required"),
    // }),
    ...(currentFields.includes("min") && {
      min: Yup.mixed().nullable()
        .when("type", (type: any) => {
          switch (selectedTypeValue) {
            case "int":
              return Yup.number().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Min', 'interger'))
                .integer(ERROR_MESSAGES.FIELD_MUST_BE_AN('Min', 'interger'));
            case "decimal":
            case "shortText":
            case "longText":
            case "richText":
            case "json":
              return Yup.number().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Min', 'interger'));
            default:
              return Yup.mixed().nullable().nullable(); // Default fallback if no match
          }
        }),
    }),
    // ...(currentFields.includes("max") && {
    //   max: Yup.number().required("Max is required"),
    // }),
    ...(currentFields.includes("max") && {
      max: Yup.mixed()
        .when("type", (type: any) => {
          switch (selectedTypeValue) {
            case "int":
              return Yup.number().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Max', 'interger'))
                .integer(ERROR_MESSAGES.FIELD_MUST_BE_AN('Max', 'interger'))
                .test(
                  ERROR_MESSAGES.GREATER_THAN_MIN,
                  ERROR_MESSAGES.FIELD_MUST_BE_AN('Max', 'greater than Min'),
                  function (value) {
                    const { min } = this.parent; // Access sibling field 'min'
                    // if (min != null && value == null) {
                    //   // Trigger error if Min is filled but Max is empty
                    //   return this.createError({
                    //     message: "Max is required if Min is specified",
                    //   });
                    // }
                    return value == null || value > min; // Validate only if Max exists
                  }
                );


            case "decimal":
            case "shortText":
            case "longText":
            case "richText":
            case "json":
              return Yup.number().nullable().typeError(ERROR_MESSAGES.FIELD_MUST_BE_AN('Max', 'interger'))
                .test(
                  ERROR_MESSAGES.GREATER_THAN_MIN,
                  ERROR_MESSAGES.FIELD_MUST_BE_AN('Max', 'greater than Min'),
                  function (value) {
                    const { min } = this.parent; // Access sibling field 'min'
                    // if (min != null && value == null) {
                    //   // Trigger error if Min is filled but Max is empty
                    //   return this.createError({
                    //     message: "Max is required if Min is specified",
                    //   });
                    // }
                    return value == null || value > min; // Validate only if Max exists
                  }
                );


            default:
              return Yup.mixed().nullable().nullable(); // Default fallback if no match
          }
        }),
    }),
    ...(currentFields.includes("private") && {
      private: Yup.boolean(),
    }),
    ...(currentFields.includes("mediaTypes") && {
      mediaTypes: Yup.array()
        .of(Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Media Type')))
        .min(1, ERROR_MESSAGES.FIELD_REUQIRED('Media Types'))
        .required(ERROR_MESSAGES.FIELD_MUST_BE_AN('Media Types', 'array')),
    }),

    ...(currentFields.includes("mediaMaxSizeKb") && {
      mediaMaxSizeKb: Yup.number().required(ERROR_MESSAGES.FIELD_REUQIRED('Media Max Size')),
    }),
    ...(currentFields.includes("mediaStorageProviderId") && {
      mediaStorageProviderId: Yup.number().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Media Storage Provider')
      ),
    }),
    ...(currentFields.includes("mediaStorageProviderId") && {
      mediaStorageProvider: Yup.object().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Media Storage Provider')
      ),
    }),

    ...(currentFields.includes("mediaEmbedded") && {
      mediaEmbedded: Yup.boolean(),
    }),
    ...(currentFields.includes("relationType") && {
      relationType: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Relation Type ')),
    }),
    ...(currentFields.includes("relationCoModelSingularName") && {
      relationCoModelSingularName: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Relation Model Singular Name')
      ),
    }),
    ...(currentFields.includes("relationCoModelFieldName") && {
      relationCoModelFieldName: Yup.string()
      // .required(
      //   "Relation Model Field Name is required"
      // ),
    }),
    ...(currentFields.includes("relationCreateInverse") && {
      relationCreateInverse: Yup.boolean(),
    }),
    ...(currentFields.includes("relationCoModelFieldName") && {
      relationCoModelFieldName: Yup.string().when("relationCreateInverse", (relationCreateInverse: any, schema) => {
        if (relationCreateInverse.length > 0 && relationCreateInverse[0] == true) {
          return schema.required(ERROR_MESSAGES.FIELD_REUQIRED('Relation Co Model Field Name'))
        } else {
          return schema.notRequired();
        }
      }),
    }),

    // ...(currentFields.includes("relationCascade") && {
    //   relationCascade: Yup.string().required(
    //     "Relation Cascade Value is required"
    //   ),
    // }),

    // Conditionally validate relationCascade based on relationType
    ...(currentFields.includes("relation") && {
      relationCascade: Yup.string().when("relationType", (relationType: any, schema) => {
        return relationType === "one-to-one"
          ? schema.required(ERROR_MESSAGES.RELATION_CASCADE)
          : schema.notRequired();
      }),
    }),


    ...(currentFields.includes("relationModelModuleName") && {
      relationModelModuleName: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Relation Model Module Name Value')
      ),
    }),

    ...(currentFields.includes("relationFieldFixedFilter") && {
      relationFieldFixedFilter: Yup.string().nullable(),
    }),

    ...(currentFields.includes("selectionDynamicProvider") && {
      selectionDynamicProvider: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Selection Dynamic Provider Value ')
      ),
    }),
    ...(currentFields.includes("selectionDynamicProviderCtxt") && {
      selectionDynamicProviderCtxt: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Selection Dynamic Provider Context Value')
      ).test(
        ERROR_MESSAGES.IS_VALID_JSON,
        ERROR_MESSAGES.COMPUTED_FIELD_VALIDATE_JSON,
        (value) => {
          if (!value) return false; // Ensure it's required
          try {
            JSON.parse(value); // Check if it's valid JSON
            return true;
          } catch {
            return false;
          }
        }
      ),
    }),

    ...(currentFields.includes("selectionStaticValues") && {
      selectionStaticValues: Yup.array().of(
        Yup.string().matches(/^[\w\s\d-]+:[\w\s-]+$/, ERROR_MESSAGES.FIELD_REUQIRED('Label and Value'))
      ),
    }),
    ...(currentFields.includes("computedFieldValueProvider") && {
      computedFieldValueProvider: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Computed Field Function Value')
      ),
    }),
    ...(currentFields.includes("computedFieldValueProviderCtxt") && {
      computedFieldValueProviderCtxt: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('"Computed Field Value Provider Context Value')
      ).test(
        ERROR_MESSAGES.IS_VALID_JSON,
        ERROR_MESSAGES.COMPUTED_FIELD_VALIDATE_JSON,
        (value) => {
          if (!value) return false; // Ensure it's required
          try {
            JSON.parse(value); // Check if it's valid JSON
            return true;
          } catch {
            return false;
          }
        }
      ),

    }),
    ...(currentFields.includes("computedFieldValueType") && {
      computedFieldValueType: Yup.string().required(
        ERROR_MESSAGES.FIELD_REUQIRED('Computed Field Value Type')
      ),
    }),
    ...(currentFields.includes("computedFieldTriggerConfig") && {
      computedFieldTriggerConfig: Yup.array()
        .of(
          Yup.object().shape({
            moduleName: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Module name')),
            modelName: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED('Model name')),
            operations: Yup.array().of(Yup.string()).min(1, ERROR_MESSAGES.SELECT_ONE_OPERATION),
          })
        )
        .min(1, ERROR_MESSAGES.FIELD_REUQIRED('At least one trigger config'))
        .required(ERROR_MESSAGES.FIELD_REUQIRED('Computed Field Trigger Config')),
    }),

    // ...(currentFields.includes("columnName") && { columnName: Yup.string().nullable().matches(/^[a-z0-9_]+$/, ERROR_MESSAGES.SNAKE_CASE('column')), }),
    ...(currentFields.includes("isPrimaryKey") && { isPrimaryKey: Yup.boolean(), }),

    ...(currentFields.includes("required") && {
      required: Yup.boolean().when("isPrimaryKey", (isPrimaryKey: any, schema) => {
        if (isPrimaryKey.length > 0 && isPrimaryKey[0] === true) {
          return schema.oneOf([true], "Required must be true when field is marked as Primary Key");
        }
        return schema;
      }),
    }),

    ...(currentFields.includes("unique") && {
      unique: Yup.boolean().when("isPrimaryKey", (isPrimaryKey: any, schema) => {
        if (isPrimaryKey.length > 0 && isPrimaryKey[0] === true) {
          return schema.oneOf([true], "Unique must be true when field is marked as Primary Key");
        }
        return schema;
      }).when("required", (required: any, schema) => {
        // Disallow unique field that is not required
        if (required.length > 0 && required[0] === false) {
          return schema.oneOf([false], "Unique fields must also be marked as Required");
        }
        return schema;
      }),
    }),


    // ...(currentFields.includes("externalIdProvider") && {
    //   externalIdProvider: Yup.string().required(
    //     "ExternalId Provider Value is required"
    //   ),
    // }),
    // ...(currentFields.includes("externalIdProviderCtxt") && {
    //   externalIdProviderCtxt: Yup.string().required(
    //     "EexternalId Provider Context Value is required"
    //   ),
    // }),
  };

  return Yup.object(schema);
};

const FieldMetaDataForm = ({ setIsDirty, modelMetaData, fieldMetaData, setFieldMetaData, allFields, deleteModelFunction, setVisiblePopup, params, setIsRequiredPopUp, showToaster }: any) => {
  const booleanOptions = ["false", "true"];
  const booleanSegmentedOptions = booleanOptions.map((value) => ({
    label: capitalize(value),
    value,
  }));
  const resolveBooleanOptionValue = (value: any) =>
    typeof value === "string" ? value : value ? "true" : "false";
  const [isBackPopupVisible, setIsBackPopupVisible] = useState(false);
  const [showColumnName, setShowColumnName] = useState<any>(false);

  const pathname = usePathname();

  const { data: fieldDefaultMetaData, isLoading, error, refetch } = useGetFieldDefaultMetaDataQuery(null);
  const [currentFields, setCurrentFields] = useState(
    fetchCurrentFields(fieldMetaData && fieldMetaData.type, fieldDefaultMetaData)
  );

  const [triggerGetMediaStorageProvider, { data: MediaStorageProviderData, isFetching: isMediaStorageProviderFetching, error: MediaStorageProviderError }] = useLazyGetMediaStorageProvidersQuery();
  const [triggerGetModules, { data: moduleData, isFetching: isModuleFetching, error: moduleError }] = useLazyGetmodulesQuery();
  const [triggerGetModels, { data: modelData, isFetching: ismodelFetching, error: modelError }] = useLazyGetModelsQuery();
  const [
    updateUserKey,
    { isLoading: isUpdateUserKeyLoading, isSuccess: isUpdateUserKeySuccess, isError: isUpdateUserKeyError, error: UpdateUserKeyError, data: newModel },
  ] = useUpdateUserKeyMutation();


  const [markdownText, setMarkdownText] = useState<string>();
  const [encryptState, setEncryptState] = useState<boolean>(Boolean(fieldMetaData?.encrypt));

  const [showTypeFilter, setShowTypeFilter] = useState(fieldMetaData ? false : true);
  const [selectedType, setSelectedType] = useState<{ label: string; value: string } | null>(
    fieldMetaData?.type ? { label: fieldMetaData.type, value: fieldMetaData.type } : null
  );
  const selectedTypeValue = selectedType?.value || "";
  const [selectedComputedFieldValueType, setSelectedComputedFieldValueType] = useState(fieldMetaData?.computedFieldValueType && { label: fieldMetaData.computedFieldValueType, value: fieldMetaData.computedFieldValueType });
  const [selectionDynamicProvider, setSelectionDynamicProvider] = useState(fieldMetaData?.selectionDynamicProvider && { label: fieldMetaData.selectionDynamicProvider, value: fieldMetaData.selectionDynamicProvider });
  // const [externalIdProvider, setExternalIdProvider] = useState(fieldMetaData?.externalIdProvider && { label: fieldMetaData.externalIdProvider, value: fieldMetaData.externalIdProvider });
  const [filteredComputedFieldValueTypes, setFilteredComputedFieldValueTypes] = useState([]);
  const [
    filteredSelectionDynamicProvider,
    setFilteredSelectionDynamicProvider,
  ] = useState([]);

  const [ormTypeOptions, setOrmTypeOptions] = useState([]);
  const [selectedOrmType, setSelectedOrmType] = useState<any>(fieldMetaData?.ormType);

  const [askForUserKeyField, setAskForUserKeyField] = useState(false);
  const [userKeyFieldData, setUserKeyFieldData] = useState([]);

  const [
    filteredExternalIdProvider,
    setFilteredExternalIdProvider,
  ] = useState([]);

  const [filteredSelectionEncryptionType, setFilteredSelectionEncryptionType] = useState([]);

  const [filteredSelectionDecryptWhen, setFilteredSelectionDecryptWhen] = useState([]);

  const validationSchema = React.useMemo(
    () => createValidationSchema(currentFields, selectedType, allFields, fieldMetaData, encryptState),
    [currentFields, encryptState]
  );

  const [typeSelected, setTypeSelected] = useState(false);
  const showRegexFields = currentFields.includes("regexPattern");
  const showMinFields = currentFields.includes("min");
  const showMaxFields = currentFields.includes("max");
  const showOrmOptions = currentFields.includes("ormType") && Boolean(ormTypeOptions && ormTypeOptions.length);
  const showValidationSection =
    selectedTypeValue !== "relation" && (showRegexFields || showMinFields || showMaxFields || showOrmOptions);

  const searchMediaStorageProvIderId = async (event: any) => {
    try {
      const query = event.query;
      const queryData = {
        limit: 10,
        offset: 0,
        // filters: {
        //   name: {
        //     $containsi: query,
        //   },
        // },
      };

      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true,
      });

      const result = await triggerGetMediaStorageProvider(queryString).unwrap();

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
    const query = event.query;
    const queryData = {
      limit: 10,
      offset: 0,
      // filters: {
      //   title: {
      //     $containsi: query
      //   }
      // }
    };

    const queryString = qs.stringify(queryData, {
      encodeValuesOnly: true
    });

    // Trigger the API call manually
    const result = await triggerGetModels(queryString).unwrap(); // Unwrap to access the data

    // Map the API response to AutoComplete format
    if (result && result.records) {
      const filteredMenu = result.records.map((m: any) => (
        {
          label: m.name,
          value: m.id,
          name: m.name,
          id: m.id,
        }
      ));

      // Update the suggestions in state
      return filteredMenu
    } else {
      // Handle the case where no data is returned
      return []
    }
  };




  const searchOrmTypes = async (event: any) => {
    const query = event.query;
    try {

      const ormType = fieldDefaultMetaData.data.ormType[modelMetaData?.dataSourceType];
      const _filteredOrmType = ormType[formik.values.type].ormTypes.map((e: any) => ({ label: e, value: e }))

      const suggestionData: any = _filteredOrmType.filter((t: any) => t.label.toLowerCase().startsWith(query.toLowerCase()));
      return suggestionData
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      return []
    }
  };




  const searchRelationModelModuleNames = async (event: any) => {
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

      const result = await triggerGetModules(queryString).unwrap(); // Unwrap to access the data

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

  const searchrelationCoModelSingularNames = async (event: any) => {
    try {
      const query = event.query;
      const queryData: any = {
        limit: 10,
        offset: 0,
        filters: {
          module: {
            name: {
              $containsi: formik.values.relationModelModuleName
            }
          }
        }
      };
      if (query) {
        queryData.filters.singularName = {
          $containsi: query,
        };
      }
      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true,
      });

      const result = await triggerGetModels(queryString).unwrap(); // Unwrap to access the data

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

  const searchModuleName = async (event: any) => {
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

      const result = await triggerGetModules(queryString).unwrap(); // Unwrap to access the data

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

  const getSearchModelNameHandler = useCallback(
    (moduleName: string) => {
      return async (event: any) => {
        try {
          const query = event.query;
          const queryData: any = {
            limit: 10,
            offset: 0,
            filters: {
              module: {
                name: {
                  $containsi: moduleName,
                },
              },
            },
          };

          if (query) {
            queryData.filters.singularName = {
              $containsi: query,
            };
          }

          const queryString = qs.stringify(queryData, { encodeValuesOnly: true });
          const result = await triggerGetModels(queryString).unwrap();
          return result?.records ?? [];
        } catch (error) {
          return [];
        }
      };
    },
    [] // or include dependencies like triggerGetModels if needed
  );

  const searchUserKeyField = () => {
    return userKeyFieldData;
  }

  const searchComputedFieldValueType = async (event: any) => {
    const query = event.query;
    try {

      const _filteredTypes: any = fieldDefaultMetaData.data.computedFieldValueTypes.filter((t: any) => t.label.toLowerCase().startsWith(query.toLowerCase()));

      setFilteredComputedFieldValueTypes(_filteredTypes);
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      setFilteredComputedFieldValueTypes([]);
    }
  };



  const searchSelectionDynamicProvider = async (event: any) => {
    const query = event.query;
    try {
      const filterredData: any = fieldDefaultMetaData.data.selectionDynamicProviders.filter((t: any) => t.provider.toLowerCase().startsWith(query.toLowerCase()));
      const transformedData = filterredData.map((e: any) => ({ label: e.provider, value: e.provider, help: e.help }));
      return transformedData
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      return []
    }
  };



  const searchComputedProvider = async (event: any) => {
    const query = event.query;
    try {
      const filterredData: any = fieldDefaultMetaData.data.computedProviders.filter((t: any) => t.provider.toLowerCase().startsWith(query.toLowerCase()));
      const transformedData = filterredData.map((e: any) => ({ label: e.provider, value: e.provider, help: e.help }));
      return transformedData
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      return []
    }
  };

  const searchExternalIdProvider = async (event: any) => {
    const query = event.query;
    try {
      const filterredData: any = fieldDefaultMetaData.data.externalIdProviders.filter((t: any) => t.provider.toLowerCase().startsWith(query.toLowerCase()));
      const transformedData = filterredData.map((e: any) => ({ label: e.provider, value: e.provider, help: e.help }));
      return transformedData
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      return []
    }
  };



  const searchSelectionEncryptionType = async (event: any) => {
    const query = event.query;
    try {

      const _filteredTypes: any = fieldDefaultMetaData.data.encryptionTypes.filter((t: any) => t.label.toLowerCase().startsWith(query.toLowerCase()));

      setFilteredSelectionEncryptionType(_filteredTypes);
      return _filteredTypes
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      setFilteredSelectionEncryptionType([]);
      return []
    }
  };

  const searchSelectionDecryptWhen = async (event: any) => {
    const query = event.query;
    try {

      const _filteredTypes: any = fieldDefaultMetaData.data.decryptWhenTypes.filter((t: any) => t.label.toLowerCase().startsWith(query.toLowerCase()));

      setFilteredSelectionDecryptWhen(_filteredTypes);
      return _filteredTypes
    } catch (error) {
      console.error(ERROR_MESSAGES.FETCHING_ITEMS, error);
      setFilteredSelectionDecryptWhen([]);
      return []
    }
  };


  const isFormFieldValid = (formik: any, fieldName: string) => {
    return formik.touched[fieldName] && formik.errors[fieldName];
  };


  const mediaStorageProviderId = [
    { label: "mediaStorageProviderId", value: "mediaStorageProviderId" },
    { label: "id2", value: "2" },
  ];

  const selctionValueTypes = [
    { label: "String", value: "string" },
    { label: "Int", value: "int" },
  ];


  const relationCreateInverses = [
    { label: "True", value: "true" },
    { label: "False", value: "false" },
  ];

  const defaultPasswordPolicy = fieldMetaData?.regexPattern;
  const [selectedPasswordPolicy, setSelectedPasswordPolicy] = useState<any>(defaultPasswordPolicy);
  const passwordPolicyOptions = [
    { label: 'Lowercase and Uppercase Alphabets Required', value: '^(?=.*[a-z])(?=.*[A-Z]).*$' },
    { label: 'Lowercase and Uppercase Alphabets and Numbers Required', value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$' },
    { label: 'Lowercase and Uppercase Alphabets, Numbers, and Special Characters Required', value: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).*$' },
    { label: 'custom', value: 'custom' },

  ];

  const mediaTypesOptions = [
    { label: 'Image (Supports JPEG, PNG, WEBP, etc.)', value: 'image' },
    { label: 'Audio (Supports MP3, WAV, AAC, etc.)', value: 'audio' },
    { label: 'Video (Supports MP4, AVI, MKV, etc.)', value: 'video' },
    { label: 'File (Supports PDF, DOCX, TXT, etc.)', value: 'file' }
  ];

  const resolvedMediaTypeOptions = useMemo(
    () => fieldDefaultMetaData?.data?.mediaTypes ?? mediaTypesOptions,
    [fieldDefaultMetaData?.data?.mediaTypes]
  );

  const [filteredMediaTypes, setFilteredMediaTypes] = useState(resolvedMediaTypeOptions);

  useEffect(() => {
    setFilteredMediaTypes(resolvedMediaTypeOptions);
  }, [resolvedMediaTypeOptions]);

  const handleMediaTypesSearch = useCallback(
    (event: { query: string }) => {
      const query = (event.query || "").toLowerCase();
      if (!query) {
        setFilteredMediaTypes(resolvedMediaTypeOptions);
        return;
      }
      setFilteredMediaTypes(
        resolvedMediaTypeOptions.filter(
          (option: any) =>
            option.label?.toLowerCase().includes(query) || option.value?.toLowerCase().includes(query)
        )
      );
    },
    [resolvedMediaTypeOptions]
  );



  const parseComputedFieldTriggerConfig = (input: any) => {
    try {
      if (typeof input === "string") {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(input)) {
        return input;
      } else if (typeof input === "object" && input !== null) {
        return [input];
      }
    } catch {
      return [{ moduleName: "", modelName: "", operations: [] }];
    }

    return [{ moduleName: "", modelName: "", operations: [] }];
  };


  const initialValues = {
    name: fieldMetaData ? fieldMetaData?.name : null,
    displayName: fieldMetaData ? fieldMetaData?.displayName : null,
    description: fieldMetaData ? fieldMetaData?.description : null,
    type: fieldMetaData ? fieldMetaData?.type : null,
    ormType: fieldMetaData ? fieldMetaData?.ormType : null,
    length: fieldMetaData ? fieldMetaData?.length : null,
    defaultValue: fieldMetaData ? fieldMetaData?.defaultValue : null,
    regexPattern: fieldMetaData ? fieldMetaData?.regexPattern : null,
    regexPatternNotMatchingErrorMsg: fieldMetaData ? fieldMetaData?.regexPatternNotMatchingErrorMsg : "Invalid regex pattern",
    required: fieldMetaData ? fieldMetaData?.required : false,
    unique: fieldMetaData ? fieldMetaData?.unique : false,
    encrypt: fieldMetaData ? fieldMetaData?.encrypt : false,
    encryptionType: fieldMetaData ? fieldMetaData?.encryptionType : null,
    decryptWhen: fieldMetaData ? fieldMetaData?.decryptWhen : null,
    index: fieldMetaData ? fieldMetaData?.index : false,
    min: fieldMetaData ? fieldMetaData?.min : null,
    max: fieldMetaData ? fieldMetaData?.max : null,
    private: fieldMetaData ? fieldMetaData?.private : false,
    mediaTypes: fieldMetaData?.mediaTypes ?? [],
    mediaMaxSizeKb: fieldMetaData ? fieldMetaData?.mediaMaxSizeKb : null,
    mediaStorageProviderId: fieldMetaData ? fieldMetaData?.mediaStorageProvider?.id : null,
    mediaStorageProvider: fieldMetaData ? fieldMetaData?.mediaStorageProvider : null,
    mediaEmbedded: fieldMetaData ? (fieldMetaData?.mediaEmbedded && fieldMetaData?.mediaEmbedded.toString()) : "true",
    relationType: fieldMetaData ? fieldMetaData?.relationType : null,
    relationCoModelSingularName: fieldMetaData ? fieldMetaData?.relationCoModelSingularName : null,
    relationCoModelFieldName: fieldMetaData ? fieldMetaData?.relationCoModelFieldName : null,
    relationCreateInverse: fieldMetaData ? fieldMetaData?.relationCreateInverse : false,
    relationCascade: fieldMetaData ? fieldMetaData?.relationCascade : 'cascade',
    relationModelModuleName: fieldMetaData ? fieldMetaData?.relationModelModuleName : modelMetaData?.module.name,
    relationFieldFixedFilter: fieldMetaData ? fieldMetaData?.relationFieldFixedFilter : "",
    selectionDynamicProvider: fieldMetaData ? fieldMetaData?.selectionDynamicProvider : null,
    selectionDynamicProviderCtxt: fieldMetaData ? fieldMetaData?.selectionDynamicProviderCtxt : "",
    selectionStaticValues: fieldMetaData ? fieldMetaData?.selectionStaticValues : [""],
    selectionValueType: fieldMetaData ? fieldMetaData?.selectionValueType : null,
    computedFieldValueProvider: fieldMetaData ? fieldMetaData?.computedFieldValueProvider : null,
    computedFieldValueType: fieldMetaData ? fieldMetaData?.computedFieldValueType : null,
    computedFieldTriggerConfig: parseComputedFieldTriggerConfig(fieldMetaData?.computedFieldTriggerConfig),
    computedFieldValueProviderCtxt: fieldMetaData ? fieldMetaData?.computedFieldValueProviderCtxt : "",
    // externalIdProvider: fieldMetaData ? fieldMetaData?.externalIdProvider : null,
    // externalIdProviderCtxt: fieldMetaData ? fieldMetaData?.externalIdProviderCtxt : "",
    isSystem: fieldMetaData ? fieldMetaData?.isSystem : false,
    columnName: fieldMetaData ? fieldMetaData?.columnName : null,
    isUserKey: fieldMetaData ? fieldMetaData?.isUserKey : false,
    relationCoModelColumnName: fieldMetaData ? fieldMetaData?.relationCoModelColumnName : null,
    relationJoinTableName: fieldMetaData ? fieldMetaData?.relationJoinTableName : null,
    userKey: fieldMetaData ? fieldMetaData?.userKey : null,
    enableAuditTracking: fieldMetaData ? fieldMetaData?.enableAuditTracking : true,
    isPrimaryKey: fieldMetaData ? fieldMetaData?.isPrimaryKey : false,
    isMultiSelect: fieldMetaData ? fieldMetaData?.isMultiSelect : false,
  };


  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setFieldMetaData((prevItems: any) => {
          const newFieldData = { ...values, isSystem: values.isSystem == true ? true : '' }
          const formtatedFieldPayload = fieldBasedPayloadFormating(newFieldData, currentFields, fieldMetaData);
          const existingIndex = prevItems.findIndex((item: any) => item.identifier === formtatedFieldPayload.identifier);
          let updatedItems;
          if (existingIndex !== -1) {
            updatedItems = [...prevItems];
            updatedItems[existingIndex] = formtatedFieldPayload;
            return updatedItems
          }
          else {
            updatedItems = [...prevItems, formtatedFieldPayload];
            if (params?.id !== 'new' && formtatedFieldPayload?.required && !formtatedFieldPayload?.defaultValue) {
              setIsRequiredPopUp(true);
            }
            // return [...prevItems, formtatedFieldPayload]
          }
          return updatedItems;
        });
        if (values.userKey) {
          const data = {
            modelName: values.relationCoModelSingularName,
            fieldName: values.userKey
          }
          updateUserKey(data);
        }
        // nextTab()
        setVisiblePopup(false);

      } catch (err) {
        console.error(ERROR_MESSAGES.CREATE_MODEL, err);
      }
    },
    validateOnBlur: false // Disable validation on blur



  });

  const mediaTypeSelectedItems = useMemo(() => {
    if (!Array.isArray(formik.values.mediaTypes)) return [];
    return formik.values.mediaTypes.map((entry: any) => {
      if (entry && typeof entry === "object") {
        if (entry.label && entry.value) {
          return entry;
        }
        if (entry.value) {
          const fromOptions = resolvedMediaTypeOptions.find((option: any) => option.value === entry.value);
          return fromOptions || { label: entry.value, value: entry.value };
        }
      }
      const fromOptions = resolvedMediaTypeOptions.find((option: any) => option.value === entry);
      return fromOptions || { label: String(entry), value: entry };
    });
  }, [formik.values.mediaTypes, resolvedMediaTypeOptions]);

  const resetFormStateForTypeSelection = useCallback((options?: { keepSelectedType?: boolean }) => {
    formik.resetForm();
    const baseValues = formik.initialValues;
    setShowColumnName(Boolean(baseValues.columnName));
    setEncryptState(Boolean(baseValues.encrypt));
    setMarkdownText(undefined);
    setSelectedComputedFieldValueType(
      baseValues?.computedFieldValueType
        ? { label: baseValues.computedFieldValueType, value: baseValues.computedFieldValueType }
        : null
    );
    setSelectedPasswordPolicy(baseValues?.regexPattern || defaultPasswordPolicy || "");
    setOrmTypeOptions([]);
    setSelectedOrmType(baseValues?.ormType);
    setAskForUserKeyField(false);
    setUserKeyFieldData([]);
    if (!options?.keepSelectedType) {
      if (fieldMetaData?.type) {
        setSelectedType({ label: fieldMetaData.type, value: fieldMetaData.type });
      } else {
        setSelectedType(null);
      }
    }
  }, [
    defaultPasswordPolicy,
    fieldMetaData,
    formik,
  ]);

  const showError = async () => {
    const errors = await formik.validateForm(); // Trigger validation and get the updated errors
    const collectMessages = (value: any): string[] => {
      if (!value) return [];
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) {
        return value.flatMap(collectMessages);
      }
      if (typeof value === "object") {
        return Object.values(value).flatMap(collectMessages);
      }
      return [String(value)];
    };
    const errorMessages = Object.values(errors).flatMap(collectMessages);

    if (errorMessages.length > 0) {
      showToaster(errorMessages, "error");
    }
  };

  useEffect(() => {
    if (isUpdateUserKeySuccess) {
      showToaster([newModel?.data?.message], "success");
    } if (isUpdateUserKeyError) {
      showToaster(UpdateUserKeyError, 'error')
    }
  }, [isUpdateUserKeySuccess, isUpdateUserKeyError])

  const handleTypeSelect = (e: any, label: string) => {
    if (!fieldMetaData) {
      resetFormStateForTypeSelection({ keepSelectedType: true });
    }
    setShowTypeFilter(false);
    setSelectedType({ label: label, value: e });
    formik.setFieldValue("type", e);
    if (e == "email") {
      formik.setFieldValue("regexPattern", "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    } else {
      formik.setFieldValue("regexPattern", "");
    }
    const ormType = fieldDefaultMetaData.data.ormType[modelMetaData?.dataSourceType];
    const availableOrmTypes = ormType[e];
    // setFilteredOrmTypes(availableOrmTypes.ormTypes.map((e: any) => ({
    //   label: e,
    //   value: e,
    // })));
    // setSelectedOrmType({ label: availableOrmTypes.ormTypes[0], value: availableOrmTypes.ormTypes[0] });
    setOrmTypeOptions(availableOrmTypes.ormTypes)
    formik.setFieldValue("ormType", availableOrmTypes.ormTypes[0].label);
    setSelectedOrmType(availableOrmTypes.ormTypes[0].label)
    setCurrentFields(
      fetchCurrentFields(e, fieldDefaultMetaData)
    );
    // setTypeSelected(true);
  }


  useEffect(() => {
    if (!fieldDefaultMetaData || !formik.values.type || !modelMetaData?.dataSourceType) {
      setOrmTypeOptions([]);
      return;
    }
    const ormTypeBySource = fieldDefaultMetaData.data.ormType?.[modelMetaData.dataSourceType];
    const typeConfig = ormTypeBySource?.[formik.values.type];
    setOrmTypeOptions(typeConfig?.ormTypes ?? []);
  }, [fieldDefaultMetaData, formik.values.type, modelMetaData?.dataSourceType]);


  useEffect(() => {
    if (fieldMetaData && fieldMetaData.columnName) {
      setShowColumnName(true)
    }
  }, [fieldMetaData])

  useEffect(() => {
    const fetchFields = async () => {
      const queryData: any = {
        limit: 100,
        offset: 0,
        filters: {
          singularName: {
            $eq: formik.values.relationCoModelSingularName
          }
        },
        populate: ['fields']
      };
      const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true,
      });
      const result = await triggerGetModels(queryString).unwrap();

      if (result && result.records) {
        if (!result?.records[0]?.userKeyField) {
          setAskForUserKeyField(true);
          const validUserKeyFields = result?.records[0]?.fields?.filter(
            (field: any) => field?.unique === true && field?.type === 'shortText'
          );
          setUserKeyFieldData(validUserKeyFields)
        } else {
          setAskForUserKeyField(false);
          setUserKeyFieldData([]);
        }
      }
    }
    if (formik.values.relationCoModelSingularName) {
      fetchFields();
    }
  }, [formik.values.relationCoModelSingularName])

  const updateEnumValues = (index: number, updatedString: string) => {
    const updatedValues = formik.values.selectionStaticValues.map((enumValue: string, i: number) =>
      i === index ? updatedString : enumValue
    );
    formik.setFieldValue("selectionStaticValues", updatedValues);
  };

  const addEnumValue = () => {
    formik.setFieldValue("selectionStaticValues", [...formik.values.selectionStaticValues, ":"]);
  };

  const deleteEnumValue = (index: number) => {
    if (formik.values.selectionStaticValues.length > 1) {
      const updatedRows = formik.values.selectionStaticValues.filter((_: string, rowIndex: number) => rowIndex !== index);
      formik.setFieldValue("selectionStaticValues", updatedRows);
    } else {

    }
  };

  useEffect(() => {
    if (formik.dirty) {
      setIsDirty(true);
    }
  }, [formik.dirty]);

  const handleChange = (index: number, updatedRow: any) => {
    const updatedRows = [...formik.values.computedFieldTriggerConfig];
    updatedRows[index] = updatedRow;
    formik.setFieldValue("computedFieldTriggerConfig", updatedRows);
  };

  const handleAdd = () => {
    const updatedRows = [
      ...formik.values.computedFieldTriggerConfig,
      { moduleName: '', modelName: '', operations: [] }
    ];
    formik.setFieldValue("computedFieldTriggerConfig", updatedRows);
  };

  const handleDelete = (index: number) => {
    const updatedRows = formik.values.computedFieldTriggerConfig.filter((_: any, i: number) => i !== index);
    formik.setFieldValue("computedFieldTriggerConfig", updatedRows.length > 0 ? updatedRows : [{ moduleName: '', modelName: '', operations: [] }]);
  };

  const computedFieldSearchHandlers = useMemo(() => {
    return formik.values.computedFieldTriggerConfig.map(row =>
      getSearchModelNameHandler(row.moduleName)
    );
  }, [formik.values.computedFieldTriggerConfig]);

  const mediaStorageProviderField = useSolidAutocompleteField({
    formik,
    fieldName: "mediaStorageProvider",
    fieldNameId: "mediaStorageProviderId",
    labelKey: "name",
    valueKey: "value",
    searchData: searchMediaStorageProvIderId,
    existingData: formik.values.mediaStorageProvider,
    relationField: true,
  });

  const relationModelModuleExisting = useMemo(
    () => createRelationAutocompleteValue(formik.values.relationModelModuleName, "name", "name"),
    [formik.values.relationModelModuleName]
  );
  const relationModelModuleField = useSolidAutocompleteField({
    formik,
    fieldName: "relationModelModuleName",
    fieldNameId: null,
    labelKey: "name",
    valueKey: "name",
    searchData: searchRelationModelModuleNames,
    existingData: relationModelModuleExisting,
    relationField: true,
    additionalAction: () => {
      formik.setFieldValue("relationCoModelSingularName", "");
      formik.setFieldValue("relationCoModelColumnName", "");
      formik.setFieldValue("relationJoinTableName", "");
    }
  });

  const relationCoModelExisting = useMemo(
    () => createRelationAutocompleteValue(formik.values.relationCoModelSingularName, "displayName", "singularName"),
    [formik.values.relationCoModelSingularName]
  );
  const relationCoModelField = useSolidAutocompleteField({
    formik,
    fieldName: "relationCoModelSingularName",
    fieldNameId: null,
    labelKey: "displayName",
    valueKey: "singularName",
    searchData: searchrelationCoModelSingularNames,
    existingData: relationCoModelExisting,
    relationField: true,
  });

  const userKeyExisting = useMemo(
    () => createRelationAutocompleteValue(formik.values.userKey, "displayName", "name"),
    [formik.values.userKey]
  );
  const userKeyField = useSolidAutocompleteField({
    formik,
    fieldName: "userKey",
    fieldNameId: null,
    labelKey: "displayName",
    valueKey: "name",
    searchData: searchUserKeyField,
    existingData: userKeyExisting,
    relationField: true,
  });

  const selectionDynamicProviderExisting = useMemo(
    () => createSimpleAutocompleteValue(formik.values.selectionDynamicProvider),
    [formik.values.selectionDynamicProvider]
  );
  const selectionDynamicProviderField = useSolidAutocompleteField({
    formik,
    fieldName: "selectionDynamicProvider",
    labelKey: "label",
    valueKey: "value",
    searchData: searchSelectionDynamicProvider,
    existingData: selectionDynamicProviderExisting,
    additionalAction: (e: any) => setMarkdownText(e.target.value.help),
  });

  const computedFieldValueProviderExisting = useMemo(
    () => createSimpleAutocompleteValue(formik.values.computedFieldValueProvider),
    [formik.values.computedFieldValueProvider]
  );
  const computedFieldValueProviderField = useSolidAutocompleteField({
    formik,
    fieldName: "computedFieldValueProvider",
    labelKey: "label",
    valueKey: "value",
    searchData: searchComputedProvider,
    existingData: computedFieldValueProviderExisting,
    additionalAction: (e: any) => setMarkdownText(e.target.value.help),
  });

  const encryptionTypeExisting = useMemo(
    () => createSimpleAutocompleteValue(formik.values.encryptionType),
    [formik.values.encryptionType]
  );
  const decryptWhenExisting = useMemo(
    () => createSimpleAutocompleteValue(formik.values.decryptWhen),
    [formik.values.decryptWhen]
  );

  const encryptionTypeField = useSolidAutocompleteField({
    formik,
    fieldName: "encryptionType",
    fieldNameId: "encryptionType",
    labelKey: "label",
    valueKey: "value",
    searchData: searchSelectionEncryptionType,
    existingData: encryptionTypeExisting,
  });

  const decryptWhenField = useSolidAutocompleteField({
    formik,
    fieldName: "decryptWhen",
    fieldNameId: "decryptWhen",
    labelKey: "label",
    valueKey: "value",
    searchData: searchSelectionDecryptWhen,
    existingData: decryptWhenExisting,
  });


  return (
    <div>
      <div>
        <form
          onSubmit={formik.handleSubmit}
          onReset={(event) => {
            event.preventDefault();
            resetFormStateForTypeSelection();
          }}
        >
          <div className="solid-field-metadata-form-header">
            {pathname.includes('create') ?
              <>
                <div className="flex align-items-center gap-3">
                  {showTypeFilter === false ?
                    <>
                      <SolidButton
                        text
                        icon='pi pi-arrow-left'
                        size="small"
                        type="button"
                        aria-label="Back"
                        className='max-w-2rem bg-primary-reverse text-color solid-icon-button'
                        onClick={() => {
                          if (!formik.values.displayName) {
                            resetFormStateForTypeSelection();
                            setShowTypeFilter(true);
                          } else {
                            setIsBackPopupVisible(true)
                          }
                        }
                        }
                      />
                      <div className="form-wrapper-title solid-mobile-text-wrapper text-base">{capitalize(modelMetaData?.displayName)}</div>
                    </>
                    :
                    <div className="flex text-2xl font-bold align-items-center ml-4" style={{ color: '#000' }}>
                      <div className="form-wrapper-title solid-mobile-text-wrapper text-base">Model - {capitalize(modelMetaData?.displayName)}</div>
                    </div>
                  }
                </div>
                <div className="flex align-items-center gap-3 close-popup">
                  <SolidButton icon="pi pi-times" rounded text aria-label="Cancel" type="reset" size="small" onClick={() => setVisiblePopup(false)}
                    className='max-w-2rem bg-primary-reverse text-color' />
                </div>
              </>
              :
              <>
                <div className="flex align-items-center gap-3">
                  {!fieldMetaData?.id &&
                    <SolidButton
                      text
                      icon='pi pi-arrow-left'
                      size="small"
                      type="button"
                      aria-label="Back"
                      className='max-w-2rem bg-primary-reverse text-color solid-icon-button'
                      onClick={() => {
                        if (!formik.values.displayName) {
                          resetFormStateForTypeSelection();
                          setShowTypeFilter(true);
                        } else {
                          setIsBackPopupVisible(true)
                        }
                      }
                      } />
                  }
                  {fieldMetaData ?

                    <div className="form-wrapper-title solid-mobile-text-wrapper">Edit {capitalize(fieldMetaData?.displayName)}</div>
                    :
                    <div className="form-wrapper-title solid-mobile-text-wrapper">Add New {selectedType?.label && !showTypeFilter && capitalize(selectedType.label)} Field to {capitalize(modelMetaData?.displayName)}</div>
                  }
                </div>
                <div className="flex align-items-center gap-3 close-popup">
                  <SolidButton icon="pi pi-times" text aria-label="Cancel" type="reset" size="small" onClick={() => setVisiblePopup(false)}
                    className='max-w-2rem bg-primary-reverse text-color'
                  />
                </div>
              </>
            }
          </div>
          {showTypeFilter === true ?
            <FieldSelector
              handleTypeSelect={handleTypeSelect}
              modelMetaData={modelMetaData}
            ></FieldSelector>
            :
            <div className="p-3" style={{ maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="p-d-flex p-jc-center creat-field-for form-dem">
                <div className="p-fluid" style={{ position: 'relative' }}>
                  {/* <div className="mb-3">
                    <div className="form-wrapper-title">{fieldMetaData ? `Edit ${capitalize(selectedType.label)} Field` : `Add a new ${capitalize(selectedType.label)} Field`}</div>
                  </div> */}
                  <TabView panelContainerClassName="px-0">
                    <TabPanel
                      header="Basic Info"
                      className={(formik.touched.hasOwnProperty("name") && formik.errors.hasOwnProperty("name")) || (formik.touched.hasOwnProperty("displayName") && formik.errors.hasOwnProperty("displayName")) || (formik.touched.hasOwnProperty("displayName") && formik.errors.hasOwnProperty("ormType")) ? "tab-error-heading" : ""}
                    // rightIcon="pi pi-info-circle ml-2"
                    >
                      <div className="formgrid grid">
                        {currentFields.includes("displayName") && (
                          <div className="field col-12 md:col-6 mt-2">
                            <label htmlFor="displayName" className={classNames("form-field-label", styles.fieldLabel)}>
                              Display Name
                            </label>
                            <SolidInput
                              type="text"
                              disabled={fieldMetaData?.id}
                              id="displayName"
                              name="displayName"
                              onChange={(e) => {
                                formik.setFieldValue("displayName", e.target.value);
                                const { toCamelCase, toSnakeCase } = getSingularAndPlural(e.target.value);
                                formik.setFieldValue("name", toCamelCase);
                                if (showColumnName) {
                                  formik.setFieldValue("columnName", toSnakeCase);
                                }
                              }}
                              value={formik.values.displayName}
                              className={classNames(styles.fieldInput, {
                                "p-invalid": isFormFieldValid(formik, "displayName"),
                              })}
                            />
                            {isFormFieldValid(formik, "displayName") && (
                              <p className={styles.fieldError}>{formik?.errors?.displayName?.toString()}</p>
                            )}
                          </div>
                        )}

                        {currentFields.includes("name") && (
                          <div className="field col-12 md:col-6 mt-1 md:mt-0">
                            <label htmlFor="name" className={classNames("form-field-label", styles.fieldLabel)}>
                              Name
                            </label>
                            <SolidInput
                              disabled={fieldMetaData?.id}
                              type="text"
                              id="name"
                              name="name"
                              onChange={formik.handleChange}
                              value={formik.values.name}
                              className={classNames(styles.fieldInput, {
                                "p-invalid": isFormFieldValid(formik, "name"),
                              })}
                            />
                            {isFormFieldValid(formik, "name") && (
                              <p className={styles.fieldError}>{formik?.errors?.name?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("description") && (
                          <div className="field col-12 md:col-6 mt-1 md:mt-2">
                            <label htmlFor="description" className={classNames("form-field-label", styles.fieldLabel)}>
                              Description
                            </label>
                            <SolidTextarea
                              aria-describedby="Description of your field"
                              id="description"
                              name="description"
                              onChange={formik.handleChange}
                              value={formik.values.description}
                              rows={5}
                              cols={30}
                              className={classNames(styles.fieldTextarea, {
                                "p-invalid": isFormFieldValid(formik, "description"),
                              })}
                            />
                            {isFormFieldValid(formik, "description") && (
                              <p className={styles.fieldError}>{formik?.errors?.description?.toString()}</p>
                            )}
                          </div>
                        )}

                        {currentFields.includes("columnName") && (
                          <div className="field col-12 md:col-6 mt-2">
                            <div className="flex align-items-center gap-2">
                              <SolidCheckbox
                                onChange={(event) => {
                                  const checked = event.currentTarget.checked;
                                  setShowColumnName(checked);
                                  if (checked === true) {
                                    const { toSnakeCase } = getSingularAndPlural(formik.values.displayName);
                                    if (pathname.includes('create')) {
                                      formik.setFieldValue("columnName", toSnakeCase);
                                    }
                                  } else {
                                    formik.setFieldValue("columnName", null);
                                  }
                                }}
                                checked={showColumnName}
                                disabled={fieldMetaData?.id}
                              />
                              <label htmlFor="ingredient1" className="form-field-label">
                                Set Column Name
                              </label>
                            </div>
                            {showColumnName && (
                              <div className="field col-12 gap-2 mt-4">
                                <label htmlFor="columnName" className={classNames("form-field-label", styles.fieldLabel)}>
                                  Column Name
                                </label>
                                <SolidInput
                                  disabled={fieldMetaData?.id}
                                  type="text"
                                  id="columnName"
                                  name="columnName"
                                  onChange={formik.handleChange}
                                  value={formik.values.columnName}
                                  className={classNames(styles.fieldInput, {
                                    "p-invalid": isFormFieldValid(formik, "columnName"),
                                  })}
                                />
                                {isFormFieldValid(formik, "columnName") && (
                                  <p className={styles.fieldError}>{formik?.errors?.columnName?.toString()}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}


                        {/* {currentFields.includes("type") && (
                          <div className="md:col-6 sm:col-12">
                            <div className="field col-6 flex-flex-column gap-2">
                              <label htmlFor="type" className="form-field-label">
                                Type
                              </label>
                              <SolidAutocomplete
                                value={selectedType}
                                suggestions={filteredTypes}
                                invalid={isFormFieldValid(formik, "type")}
                                completeMethod={searchTypes}
                                virtualScrollerOptions={{ itemSize: 38 }}
                                field="label"
                                className="small-input"
                                dropdown
                                onChange={(e) => {
                                  formik.setFieldTouched('type', true); // Manually mark as touched
                                  setSelectedType(e.value);
                                  formik.setFieldValue("type", e.value.value);
                                  if (e.value.value == "email") {
                                    formik.setFieldValue("regexPattern", "/^[a-zA-Z0-9. _%+-]+@[a-zA-Z0-9. -]+\\. [a-zA-Z]{2,}$/");
                                  } else {
                                    formik.setFieldValue("regexPattern", "");
                                  }
                                  const _filteredOrmType: any = fieldDefaultMetaData.data.ormType.filter((t: any) => t.solidType == e.value.value);
                                  setSelectedOrmType(_filteredOrmType[0].value)
                                  formik.setFieldValue("ormType", _filteredOrmType[0].value);

                                  setCurrentFields(
                                    fetchCurrentFields(e.value.value, fieldDefaultMetaData)
                                  );
                                }}


                              />

                              {isFormFieldValid(formik, "type") && (
                                <SolidMessage
                                  severity="error"
                                  text={formik?.errors?.type?.toString()}
                                />
                              )}
                            </div>
                          </div>
                        )} */}

                      </div>

                    </TabPanel>

                    <TabPanel header="Advanced Config"

                    //  rightIcon="pi pi-cog ml-2"
                    >
                      {formik?.values?.type?.length > 0 && (
                        <div className="formgrid grid">
                          {currentFields.includes("length") && (
                            <div className="field col-6 flex-flex-column gap-2">
                              <label htmlFor="length" className={classNames("form-field-label", styles.fieldLabel)}>
                                Length
                              </label>
                              <div className={styles.fieldNumberWrapper}>
                                <SolidNumberInput
                                  id="length"
                                  name="length"
                                  value={formik.values.length}
                                  onChange={(event) => formik.setFieldValue("length", event.value)}
                                  className={classNames({
                                    "p-invalid": isFormFieldValid(
                                      formik,
                                      "length"
                                    ),
                                  })}
                                />
                              </div>
                              {isFormFieldValid(formik, "length") && (
                                <p className={styles.fieldError}>{formik?.errors?.length?.toString()}</p>
                              )}
                            </div>
                          )}

                          {currentFields.includes("defaultValue") && selectedTypeValue === "boolean" &&
                            <div className="field col-12  md:col-6 flex flex-column gap-2 mt-2">

                              <label
                                style={{ marginBottom: "0px" }}
                                htmlFor="defaultValue"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Default Value
                              </label>
                              <SolidSegmentedControl
                                value={resolveBooleanOptionValue(formik.values.defaultValue)}
                                onChange={(value) => formik.setFieldValue("defaultValue", value)}
                                options={booleanSegmentedOptions}
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(formik, "defaultValue"),
                                })}
                              />
                            </div>
                          }

                          {currentFields.includes("defaultValue") && selectedTypeValue !== "boolean" && (
                            <div className="field col-12  md:col-6 flex flex-column gap-2 mt-2">

                              <label
                                style={{ marginBottom: "0px" }}
                                htmlFor="defaultValue"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Default Value
                              </label>

                              {(selectedTypeValue === "shortText" || selectedTypeValue === "longText" || selectedTypeValue === "richText" || selectedTypeValue === "json" || selectedTypeValue === "password" || selectedTypeValue === "selectionStatic") &&
                                <SolidInput
                                  type="text"
                                  id="defaultValue"
                                  name="defaultValue"
                                  onChange={formik.handleChange}
                                  value={formik.values.defaultValue}
                                  className={classNames(styles.fieldInput, {
                                    "p-invalid": isFormFieldValid(
                                      formik,
                                      "defaultValue"
                                    ),
                                  })}
                                />
                              }
                              {(selectedTypeValue === "float" || selectedTypeValue === "decimal") &&
                                <div className={styles.fieldNumberWrapper}>
                                  <SolidNumberInput
                                    id="defaultValue"
                                    name="defaultValue"
                                    step="0.00001"
                                    value={formik.values.defaultValue}
                                    onChange={(event) => formik.setFieldValue("defaultValue", event.value)}
                                    className={classNames({
                                      "p-invalid": isFormFieldValid(formik, "defaultValue"),
                                    })}
                                  />
                                </div>
                              }
                              {(selectedTypeValue === "int" || selectedTypeValue === "bigint") &&
                                <div className={styles.fieldNumberWrapper}>
                                  <SolidNumberInput
                                    id="defaultValue"
                                    name="defaultValue"
                                    step="1"
                                    value={formik.values.defaultValue}
                                    onChange={(event) => formik.setFieldValue("defaultValue", event.value)}
                                    className={classNames({
                                      "p-invalid": isFormFieldValid(formik, "defaultValue"),
                                    })}
                                  />
                                </div>
                              }

                              {(selectedTypeValue === "date" || selectedTypeValue === "datetime" || selectedTypeValue === "time") && (() => {
                                const showTimeSelect = selectedTypeValue === "datetime" || selectedTypeValue === "time";
                                const timeOnly = selectedTypeValue === "time";
                                const dateFormat =
                                  selectedTypeValue === "datetime"
                                    ? "yyyy-MM-dd HH:mm"
                                    : timeOnly
                                      ? "HH:mm"
                                      : "yyyy-MM-dd";
                                const timeFormat = "HH:mm";
                                return (
                                  <SolidDatePicker
                                    id="defaultValue"
                                    selected={formik.values.defaultValue ? new Date(formik.values.defaultValue) : undefined}
                                    onChange={(date: Date | null) => formik.setFieldValue("defaultValue", date)}
                                    showTimeSelect={showTimeSelect}
                                    timeOnly={timeOnly}
                                    dateFormat={dateFormat}
                                    timeFormat={timeFormat}
                                    inputClassName={classNames({
                                      "p-invalid": isFormFieldValid(formik, "defaultValue"),
                                    })}
                                  />
                                );
                              })()}
                              {isFormFieldValid(formik, "defaultValue") && (
                                <p className={styles.fieldError}>{formik?.errors?.defaultValue?.toString()}</p>
                              )}
                            </div>
                          )}

                          {currentFields.includes("mediaTypes") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2">
                              <label
                                htmlFor="mediaTypes"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Media Type
                              </label>
                              <div
                                className={classNames("solid-standard-autocomplete", {
                                  [styles.fieldInvalidControl]: isFormFieldValid(formik, "mediaTypes"),
                                })}
                              >
                                <SolidAutocomplete
                                  multiple
                                  dropdown
                                  field="label"
                                  value={mediaTypeSelectedItems}
                                  suggestions={filteredMediaTypes}
                                  completeMethod={handleMediaTypesSearch}
                                  maxVisibleChips={3}
                                  onChange={({ value }) => {
                                    const selection = Array.isArray(value) ? value : [];
                                    const normalizedValues = selection
                                      .map((item) => {
                                        if (item && typeof item === "object") {
                                          if (item.value) return item.value;
                                          if (item.label) return item.label;
                                        }
                                        return item ?? null;
                                      })
                                      .filter(Boolean);
                                    formik.setFieldValue("mediaTypes", normalizedValues);
                                  }}
                                  placeholder="Select media types"
                                  className="w-full"
                                />
                              </div>
                              {isFormFieldValid(formik, "mediaTypes") && (
                                <p className={styles.fieldError}>{formik?.errors?.mediaTypes?.toString()}</p>
                              )}
                            </div>
                          )}
                          {currentFields.includes("mediaMaxSizeKb") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2 md:mt-0">
                              <label
                                htmlFor="mediaMaxSizeKb"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Media Max Size (Mb)
                              </label>
                              <div className={styles.fieldNumberWrapper}>
                                <SolidNumberInput
                                  id="mediaMaxSizeKb"
                                  name="mediaMaxSizeKb"
                                  value={formik.values.mediaMaxSizeKb}
                                  onChange={(event) => formik.setFieldValue("mediaMaxSizeKb", event.value)}
                                  className={classNames({
                                    "p-invalid": isFormFieldValid(
                                      formik,
                                      "mediaMaxSizeKb"
                                    ),
                                  })}
                                />
                              </div>

                              {isFormFieldValid(formik, "mediaMaxSizeKb") && (
                                <p className={styles.fieldError}>{formik?.errors?.mediaMaxSizeKb?.toString()}</p>
                              )}
                            </div>
                          )}
                          {currentFields.includes("mediaStorageProviderId") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="mediaStorageProviderId"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Media  Storage Provider
                              </label>

                              <div className={classNames("solid-standard-autocomplete", {
                                [styles.fieldInvalidControl]: isFormFieldValid(formik, "mediaStorageProvider"),
                              })}>
                                <SolidAutocomplete
                                  value={mediaStorageProviderField.selectedItem}
                                  suggestions={mediaStorageProviderField.filteredItems}
                                  completeMethod={mediaStorageProviderField.searchItems}
                                  onChange={mediaStorageProviderField.handleChange}
                                  dropdown
                                  field="name"
                                  className="w-full"
                                />
                              </div>

                              {isFormFieldValid(
                                formik,
                                "mediaStorageProvider"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.mediaStorageProviderId?.toString()}</p>
                                )}
                            </div>
                          )}

                          {currentFields.includes("mediaEmbedded") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="mediaEmbedded"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Media Embedded
                              </label>
                              {/* <SolidInput
                                type="text"
                                id="mediaEmbedded"
                                name="mediaEmbedded"
                                onChange={formik.handleChange}
                                value={formik.values.mediaEmbedded}
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "mediaEmbedded"
                                  ),
                                })}
                              /> */}
                              <SolidSegmentedControl
                                value={resolveBooleanOptionValue(formik.values.mediaEmbedded)}
                                onChange={(value) => {
                                  formik.setFieldValue("mediaEmbedded", value);
                                }}
                                options={booleanSegmentedOptions}
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "mediaEmbedded"
                                  ),
                                })}
                              />
                              {isFormFieldValid(formik, "mediaEmbedded") && (
                                <p className={styles.fieldError}>{formik?.errors?.mediaEmbedded?.toString()}</p>
                              )}
                            </div>
                          )}
                          {currentFields.includes("relationType") && (
                            <div className="field col-12 flex gap-2 mt-1 align-items-center">
                              {/* <label
                                  htmlFor="relationType"
                                  className="form-field-label"
                                >
                                  Relation Type
                                </label>
                                <Dropdown
                                  id="relationType"
                                  name="relationType"
                                  value={formik.values.relationType}
                                  options={fieldDefaultMetaData.data.relationTypes}
                                  onChange={(e) =>
                                    formik.setFieldValue("relationType", e.value)
                                  }
                                  placeholder="Select a Data Source"
                                  className={classNames("", {
                                    "p-invalid": isFormFieldValid(
                                      formik,
                                      "relationType"
                                    ),
                                  })}
                                /> */}

                              <label
                                style={{ marginBottom: "0px" }}
                                htmlFor="relationType"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Relation Type
                              </label>
                              <SolidSegmentedControl
                                value={formik.values.relationType}
                                options={fieldDefaultMetaData.data.relationTypes}
                                onChange={(value) => {
                                  formik.setFieldValue("relationType", value);
                                  if (value === "one-to-many") {
                                    formik.setFieldValue("relationCreateInverse", true);
                                  }
                                }}
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(formik, "relationType"),
                                })}
                              />
                              {/* <div className="align-items-center">
                                  <div className="flex mt-1">
                                    {fieldDefaultMetaData?.data?.relationTypes.map((i: any) => (
                                      <div key={i.value} className="mr-3">
                                        <SolidRadioGroup
                                          inputId="ingredient1"
                                          name="pizza"
                                          value={i.value}
                                          onChange={(e) => formik.setFieldValue("relationType", e.value)}
                                          checked={formik.values.relationType === i.value}
                                        />
                                        <label htmlFor="ingredient1" className="form-field-label ml-2">{i.value}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div> */}

                              {isFormFieldValid(formik, "relationType") && (
                                <p className={styles.fieldError}>{formik?.errors?.relationType?.toString()}</p>
                              )}
                            </div>
                          )}
                          {currentFields.includes("relationType") && (formik.values.relationType === "many-to-one" || formik.values.relationType === "one-to-many") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="relationCascade"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Relation Cascade
                              </label>
                              <SolidSelect
                                value={formik.values.relationCascade}
                                options={fieldDefaultMetaData.data.cascadeTypes}
                                optionLabel="label"
                                optionValue="value"
                                onChange={({ value }) =>
                                  formik.setFieldValue(
                                    "relationCascade",
                                    value
                                  )
                                }
                                placeholder="Cascade"
                                className={classNames("w-full", {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "relationCascade"
                                  ),
                                })}
                              />
                              {isFormFieldValid(formik, "relationCascade") && (
                                <p className={styles.fieldError}>{formik?.errors?.relationCascade?.toString()}</p>
                              )}
                            </div>
                          )}

                          {currentFields.includes("relationModelModuleName") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2  mt-1">
                              <label
                                htmlFor="relationModelModuleName"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Co-Module Name
                              </label>

                              <div className={classNames("solid-standard-autocomplete", {
                                [styles.fieldInvalidControl]: isFormFieldValid(
                                  formik,
                                  "relationModelModuleName"
                                ),
                              })}>
                                <SolidAutocomplete
                                  value={relationModelModuleField.selectedItem}
                                  suggestions={relationModelModuleField.filteredItems}
                                  completeMethod={relationModelModuleField.searchItems}
                                  onChange={relationModelModuleField.handleChange}
                                  dropdown
                                  field="name"
                                  className="w-full"
                                />
                              </div>

                              {/* <SolidAutocomplete
                                  value={selectedRelationModelModuleName}
                                  suggestions={filteredRelationModelModuleNames}
                                  invalid={isFormFieldValid(
                                    formik,
                                    "relationModelModuleName"
                                  )}
                                  completeMethod={searchRelationModelModuleNames}
                                  virtualScrollerOptions={{ itemSize: 38 }}
                                  field="label"
                                  className="small-input"
                                  dropdown
                                  onChange={(e) => {
                                    setSelectedRelationModelModuleName(e.value);
                                    formik.setFieldValue(
                                      "relationModelModuleName",
                                      e.value
                                    );
                                  }}
                                /> */}

                              {isFormFieldValid(
                                formik,
                                "relationModelModuleName"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.relationModelModuleName?.toString()}</p>
                                )}
                            </div>
                          )}

                          {currentFields.includes(
                            "relationCoModelSingularName"
                          ) && (
                              <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                                <label
                                  htmlFor="relationCoModelSingularName"
                                  className={classNames("form-field-label", styles.fieldLabel)}
                                >
                                  Co-Model Name
                                </label>

                                <div className={classNames("solid-standard-autocomplete", {
                                  [styles.fieldInvalidControl]: isFormFieldValid(
                                    formik,
                                    "relationCoModelSingularName"
                                  ),
                                })}>
                                  <SolidAutocomplete
                                    value={relationCoModelField.selectedItem}
                                    suggestions={relationCoModelField.filteredItems}
                                    completeMethod={relationCoModelField.searchItems}
                                    onChange={relationCoModelField.handleChange}
                                    dropdown
                                    field="displayName"
                                    className="w-full"
                                  />
                                </div>

                                {isFormFieldValid(
                                  formik,
                                  "relationCoModelSingularName"
                                ) && (
                                    <p className={styles.fieldError}>{formik?.errors?.relationCoModelSingularName?.toString()}</p>
                                  )}
                                {formik.values.relationType === "one-to-many" &&
                                  <p className="fieldSubTitle">This is the child model.</p>
                                }
                                {formik.values.relationType === "many-to-one" &&
                                  <p className="fieldSubTitle">This is the parent model.</p>
                                }
                              </div>
                            )}
                          {currentFields.includes("relationCoModelColumnName") && (formik.values.relationType === "many-to-many" || formik.values.relationType === "many-to-one") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="relationCoModelColumnName"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Relation Co-Model Column Name
                              </label>
                              <SolidInput
                                type="text"
                                id="relationCoModelColumnName"
                                name="relationCoModelColumnName"
                                onChange={formik.handleChange}
                                disabled={fieldMetaData?.id}
                                value={formik.values.relationCoModelColumnName}
                                className={classNames(styles.fieldInput, {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "relationCoModelColumnName"
                                  ),
                                })}
                              />
                              {isFormFieldValid(formik, "relationCoModelColumnName") && (
                                <p className={styles.fieldError}>{formik?.errors?.relationCoModelColumnName?.toString()}</p>
                              )}
                              <p className="fieldSubTitle">Allows you to control the column name of the foreign key. Eg. when adding a country field to state model, by default foreign key column in the state table will be called country_id, use this field to create a foreign key with a different name. </p>

                            </div>
                          )}
                          {askForUserKeyField && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="userKey"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Set User Key
                              </label>

                              <div className={classNames("solid-standard-autocomplete", {
                                [styles.fieldInvalidControl]: isFormFieldValid(
                                  formik,
                                  "userKey"
                                ),
                              })}>
                                <SolidAutocomplete
                                  value={userKeyField.selectedItem}
                                  suggestions={userKeyField.filteredItems}
                                  completeMethod={userKeyField.searchItems}
                                  onChange={userKeyField.handleChange}
                                  dropdown
                                  field="displayName"
                                  className="w-full"
                                />
                              </div>
                              <p className="fieldSubTitle">The co-model you have selected does not have a user key specified. Use the above dropdown to choose from one of the "unique" fields in this co-model to be set as its userkey. User keys are required in co-models being used in many-to-one or one-to-many relations as in SolidX when a many-to-one field is rendered it uses an autocomplete dropdown, and the user key value is what is displayed as the label in the dropdown.</p>
                              {isFormFieldValid(
                                formik,
                                "userKey"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.userKey?.toString()}</p>
                                )}
                            </div>
                          )}

                          {currentFields.includes(
                            "relationFieldFixedFilter"
                          ) && (
                              <div className="field col-12 flex-flex-column gap-2 mt-2">
                                <label
                                  htmlFor="relationFieldFixedFilter"
                                  className={classNames("form-field-label", styles.fieldLabel)}
                                >
                                  Relation Field Fixed Filter
                                </label>

                                <SolidTextarea
                                  aria-describedby="Fixed Filter"
                                  id="relationFieldFixedFilter"
                                  name="relationFieldFixedFilter"
                                  onChange={formik.handleChange}
                                  value={formik.values.relationFieldFixedFilter}
                                  rows={5}
                                  cols={30}
                                  className={classNames(styles.fieldTextarea, {
                                    "p-invalid": isFormFieldValid(
                                      formik,
                                      "relationFieldFixedFilter"
                                    ),
                                  })}
                                />
                                {/* 
                                <SolidInput
                                  type="text"
                                  id="relationFieldFixedFilter"
                                  name="relationFieldFixedFilter"
                                  onChange={formik.handleChange}
                                  disabled={fieldMetaData?.id}
                                  value={formik.values.relationFieldFixedFilter}
                                  className={classNames("", {
                                    "p-invalid": isFormFieldValid(
                                      formik,
                                      "relationFieldFixedFilter"
                                    ),
                                  })}
                                /> */}
                                {isFormFieldValid(formik, "relationFieldFixedFilter") && (
                                  <p className={styles.fieldError}>{formik?.errors?.relationFieldFixedFilter?.toString()}</p>
                                )}
                                <p className="fieldSubTitle">Many to one fields are rendered as autocomplete dropdown on the SolidX ui. Use the fixed filter to load a pre-filtered set of records from the co-model. Please note user input entered in the autocomplete is used to apply a dynamic filter.</p>

                              </div>
                            )}

                          {currentFields.includes("relationCreateInverse") && (
                            <div className="field col-12 md:col-6 flex flex-column gap-2 mt-2">
                              <label htmlFor="relationCreateInverse" className={classNames("form-field-label", styles.fieldLabel)}>
                                Relation Create Inverse
                              </label>
                              <div className="flex align-items-center">
                                <SolidCheckbox
                                  id="relationCreateInverse"
                                  name="relationCreateInverse"
                                  checked={formik.values.relationCreateInverse}
                                  disabled={formik.values.relationType === "one-to-many"}
                                  onChange={(event) => formik.setFieldValue("relationCreateInverse", event.currentTarget.checked)}
                                />
                                <label htmlFor="relationCreateInverse" className={classNames("ml-2", "form-field-label", styles.fieldLabel)}>Create Inverse</label>
                              </div>
                              {isFormFieldValid(formik, "relationCreateInverse") && (
                                <p className={styles.fieldError}>{formik?.errors?.relationCreateInverse?.toString()}</p>
                              )}
                            </div>
                          )}

                          {currentFields.includes("relationCoModelFieldName") && formik.values.relationCreateInverse && !formik.values.relationCoModelSingularName && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <SolidMessage text="Please select Co-model" />
                            </div>
                          )}
                          {currentFields.includes("relationCoModelFieldName") && formik.values.relationCreateInverse && formik.values.relationCoModelSingularName && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="relationCoModelFieldName"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Field Name In {formik.values.relationCoModelSingularName} Model
                              </label>
                              <SolidInput
                                type="text"
                                id="relationCoModelFieldName"
                                name="relationCoModelFieldName"
                                onChange={formik.handleChange}
                                disabled={fieldMetaData?.id}
                                value={formik.values.relationCoModelFieldName}
                                className={classNames(styles.fieldInput, {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "relationCoModelFieldName"
                                  ),
                                })}
                              />
                              {formik.values.relationType === "one-to-many" &&
                                <p className="fieldSubTitle">This is a field that is created in the child model. In this case a <span style={{ fontWeight: "700" }}>{formik.values.relationCoModelFieldName ?? formik.values.relationCoModelSingularName}</span> field will be created in the {formik.values.relationCoModelSingularName} when setting create inverse true.</p>
                              }
                              {formik.values.relationType === "many-to-one" &&
                                <p className="fieldSubTitle">This is a field that is created in the parent model. In this case a <span style={{ fontWeight: "700" }}>{formik.values.relationCoModelFieldName ?? `${formik.values.relationCoModelSingularName}s`}</span> field will be created in the {formik.values.relationCoModelSingularName} when setting create inverse true.</p>
                              }
                              {formik.values.relationType === "many-to-many" &&
                                <p className="fieldSubTitle">In this case a {formik.values.relationCoModelFieldName} field will be created in the <span style={{ fontWeight: "700" }}>{formik.values.relationCoModelSingularName ?? '{{}}'}</span> when setting create inverse true.</p>
                              }
                              {isFormFieldValid(formik, "relationCoModelFieldName") && (
                                <p className={styles.fieldError}>{formik?.errors?.relationCoModelFieldName?.toString()}</p>
                              )}
                            </div>
                          )}

                          {/* {currentFields.includes("joinColumnName") && formik.values.relationType === "many-to-many" && (
                            <div className="field col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="joinColumnName"
                                className="form-field-label"
                              >
                                Join Column Name
                              </label>
                              <SolidInput
                                type="text"
                                id="joinColumnName"
                                name="joinColumnName"
                                onChange={formik.handleChange}
                                value={formik.values.joinColumnName}
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "joinColumnName"
                                  ),
                                })}
                              />
                              {isFormFieldValid(formik, "joinColumnName") && (
                                <SolidMessage
                                  severity="error"
                                  text={formik?.errors?.joinColumnName?.toString()}
                                />
                              )}

                            </div>
                          )} */}



                          {currentFields.includes("relationJoinTableName") && formik.values.relationType === "many-to-many" && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="relationJoinTableName"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Relation Join Table Name
                              </label>
                              <SolidInput
                                type="text"
                                id="relationJoinTableName"
                                name="relationJoinTableName"
                                onChange={formik.handleChange}
                                disabled={fieldMetaData?.id}
                                value={formik.values.relationJoinTableName}
                                className={classNames(styles.fieldInput, {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "relationJoinTableName"
                                  ),
                                })}
                              />
                              {isFormFieldValid(formik, "relationJoinTableName") && (
                                <p className={styles.fieldError}>{formik?.errors?.relationJoinTableName?.toString()}</p>
                              )}

                            </div>
                          )}

                          {currentFields.includes("selectionDynamicProvider") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="selectionDynamicProvider"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Selection Dynamic Provider
                              </label>

                              <div className={classNames("solid-standard-autocomplete", {
                                [styles.fieldInvalidControl]: isFormFieldValid(
                                  formik,
                                  "selectionDynamicProvider"
                                ),
                              })}>
                                <SolidAutocomplete
                                  value={selectionDynamicProviderField.selectedItem}
                                  suggestions={selectionDynamicProviderField.filteredItems}
                                  completeMethod={selectionDynamicProviderField.searchItems}
                                  onChange={selectionDynamicProviderField.handleChange}
                                  dropdown
                                  field="label"
                                  className="w-full"
                                />
                              </div>


                              {/* <SolidAutocomplete
                                  value={selectionDynamicProvider}
                                  suggestions={filteredSelectionDynamicProvider}
                                  invalid={isFormFieldValid(
                                    formik,
                                    "selectionDynamicProvider"
                                  )}
                                  completeMethod={searchSelectionDynamicProvider}
                                  virtualScrollerOptions={{ itemSize: 38 }}
                                  field="label"
                                  className="small-input"
                                  dropdown
                                  onChange={(e) => {
                                    setSelectionDynamicProvider(e.value);
                                    formik.setFieldValue(
                                      "selectionDynamicProvider",
                                      e.value.value
                                    );
                                  }}
                                /> */}

                              {isFormFieldValid(
                                formik,
                                "selectionDynamicProvider"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.selectionDynamicProvider?.toString()}</p>
                                )}
                            </div>
                          )}
                          {currentFields.includes("selectionValueType") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="selectionValueType"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Select Value Type
                              </label>
                              <SolidSelect
                                value={formik.values.selectionValueType}
                                options={selctionValueTypes}
                                optionLabel="label"
                                optionValue="value"
                                onChange={({ value }) =>
                                  formik.setFieldValue(
                                    "selectionValueType",
                                    value
                                  )
                                }
                                placeholder="Select Value Type"
                                className={classNames("w-full", {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "selectionValueType"
                                  ),
                                })}
                              />
                              {isFormFieldValid(
                                formik,
                                "selectionValueType"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.selectionValueType?.toString()}</p>
                                )}
                            </div>
                          )}

                          {currentFields.includes("selectionStaticValues") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="selectionStaticValues"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Selection Static Values
                              </label>
                              {/* <SolidTextarea
                                  value={selectionStaticValues}
                                  placeholder="male:Male"
                                  onChange={(e) => {
                                    const data = e.target.value
                                      .split("\n")
                                      .filter((line) => line.trim() !== "");

                                    setSelectionStaticValues(e.target.value);
                                    formik.setFieldValue(
                                      "selectionStaticValues",
                                      data
                                    );
                                  }}
                                  rows={5}
                                  cols={30}
                                /> */}
                              {formik.values.selectionStaticValues.map((enumValue: string, index: number) => (
                                <SelectionStaticValues
                                  key={index}
                                  enumValue={enumValue}
                                  onUpdate={(updatedString: any) => updateEnumValues(index, updatedString)}
                                  onDelete={() => deleteEnumValue(index)}
                                  onAdd={addEnumValue}
                                />
                              ))
                              }
                              {isFormFieldValid(
                                formik,
                                "selectionStaticValues"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.selectionStaticValues?.toString()}</p>
                                )}
                            </div>
                          )}

                          {currentFields.includes("computedFieldValueType") && (
                            <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                              <label
                                htmlFor="computedFieldValueType"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Computed Field Value Type
                              </label>
                              <SolidAutocomplete
                                value={selectedComputedFieldValueType}
                                suggestions={filteredComputedFieldValueTypes}
                                completeMethod={searchComputedFieldValueType}
                                field="label"
                                dropdown
                                className={classNames("solid-standard-autocomplete", {
                                  [styles.fieldInvalidControl]: isFormFieldValid(formik, "computedFieldValueType"),
                                })}
                                onChange={(e) => {
                                  setSelectedComputedFieldValueType(e.value);
                                  formik.setFieldValue("computedFieldValueType", e.value.value);
                                }}
                              />

                              {/* <Dropdown
                                id="mediaTypes"
                                name="mediaTypes"
                                value={formik.values.mediaTypes}
                                options={fieldDefaultMetaData.data.mediaTypes}
                                onChange={(e) =>
                                  formik.setFieldValue("mediaTypes", e.value)
                                }
                                placeholder="Select a Data Source"
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(
                                    formik,
                                    "mediaTypes"
                                  ),
                                })}
                              /> */}
                              {isFormFieldValid(formik, "computedFieldValueType") && (
                                <p className={styles.fieldError}>{formik?.errors?.computedFieldValueType?.toString()}</p>
                              )}
                            </div>
                          )}

                          {currentFields.includes(
                            "computedFieldValueProvider"
                          ) && (
                              <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                                <label
                                  htmlFor="computedFieldValueProvider"
                                  className={classNames("form-field-label", styles.fieldLabel)}
                                >
                                  Computed Field Provider
                                </label>
                                <div className={classNames("solid-standard-autocomplete", {
                                  [styles.fieldInvalidControl]: isFormFieldValid(
                                    formik,
                                    "computedFieldValueProvider"
                                  ),
                                })}>
                                  <SolidAutocomplete
                                    value={computedFieldValueProviderField.selectedItem}
                                    suggestions={computedFieldValueProviderField.filteredItems}
                                    completeMethod={computedFieldValueProviderField.searchItems}
                                    onChange={computedFieldValueProviderField.handleChange}
                                    dropdown
                                    field="label"
                                    className="w-full"
                                  />
                                </div>
                                {isFormFieldValid(
                                  formik,
                                  "computedFieldValueProvider"
                                ) && (
                                    <p className={styles.fieldError}>{formik?.errors?.computedFieldValueProvider?.toString()}</p>
                                  )}
                              </div>
                            )}
                          {currentFields.includes(
                            "computedFieldTriggerConfig"
                          ) && (
                              <div className="field col-12 flex-flex-column gap-2 mt-2">
                                {fieldMetaData?.computedFieldTriggerConfig === null
                                  &&
                                  <div className="mb-3">
                                    <SolidMessage severity="error" text={`You seem to be using an old configuration of ComputedFieldProvider. Please change your current computed field provider i.e ${fieldMetaData?.computedFieldValueProvider} to implement IEntityComputedFieldProvider before continuing.`} />
                                  </div>
                                }
                                <div className="flex align-items-center gap-2">
                                  <label
                                    htmlFor="computedFieldTriggerConfig"
                                    className={classNames("form-field-label", styles.fieldLabel)}
                                  >
                                    Computed Field Trigger Config
                                  </label>
                                  <div>
                                    <SolidButton
                                      icon="pi pi-plus"
                                      size="small"
                                      onClick={handleAdd}
                                      type="button"
                                      className="ml-2"
                                    />
                                  </div>
                                </div>
                                {
                                  formik.values.computedFieldTriggerConfig.map((row: any, index: number) => (
                                    <SelectComputedFieldTriggerValues
                                      key={index}
                                      index={index}
                                      row={row}
                                      onChange={handleChange}
                                      onDelete={handleDelete}
                                      isLastRow={index === formik.values.computedFieldTriggerConfig.length - 1}
                                      disableDelete={formik.values.computedFieldTriggerConfig.length === 1}
                                      formik={formik}
                                      isFormFieldValid={isFormFieldValid}
                                      searchModuleName={searchModuleName}
                                      searchModelName={computedFieldSearchHandlers[index]}
                                      modelMetaData={modelMetaData}
                                      errors={formik.errors.computedFieldTriggerConfig?.[index]}
                                    />
                                  ))}
                                {typeof formik.errors.computedFieldTriggerConfig === 'string' && (
                                  <p className={styles.fieldError}>{formik.errors.computedFieldTriggerConfig}</p>
                                )}
                              </div>
                            )}
                          {/* {currentFields.includes("externalIdProvider") && (
                            <div className="md:col-6 sm:col-12">
                              <div className="field col-6 flex-flex-column gap-2">
                                <label
                                  htmlFor="externalIdProvider"
                                  className="form-field-label"
                                >
                                  External Id Provider
                                </label>
                                <SolidAutocomplete
                                  key="externalIdProvider"
                                  value={formik.values.externalIdProvider}
                                  suggestions={[]}
                                />
                               

                                    {isFormFieldValid(
                                      formik,
                                      "externalIdProvider"
                                    ) && (
                                        <SolidMessage
                                          severity="error"
                                          text={formik?.errors?.externalIdProvider?.toString()}
                                        />
                                      )}
                              </div>
                            </div>
                          )} */}

                          {currentFields.includes("selectionDynamicProviderCtxt") && (
                            <div className="field col-12 flex-flex-column gap-2 mt-4">
                              <label htmlFor="selectionDynamicProviderCtxt" className={classNames("form-field-label", styles.fieldLabel)}>
                                Selection Dynamic Provider Context
                              </label>
                              <SolidCodeEditor
                                value={formik.values.selectionDynamicProviderCtxt ?? ""}
                                onChange={(value) => {
                                  formik.setFieldValue("selectionDynamicProviderCtxt", value ?? "");
                                }}
                                language="json"
                                height="300px"
                              />
                              <div className=" form-field-label  mt-2">{markdownText}</div>

                              {isFormFieldValid(
                                formik,
                                "selectionDynamicProviderCtxt"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.selectionDynamicProviderCtxt?.toString()}</p>
                                )}
                            </div>
                          )}

                          {currentFields.includes("computedFieldValueProviderCtxt") && (
                            <div className="field col-12 flex-flex-column gap-2 mt-4">
                              <label htmlFor="computedFieldValueProviderCtxt" className={classNames("form-field-label", styles.fieldLabel)}>
                                Computed Field Value Provider Context
                              </label>
                              <SolidCodeEditor
                                value={formik.values.computedFieldValueProviderCtxt ?? ""}
                                onChange={(value) => {
                                  formik.setFieldValue("computedFieldValueProviderCtxt", value ?? "");
                                }}
                                language="json"
                                height="300px"
                              />
                              <div className="form-field-label mt-4">{markdownText}</div>

                              {isFormFieldValid(
                                formik,
                                "computedFieldValueProviderCtxt"
                              ) && (
                                  <p className={styles.fieldError}>{formik?.errors?.computedFieldValueProviderCtxt?.toString()}</p>
                                )}
                            </div>
                          )}

                          {/* {currentFields.includes("externalIdProviderCtxt") && (
                            <div className="md:col-12 sm:col-12">

                              <div className="formgrid grid">
                                {markdownText &&
                                  <div className="md:col-12 sm:col-12">
                                    <div className="field col-6 flex-flex-column gap-2">
                                      <label htmlFor="name" className="form-field-label">
                                        Markdown
                                      </label>
                                      <MarkdownViewer data={markdownText}></MarkdownViewer>
                                    </div>
                                  </div>
                                }
                                <div className="md:col-12 sm:col-12">
                                  <div className="field col-6 flex-flex-column gap-2">
                                    <label htmlFor="name" className="form-field-label">
                                      External Id Provider Context
                                    </label>
                                    <SolidCodeEditor
                                      value={formik.values.externalIdProviderCtxt ?? ""}
                                      onChange={(value) => {
                                        formik.setFieldValue("externalIdProviderCtxt", value ?? "");
                                      }}
                                      language="json"
                                      height="300px"
                                    />
                                    {isFormFieldValid(
                                      formik,
                                      "externalIdProviderCtxt"
                                    ) && (
                                        <SolidMessage
                                          severity="error"
                                          text={formik?.errors?.externalIdProviderCtxt?.toString()}
                                        />
                                      )}
                                  </div>
                                </div>

                              </div>
                            </div>
                          )} */}

                        </div>
                      )}
                      {showValidationSection && (
                        <>
                          <p className="form-wrapper-heading">Validations</p>
                          <div className="formgrid grid">
                            {(showRegexFields && selectedTypeValue === "password") &&
                              <>
                                <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                                  <label
                                    htmlFor="regexPattern"
                                    className={classNames("form-field-label", styles.fieldLabel)}
                                  >
                                    Password Policy
                                  </label>
                                  <SolidSelect
                                    value={selectedPasswordPolicy}
                                    options={passwordPolicyOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    onChange={({ value }) => {
                                      setSelectedPasswordPolicy(value);
                                      if (value !== "custom") {
                                        formik.setFieldValue("regexPattern", value);
                                      }
                                    }}
                                    placeholder="Select a Password Policy"
                                    className="w-full"
                                  />

                                </div>
                              </>
                            }
                            {showRegexFields && (
                              <>
                                <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                                  <label
                                    htmlFor="regexPattern"
                                    className={classNames("form-field-label", styles.fieldLabel)}
                                  >
                                    Regex Pattern
                                  </label>
                                  <SolidInput
                                    type="text"
                                    id="regexPattern"
                                    name="regexPattern"
                                    onChange={formik.handleChange}
                                    value={formik.values.regexPattern}
                                    className={classNames(styles.fieldInput, {
                                      "p-invalid": isFormFieldValid(
                                        formik,
                                        "regexPattern"
                                      ),
                                    })}
                                  />
                                  {isFormFieldValid(formik, "regexPattern") && (
                                    <p className={styles.fieldError}>{formik?.errors?.regexPattern?.toString()}</p>
                                  )}
                                </div>
                                {showRegexFields && (
                                  <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2 mb-3 md:mb-3">
                                    <label
                                      htmlFor="regexPatternNotMatchingErrorMsg"
                                      className={classNames("form-field-label", styles.fieldLabel)}
                                    >
                                      Regex Pattern Not Matching Error Msg
                                    </label>
                                    <SolidInput
                                      type="text"
                                      id="regexPatternNotMatchingErrorMsg"
                                      name="regexPatternNotMatchingErrorMsg"
                                      onChange={formik.handleChange}
                                      value={formik.values.regexPatternNotMatchingErrorMsg}
                                      className={classNames(styles.fieldInput, {
                                        "p-invalid": isFormFieldValid(
                                          formik,
                                          "regexPatternNotMatchingErrorMsg"
                                        ),
                                      })}
                                    />
                                    {isFormFieldValid(formik, "regexPatternNotMatchingErrorMsg") && (
                                      <p className={styles.fieldError}>{formik?.errors?.regexPatternNotMatchingErrorMsg?.toString()}</p>
                                    )}
                                  </div>
                                )}
                              </>

                            )}
                            {(showMinFields || showMaxFields) &&
                              <>
                                {showMinFields && (
                                  <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                                    <label htmlFor="min" className={classNames("form-field-label", styles.fieldLabel)}>
                                      Min {(selectedTypeValue !== "int" && selectedTypeValue !== "decimal") && `(Characters Allowed)`}

                                    </label>
                                    {/* <SolidInput
                                type="text"
                                id="min"
                                name="min"
                                onChange={formik.handleChange}
                                value={formik.values.min}
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(formik, "min"),
                                })}
                              /> */}
                                    {/* <RenderMinValueInput></RenderMinValueInput> */}

                                    <div className={styles.fieldNumberWrapper}>
                                      <SolidNumberInput
                                        id="min"
                                        name="min"
                                        step="0.00001"
                                        value={formik.values.min}
                                        onChange={(event) => formik.setFieldValue("min", event.value)}
                                        className={classNames({
                                          "p-invalid": isFormFieldValid(
                                            formik,
                                            "min"
                                          ),
                                        })}
                                        disabled={fieldMetaData?.id}
                                      />
                                    </div>
                                    {isFormFieldValid(formik, "min") && (
                                      <p className={styles.fieldError}>{formik?.errors?.min?.toString()}</p>
                                    )}
                                  </div>
                                )}
                                {showMaxFields && (
                                  <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                                    <label htmlFor="max" className={classNames("form-field-label", styles.fieldLabel)}>
                                      Max {(selectedTypeValue !== "int" &&
                                        selectedTypeValue !== "decimal") && `(Characters allowed)`}
                                    </label>
                                    {/* <SolidInput
                                type="text"
                                id="max"
                                name="max"
                                onChange={formik.handleChange}
                                value={formik.values.max}
                                className={classNames("", {
                                  "p-invalid": isFormFieldValid(formik, "max"),
                                })}
                              /> */}

                                    <div className={styles.fieldNumberWrapper}>
                                      <SolidNumberInput
                                        id="max"
                                        name="max"
                                        step="0.00001"
                                        value={formik.values.max}
                                        onChange={(event) => formik.setFieldValue("max", event.value)}
                                        className={classNames({
                                          "p-invalid": isFormFieldValid(
                                            formik,
                                            "max"
                                          ),
                                        })}
                                        disabled={fieldMetaData?.id}
                                      />
                                    </div>


                                    {isFormFieldValid(formik, "max") && (
                                      <p className={styles.fieldError}>{formik?.errors?.max?.toString()}</p>
                                    )}
                                  </div>
                                )}
                              </>
                            }
                            {showOrmOptions && (
                              <div className="field col-12 md:col-6 flex-flex-column gap-2 mt-2">
                                <label htmlFor="ormType" className={classNames("form-field-label", styles.fieldLabel)}>
                                  Type
                                </label>

                                <SolidRadioGroup
                                  name="ormType"
                                  value={selectedOrmType}
                                  onChange={(value) => {
                                    formik.setFieldValue("ormType", value);
                                    setSelectedOrmType(value);
                                  }}
                                  options={(ormTypeOptions || []).map((ormType: any) => ({
                                    value: ormType.label,
                                    label: (
                                      <span className={classNames("ml-2", "form-field-label")}>
                                        {ormType.label}
                                        <br />
                                        <span className="fieldSubTitle mt-0">{`(${ormType.description})`}</span>
                                      </span>
                                    ),
                                  }))}
                                  className="ormTypeflex"
                                  itemClassName="mr-3 align-items-center"
                                />

                                {isFormFieldValid(formik, "ormType") && (
                                  <p className={styles.fieldError}>{formik?.errors?.ormType?.toString()}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {(formik.values.relationType !== "many-to-many" && formik.values.relationType !== "one-to-many") && <p className="form-wrapper-heading">Settings</p>}
                      <div className="formgrid grid mt-1 md:mt-0">
                        {currentFields.includes("required") && (formik.values.relationType !== "many-to-many" && formik.values.relationType !== "one-to-many") && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center">
                              <SolidCheckbox
                                id="required"
                                name="required"
                                onChange={(event) => {
                                  if (!formik.values.isPrimaryKey && !formik.values.unique) {
                                    formik.setFieldValue("required", event.currentTarget.checked);
                                  }
                                }}
                                checked={formik.values.required}
                                disabled={formik.values.isPrimaryKey || formik.values.unique}
                              />
                              <label htmlFor="required" className={classNames("form-field-label", styles.fieldLabel, "ml-2")}>
                                Required {formik.values.isPrimaryKey && "(Auto-enabled for Primary Key)"}
                                {!formik.values.isPrimaryKey && formik.values.unique && "(Auto-enabled for Unique)"}
                              </label>
                            </div>
                            <p className="text-xs mt-2">You won't be able to create an entry if this field is empty</p>

                            {isFormFieldValid(formik, "required") && (
                              <p className={styles.fieldError}>{formik?.errors?.required?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("unique") && selectedTypeValue !== 'relation' && (
                          <div className="field col-6 flex-flex-column gap-2">
                            <div className="flex align-items-center">
                              <SolidCheckbox
                                id="unique"
                                name="unique"
                                onChange={(event) => {
                                  // Prevent unchecking if isPrimaryKey is true
                                  if (!formik.values.isPrimaryKey) {
                                    const nextValue = event.currentTarget.checked;
                                    formik.setFieldValue("unique", nextValue);
                                    formik.setFieldValue("isUserKey", false);
                                    // Auto-enable required when unique is checked
                                    if (nextValue) {
                                      formik.setFieldValue("required", true);
                                    } else {
                                      formik.setFieldValue("required", false);
                                    }
                                  }
                                }}
                                checked={formik.values.unique}
                                disabled={formik.values.isPrimaryKey}
                              />
                              <label htmlFor="unique" className={classNames("form-field-label", styles.fieldLabel, "ml-2")}>
                                Unique {formik.values.isPrimaryKey && "(Auto-enabled for Primary Key)"}
                              </label>
                            </div>
                            <p className="text-xs mt-2">You won't be able to create an entry if there is an existing entry with identical content</p>

                            {isFormFieldValid(formik, "unique") && (
                              <p className={styles.fieldError}>{formik?.errors?.unique?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("index") && selectedTypeValue !== 'relation' && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center">
                              <SolidCheckbox
                                id="index"
                                name="index"
                                onChange={(event) => {
                                  formik.setFieldValue("index", event.currentTarget.checked);
                                }}
                                checked={formik.values.index}
                              />
                              <label htmlFor="index" className={classNames("form-field-label", styles.fieldLabel, "ml-2")}>
                                Index
                              </label>
                            </div>
                            {isFormFieldValid(formik, "index") && (
                              <p className={styles.fieldError}>{formik?.errors?.index?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("private") && selectedTypeValue !== 'relation' && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center">
                              <SolidCheckbox
                                id="private"
                                name="private"
                                onChange={(event) => {
                                  formik.setFieldValue("private", event.currentTarget.checked);
                                }}
                                checked={formik.values.private}
                              />
                              <label htmlFor="private" className={classNames("form-field-label", styles.fieldLabel, "ml-2")}>
                                Private
                              </label>
                            </div>
                            <p className="text-xs mt-2">This field will not show up in the API response</p>


                            {isFormFieldValid(formik, "private") && (
                              <p className={styles.fieldError}>{formik?.errors?.private?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("encrypt") && selectedTypeValue !== 'relation' && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center gap-2">
                              <SolidCheckbox
                                id="encrypt"
                                name="encrypt"
                                onChange={(event) => {
                                  formik.setFieldValue("encrypt", event.currentTarget.checked);
                                  setEncryptState(event.currentTarget.checked);
                                }}
                                checked={formik.values.encrypt}
                              />
                              <label htmlFor="encrypt" className={classNames("form-field-label", styles.fieldLabel)}>
                                Encrypt
                              </label>
                            </div>
                            {isFormFieldValid(formik, "encrypt") && (
                              <p className={styles.fieldError}>{formik?.errors?.encrypt?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("isMultiSelect") && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center">
                              <SolidCheckbox
                                id="isMultiSelect"
                                name="isMultiSelect"
                                onChange={(event) => {
                                  formik.setFieldValue("isMultiSelect", event.currentTarget.checked);
                                }}
                                checked={formik.values.isMultiSelect}
                              />
                              <label htmlFor="isMultiSelect" className={classNames("form-field-label", styles.fieldLabel, "ml-2")}>
                                Is MultiSelect
                              </label>
                            </div>
                            {isFormFieldValid(formik, "isMultiSelect") && (
                              <p className={styles.fieldError}>{formik?.errors?.isMultiSelect?.toString()}</p>
                            )}
                          </div>
                        )}
                        {/* {currentFields.includes("isSystem") && (
                          <div className="md:col-6 sm:col-12">
                            <div className="field">
                              <div className="flex align-items-center">
                                <SolidCheckbox
                                  name="isSystem"
                                  onChange={(event) => {
                                    formik.setFieldValue("isSystem", event.currentTarget.checked);
                                  }}
                                  checked={formik.values.isSystem}
                                />
                                <label htmlFor="ingredient1" className="form-field-label">
                                  isSystem
                                </label>
                              </div>
                              {isFormFieldValid(formik, "isSystem") && (
                                <SolidMessage
                                  severity="error"
                                  text={formik?.errors?.isSystem?.toString()}
                                />
                              )}
                            </div>
                          </div>
                        )} */}
                        {currentFields.includes("enableAuditTracking") && formik.values.relationType !== "one-to-many" && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center gap-2">
                              <SolidCheckbox
                                id="enableAuditTracking"
                                name="enableAuditTracking"
                                onChange={(event) => {
                                  formik.setFieldValue("enableAuditTracking", event.currentTarget.checked);
                                }}
                                checked={formik.values.enableAuditTracking}
                              />
                              <label htmlFor="enableAuditTracking" className={classNames("form-field-label", styles.fieldLabel)}>
                                Enable Audit Tracking
                              </label>
                            </div>
                            <p className="fieldSubTitle">By selecting this option, you are setting audit trail for this field.</p>

                            {isFormFieldValid(formik, "enableAuditTracking") && (
                              <p className={styles.fieldError}>{formik?.errors?.enableAuditTracking?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("isUserKey") && formik.values.unique && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center gap-2">
                              <SolidCheckbox
                                id="isUserKey"
                                name="isUserKey"
                                onChange={(event) => {
                                  formik.setFieldValue("isUserKey", event.currentTarget.checked);
                                }}
                                checked={formik.values.isUserKey}
                              />
                              <label htmlFor="isUserKey" className={classNames("form-field-label", styles.fieldLabel)}>
                                Is Userkey
                              </label>
                            </div>
                            <p className="fieldSubTitle">By selecting this option, you are setting this field as the model's user key. Any existing user key configuration will be overwritten</p>

                            {isFormFieldValid(formik, "isUserKey") && (
                              <p className={styles.fieldError}>{formik?.errors?.isUserKey?.toString()}</p>
                            )}
                          </div>
                        )}
                        {currentFields.includes("isPrimaryKey") && (modelMetaData?.isLegacyTable || modelMetaData?.isLegacyTableWithId) && (
                          <div className="field col-6 flex-flex-column gap-2 mt-2">
                            <div className="flex align-items-center gap-2">
                              <SolidCheckbox
                                id="isPrimaryKey"
                                name="isPrimaryKey"
                                onChange={(event) => {
                                  const checked = event.currentTarget.checked;
                                  formik.setFieldValue("isPrimaryKey", checked);
                                  // Auto-set required and unique when isPrimaryKey is checked
                                  if (checked) {
                                    formik.setFieldValue("required", true);
                                    formik.setFieldValue("unique", true);
                                  }
                                }}
                                checked={formik.values.isPrimaryKey}
                              />
                              <label htmlFor="isPrimaryKey" className={classNames("form-field-label", styles.fieldLabel)}>
                                Is Primary Key
                              </label>
                            </div>
                            <p className="fieldSubTitle">By selecting this option, you are setting this field as the primary key for this legacy table.</p>

                            {isFormFieldValid(formik, "isPrimaryKey") && (
                              <p className={styles.fieldError}>{formik?.errors?.isPrimaryKey?.toString()}</p>
                            )}
                          </div>
                        )}
                      </div>


                      {formik.values.encrypt === true && (
                        <div className="formgrid grid mt-2">
                          <div className="md:col-6 sm:col-12">
                            <div className="field col-6 flex-flex-column gap-2">
                              <label
                                htmlFor="encryptionType"
                                className={classNames("form-field-label", styles.fieldLabel)}
                              >
                                Encryption Type
                              </label>
                              {/* <SolidAutocomplete
                                value={selectedEncryptionType}
                                suggestions={filteredSelectionEncryptionType}
                                invalid={isFormFieldValid(
                                  formik,
                                  "encryptionType"
                                )}
                                completeMethod={searchSelectionEncryptionType}
                                virtualScrollerOptions={{ itemSize: 38 }}
                                field="label"
                                className="small-input"
                                dropdown
                                onChange={(e) => {
                                  setSelectedEncryptionType(e.value);
                                  formik.setFieldValue("encryptionType", e.value.value);
                                }}
                              /> */}

                              <div className={classNames("solid-standard-autocomplete", {
                                [styles.fieldInvalidControl]: isFormFieldValid(formik, "encryptionType"),
                              })}>
                                <SolidAutocomplete
                                  value={encryptionTypeField.selectedItem}
                                  suggestions={encryptionTypeField.filteredItems}
                                  completeMethod={encryptionTypeField.searchItems}
                                  onChange={encryptionTypeField.handleChange}
                                  dropdown
                                  field="label"
                                  className="w-full"
                                />
                              </div>
                              {isFormFieldValid(formik, "encryptionType") && (
                                <p className={styles.fieldError}>{formik?.errors?.encryptionType?.toString()}</p>
                              )}
                            </div>
                          </div>
                          <div className="md:col-6 sm:col-12">
                            <div className="field col-6 flex-flex-column gap-2">
                              <label htmlFor="decryptWhen" className={classNames("form-field-label", styles.fieldLabel)}>
                                Decrypt When
                              </label>
                              {/* <SolidAutocomplete
                                value={selectedDecryptWhen}
                                suggestions={filteredSelectionDecryptWhen}
                                invalid={isFormFieldValid(formik, "decryptWhen")}
                                completeMethod={searchSelectionDecryptWhen}
                                virtualScrollerOptions={{ itemSize: 38 }}
                                field="label"
                                className="small-input"
                                dropdown
                                onChange={(e) => {
                                  setSelectedeDecryptWhen(e.value);
                                  formik.setFieldValue("decryptWhen", e.value.value);
                                }}
                              /> */}

                              <div className={classNames("solid-standard-autocomplete", {
                                [styles.fieldInvalidControl]: isFormFieldValid(formik, "decryptWhen"),
                              })}>
                                <SolidAutocomplete
                                  value={decryptWhenField.selectedItem}
                                  suggestions={decryptWhenField.filteredItems}
                                  completeMethod={decryptWhenField.searchItems}
                                  onChange={decryptWhenField.handleChange}
                                  dropdown
                                  field="label"
                                  className="w-full"
                                />
                              </div>
                              {isFormFieldValid(formik, "decryptWhen") && (
                                <p className={styles.fieldError}>{formik?.errors?.decryptWhen?.toString()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </TabPanel>
                  </TabView>
                  <div className="flex gap-3 mt-3">
                    <div>
                      <SolidButton label="Finish" size="small" onClick={() => showError()} type="submit" />
                    </div>
                    <div>
                      <SolidButton label="Cancel" size="small" severity="secondary" type="reset" onClick={() => setVisiblePopup(false)} outlined />
                    </div>
                  </div>
                </div>
                {/* <div className="ml-4">
                  <SolidButton
                    label="Save"
                    onClick={() => showError(formik.validateForm)}
                    type="submit"
                  />
                </div> */}
              </div>
            </div>
          }

        </form>
      </div >
      <SolidDialog
        open={isBackPopupVisible}
        onOpenChange={(next) => {
          if (!next) {
            setIsBackPopupVisible(false);
          }
        }}
        dismissible={false}
        header="Unsaved Changes"
        headerClassName="solid-field-confirm-header"
        modal
        className="solid-confirm-dialog solid-field-confirm-dialog"
        footer={
          <div className="solid-field-confirm-actions">
            <SolidButton
              label="Yes"
              icon="pi pi-check"
              size="small"
              type="reset"
              severity="danger"
              autoFocus
              onClick={() => {
                resetFormStateForTypeSelection();
                setIsBackPopupVisible(false);
                setShowTypeFilter(true);
              }}
            />
            <SolidButton label="No" icon="pi pi-times" size="small" onClick={() => setIsBackPopupVisible(false)} />
          </div>
        }
      >
        <SolidDialogBody className="solid-field-confirm-dialog-body">
          <p className="solid-field-confirm-message">
            You have unsaved changes. Are you sure you want to go back?
          </p>
        </SolidDialogBody>
      </SolidDialog>
    </div >
  );
};


export default FieldMetaDataForm;
