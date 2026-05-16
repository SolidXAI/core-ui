import { useEffect, useState } from "react";
import * as Yup from 'yup';
import { FormikObject, ISolidField, SolidFieldProps } from "../ISolidField";
import { getExtensionComponent } from "../../../../../helpers/registry";
import { SolidAutocomplete } from "../../../../shad-cn-ui/SolidAutocomplete";
import { SolidButton } from "../../../../shad-cn-ui/SolidButton";
import { SolidCheckbox } from "../../../../shad-cn-ui/SolidCheckbox";
import { SolidDialog, SolidDialogBody, SolidDialogClose, SolidDialogHeader, SolidDialogTitle } from "../../../../shad-cn-ui/SolidDialog";
import { SolidMessage } from "../../../../shad-cn-ui/SolidMessage";
import { SolidPanel } from "../../../../shad-cn-ui/SolidPanel";
import { SolidFormFieldWidgetProps } from "../../../../../types/solid-core";
import { useRelationEntityHandler, RelationItem } from "./widgets/helpers/useRelationEntityHandler";
import { InlineRelationEntityDialog } from "./widgets/helpers/InlineRelationEntityDialog";
import { SolidFieldTooltip } from "../../../../../components/common/SolidFieldTooltip";
import qs from 'qs';
import * as Handlebars from "handlebars";
import { ERROR_MESSAGES } from "../../../../../constants/error-messages";
import { useRouter } from "../../../../../hooks/useRouter";
import { usePathname } from "../../../../../hooks/usePathname";
import { camelCase, capitalize } from "lodash";
import styles from "../solidFields.module.css";
import { SolidListView } from "../../../../core/list/SolidListView";
import { RenderSolidFormEmbededView } from "./SolidRelationManyToOneField";
import { buildSyntheticChangeEvent } from "../fieldEventUtils";

type AutoCompleteCompleteEvent = { query: string };

export type FormViewParams = {
    moduleName: any;
    id: any;
    embeded: any;
    isCustomCreate: any;
    customLayout: any;
    modelName: any;
    parentFieldName?: any;
    parentData: any;
    onEmbeddedFormSave: any;
    inlineCreateAutoSave: any;
    customCreateHandler?: any;
    handlePopupClose?: any;
};



export class SolidRelationManyToManyField implements ISolidField {

    private fieldContext: SolidFieldProps;

    constructor(fieldContext: SolidFieldProps) {
        this.fieldContext = fieldContext;
    }

    initialValue(): any {
        return [];
    }

    updateFormData(value: any, formData: FormData): any {
        // Link/unlink is handled per-interaction in each widget.
        // No bulk update needed on form submit for many-to-many.
    }

    validationSchema(): Yup.Schema {
        let schema = Yup.array();
        const fieldMetadata = this.fieldContext.fieldMetadata;
        const fieldLayoutInfo = this.fieldContext.field;
        const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;

        if (fieldMetadata.required) {
            schema = schema
                .min(1, ERROR_MESSAGES.SELECT_ATLEAST_ONE(fieldLabel))
                .required(ERROR_MESSAGES.FIELD_REUQIRED(fieldLabel));
        }

        return schema;
    }

    render(formik: FormikObject) {
        const fieldLayoutInfo = this.fieldContext.field;
        const className = fieldLayoutInfo.attrs?.className || 'field col-12';

        let viewWidget = fieldLayoutInfo.attrs.viewWidget;
        let editWidget = fieldLayoutInfo.attrs.editWidget;
        if (!editWidget) editWidget = 'DefaultRelationManyToManyAutoCompleteFormEditWidget';
        if (!viewWidget) viewWidget = 'DefaultRelationManyToManyListFormEditWidget';

        const viewMode: string = this.fieldContext.viewMode;
        return (
            <div className={className}>
                {viewMode === "view" && this.renderExtensionRenderMode(viewWidget, formik)}
                {viewMode === "edit" && editWidget && this.renderExtensionRenderMode(editWidget, formik)}
            </div>
        );
    }

    renderExtensionRenderMode(widget: string, formik: FormikObject) {
        const DynamicWidget = getExtensionComponent(widget);
        const widgetProps: SolidFormFieldWidgetProps = { formik, fieldContext: this.fieldContext };
        return <>{DynamicWidget && <DynamicWidget {...widgetProps} />}</>;
    }
}



/**
 * AUTOCOMPLETE WIDGET
 *
 * State:
 *   currentValues  — chips shown in the input (currently linked items)
 *   suggestions    — dropdown options populated on each keystroke
 *
 * Flow:
 *   mount            → fetchCurrentValues()
 *   user types       → fetchSuggestions() via completeMethod
 *   user selects     → linkItem()   → on success, adds to currentValues
 *   user removes chip→ unlinkItem() → on success, removes from currentValues
 */
export const DefaultRelationManyToManyAutoCompleteFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const disabled = fieldLayoutInfo.attrs?.disabled;
    const readOnly = fieldLayoutInfo.attrs?.readOnly;

    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);

    const {
        currentValues,
        suggestions,
        fetchCurrentValues,
        fetchSuggestions,
        linkItem,
        unlinkItem,
        addNewRelation,
    } = useRelationEntityHandler({ fieldContext });

    const isFormFieldValid = (formik: any, fieldName: string) =>
        formik.touched[fieldName] && formik.errors[fieldName];

    // On mount: load already-linked items into currentValues
    useEffect(() => {
        fetchCurrentValues();
    }, [fieldContext.data?.id]);

    const autoCompleteSearch = async (event: AutoCompleteCompleteEvent) => {
        const queryData: any = {
            offset: 0,
            limit: 1000,
            filters: {
                $and: [
                    {
                        [fieldMetadata?.relationModel?.userKeyField?.name]: {
                            [fieldLayoutInfo?.attrs?.autocompleteMatchMode || '$containsi']: event.query,
                        },
                    },
                ],
            },
        };

        let fixedFilterToBeApplied = false;
        let fixedFilterParsed = false;

        if (fieldMetadata?.relationFieldFixedFilter || fieldLayoutInfo?.attrs?.whereClause) {
            const rawFilter = fieldLayoutInfo?.attrs?.whereClause ?? fieldMetadata?.relationFieldFixedFilter;
            fixedFilterToBeApplied = true;
            const rendered = Handlebars.compile(rawFilter)(formik.values);

            try {
                const parsed = JSON.parse(rendered);
                const hasValue = (val: any): boolean => {
                    if (val === null || val === undefined || val === '') return false;
                    if (typeof val === 'object') return Object.values(val).some(hasValue);
                    return true;
                };
                if (hasValue(parsed)) {
                    queryData.filters.$and.push(parsed);
                    fixedFilterParsed = true;
                } else {
                    console.warn(ERROR_MESSAGES.SKIPPING_EMPTY_FIXED_FILTER, parsed);
                }
            } catch (e) {
                console.error(ERROR_MESSAGES.INVALID_JSON_WHERECLAUSE, rendered);
            }
        }

        if (fixedFilterToBeApplied && !fixedFilterParsed) {
            console.error(ERROR_MESSAGES.FIXED_FILTER_NOT_APPLIED);
        } else {
            fetchSuggestions(qs.stringify(queryData, { encodeValuesOnly: true }));
        }
    };

    const isUnsaved = fieldContext.data?.id === undefined || fieldContext.data?.id === "new";
    const entityName = fieldContext.solidFormViewMetaData?.data?.solidView?.model?.displayName || capitalize(fieldContext.modelName);

    return (
        <div className="relative">
            <div className={styles.fieldWrapper}>
                {showFieldLabel !== false && (
                    <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldLabel} form-field-label`}>
                        {fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                    </label>
                )}
                {isUnsaved && (
                    <div className="mb-2">
                        <SolidMessage severity="warn" text={`Please save the ${entityName} first to assign ${fieldLabel}.`} className="w-full justify-content-start" />
                    </div>
                )}
                <div className="flex align-items-center gap-3">
                    <SolidAutocomplete
                        readOnly={readOnly || readOnlyPermission || isUnsaved}
                        disabled={disabled || readOnlyPermission || isUnsaved}
                        multiple
                        id={fieldLayoutInfo.attrs.name}
                        field="label"
                        value={currentValues}
                        dropdown={!readOnlyPermission && !isUnsaved}
                        suggestions={suggestions}
                        completeMethod={autoCompleteSearch}
                        onChange={() => {
                            // Intentionally empty — currentValues is managed via onSelect/onUnselect
                        }}
                        onSelect={(e: { value: RelationItem }) => linkItem(e.value)}
                        onUnselect={(e: { value: RelationItem }) => unlinkItem(e.value)}
                        className="solid-standard-autocomplete w-full"
                    />
                    {fieldContext.field.attrs.inlineCreate && (
                        <>
                            <div>
                                <SolidButton
                                    icon="si si-plus"
                                    rounded
                                    variant="outline"
                                    aria-label="Filter"
                                    type="button"
                                    size="sm"
                                    onClick={() => setVisibleCreateDialog(true)}
                                    className="custom-add-button"
                                    disabled={isUnsaved}
                                />
                            </div>
                            <InlineRelationEntityDialog
                                visible={visibleCreateDialog}
                                setVisible={setVisibleCreateDialog}
                                fieldContext={fieldContext}
                                onCreate={addNewRelation}
                            />
                        </>
                    )}
                </div>
            </div>
            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="absolute mt-1">
                    <SolidMessage severity="error" text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()} />
                </div>
            )}
        </div>
    );
};



/**
 * CHECKBOX WIDGET
 *
 * State:
 *   allOptions     — every possible item to render as a checkbox row
 *   currentValues  — the subset that is currently linked (drives checked state)
 *
 * Flow:
 *   mount            → fetchCurrentValues() + fetchAllOptions()
 *   user checks      → linkItem()   → on success, adds to currentValues
 *   user unchecks    → unlinkItem() → on success, removes from currentValues
 */
export const DefaultRelationManyToManyCheckBoxFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);

    const {
        currentValues,
        allOptions,
        fetchCurrentValues,
        fetchAllOptions,
        linkItem,
        unlinkItem,
        addNewRelation,
    } = useRelationEntityHandler({ fieldContext });

    // On mount: load already-linked items + all possible options
    useEffect(() => {
        fetchCurrentValues();
    }, [fieldContext.data?.id]);

    // Sync currentValues to Formik state for validation
    useEffect(() => {
        if (fieldContext.updateFieldValue) {
            fieldContext.updateFieldValue(fieldLayoutInfo.attrs.name, currentValues, false);
        } else {
            formik.setFieldValue(fieldLayoutInfo.attrs.name, currentValues);
        }
    }, [currentValues]);

    useEffect(() => {
        const queryData: any = {
            offset: 0,
            limit: 1000,
            filters: { $and: [] },
        };

        let fixedFilterToBeApplied = false;
        let fixedFilterParsed = false;

        if (fieldMetadata?.relationFieldFixedFilter || fieldLayoutInfo?.attrs?.whereClause) {
            const rawFilter = fieldLayoutInfo?.attrs?.whereClause ?? fieldMetadata?.relationFieldFixedFilter;
            fixedFilterToBeApplied = true;
            const rendered = Handlebars.compile(rawFilter)(formik.values);

            try {
                const parsed = JSON.parse(rendered);
                const hasValue = (val: any): boolean => {
                    if (val === null || val === undefined || val === '') return false;
                    if (typeof val === 'object') return Object.values(val).some(hasValue);
                    return true;
                };
                if (hasValue(parsed)) {
                    queryData.filters.$and.push(parsed);
                    fixedFilterParsed = true;
                } else {
                    console.warn(ERROR_MESSAGES.SKIPPING_EMPTY_FIXED_FILTER, parsed);
                }
            } catch (e) {
                console.error(ERROR_MESSAGES.INVALID_JSON_WHERECLAUSE, rendered);
            }
        }

        if (fixedFilterToBeApplied && !fixedFilterParsed) {
            console.error(ERROR_MESSAGES.FIXED_FILTER_NOT_APPLIED);
        } else {
            fetchAllOptions(qs.stringify(queryData, { encodeValuesOnly: true }));
        }
    }, [fieldContext, formik.values]);

    const isUnsaved = fieldContext.data?.id === undefined || fieldContext.data?.id === "new";
    const entityName = fieldContext.solidFormViewMetaData?.data?.solidView?.model?.displayName || capitalize(fieldContext.modelName);

    const handleCheckboxChange = (item: any) => {
        const isCurrentlyLinked = currentValues.some((s) => s.value === item.value);
        if (isCurrentlyLinked) {
            unlinkItem(item);
        } else {
            linkItem(item);
        }
    };

    const panelHeader = (
        <div className="flex align-items-center gap-3 justify-content-space-between">
            <div className="flex align-items-center gap-3">
                {showFieldLabel !== false && (
                    <label className={`${styles.fieldLabel} form-field-label`}>
                        {fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                    </label>
                )}
                {fieldContext.field.attrs.inlineCreate && (
                    <>
                        <SolidButton
                            icon="si si-plus"
                            rounded
                            variant="outline"
                            aria-label="Filter"
                            type="button"
                            size="sm"
                            onClick={() => setVisibleCreateDialog(true)}
                            className="custom-add-button"
                            disabled={isUnsaved}
                        />
                        <InlineRelationEntityDialog
                            visible={visibleCreateDialog}
                            setVisible={setVisibleCreateDialog}
                            fieldContext={fieldContext}
                            onCreate={addNewRelation}
                        />
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div>
            {isUnsaved && (
                <div className="mb-2">
                    <SolidMessage severity="warn" text={`Please save the ${entityName} first to assign ${fieldLabel}.`} className="w-full justify-content-start" />
                </div>
            )}
            {panelHeader}
            <SolidPanel>
                <div className="formgrid grid">
                    {allOptions.map((item: any, i: number) => (
                        <div key={item.value} className={`field col-6 flex gap-2 ${i >= 2 ? 'mt-3' : ''}`}>
                            <SolidCheckbox
                                disabled={readOnlyPermission || isUnsaved}
                                id={item.label}
                                checked={currentValues.some((s) => s.value === item.value)}
                                onChange={() => handleCheckboxChange(item)}
                            />
                            <label htmlFor={item.label} className={`${styles.fieldLabel} form-field-label m-0`}>
                                {item.label}
                            </label>
                        </div>
                    ))}
                </div>
            </SolidPanel>
        </div>
    );
};



const buildRelationCustomFilter = ({
    fieldContext,
    fieldLayoutInfo,
}: {
    fieldContext: any;
    fieldLayoutInfo?: any;
}) => {
    if (!fieldContext) return { id: { $eq: -1 } };

    const relationFieldName =
        fieldContext.fieldMetadata?.relationCoModelFieldName ?? fieldContext.modelName;
    const parentId = fieldContext.data?.id ?? -1;
    const baseFilter = { [relationFieldName]: { id: { $eq: parentId } } };
    const whereClause = fieldLayoutInfo?.attrs?.whereClause;

    if (!whereClause) return { $and: [baseFilter] };

    try {
        return { $and: [baseFilter, JSON.parse(whereClause)] };
    } catch (error) {
        console.error("Failed to parse whereClause:", error);
        return { $and: [baseFilter] };
    }
};

export const DefaultRelationManyToManyListFormEditWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const router = useRouter();
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const solidFormViewMetaData = fieldContext.solidFormViewMetaData;
    const [visibleCreateRelationEntity, setvisibleCreateRelationEntity] = useState(false);
    const [listViewParams, setListViewParams] = useState<any>();
    const [formViewParams, setformViewParams] = useState<FormViewParams>();
    const [refreshList, setRefreshList] = useState(false);
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;
    const pathname = usePathname();
    const lastPathSegment = pathname.split('/').pop();
    const userKeyField: any = Object.entries(
        fieldContext.solidFormViewMetaData.data.solidFieldsMetadata
    ).find(([_, value]: any) => value.isUserKey)?.[0];
    const [showSaveParentEntityConfirmationPopup, setShowSaveParentEntityConfirmationPopup] = useState(false);



    const [visibleLinkDialog, setVisibleLinkDialog] = useState(false);
    const [linkSearchResults, setLinkSearchResults] = useState<any[]>([]);
    const [selectedLinkItem, setSelectedLinkItem] = useState<any>(null);
    const [isLinking, setIsLinking] = useState(false);

    const { fetchSuggestions, linkItem, unlinkItem, suggestions } = useRelationEntityHandler({ fieldContext });

    const handleAddClickForEmbeddedView = () => {
        if (lastPathSegment === "new") {
            setShowSaveParentEntityConfirmationPopup(true);
        } else {
            setSelectedLinkItem(null);
            setLinkSearchResults([]);
            setVisibleLinkDialog(true);
        }
    };

    const handleLinkSearch = async (event: AutoCompleteCompleteEvent) => {
        const queryData: any = {
            offset: 0,
            limit: 1000,
            filters: {
                $and: [
                    {
                        [fieldMetadata?.relationModel?.userKeyField?.name]: {
                            [fieldLayoutInfo?.attrs?.autocompleteMatchMode || '$containsi']: event.query,
                        },
                    },
                ],
            },
        };
        await fetchSuggestions(qs.stringify(queryData, { encodeValuesOnly: true }));
    };

    const handleLinkConfirm = async () => {
        if (!selectedLinkItem) return;
        setIsLinking(true);
        try {
            await linkItem(selectedLinkItem);
            setVisibleLinkDialog(false);
            setSelectedLinkItem(null);
            setRefreshList((prev) => !prev);
        } finally {
            setIsLinking(false);
        }
    };

    const handleDeleteClick = async (id: any) => {
        await unlinkItem({ value: id, label: '' });
        setRefreshList((prev) => !prev);
    };

    const handleEditClickForEmbeddedView = (id: any) => {
        if (id === "new") {
            setShowSaveParentEntityConfirmationPopup(true);
        } else {
            setformViewParams({
                moduleName: fieldContext.fieldMetadata.relationModelModuleName,
                id,
                embeded: true,
                isCustomCreate: false,
                customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
                modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
                parentFieldName: fieldContext.fieldMetadata.relationCoModelFieldName,
                parentData: userKeyField
                    ? { [userKeyField]: { solidManyToOneLabel: fieldContext.data[userKeyField], solidManyToOneValue: fieldContext.data['id'] } }
                    : {},
                onEmbeddedFormSave: fieldContext.onEmbeddedFormSave,
                inlineCreateAutoSave: fieldLayoutInfo?.attrs?.inlineCreateAutoSave,
            });
            setvisibleCreateRelationEntity(true);
        }
    };

    const handlePopupClose = () => {
        setvisibleCreateRelationEntity(false);
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('childEntity');
        router.push(currentUrl.toString());
        setRefreshList((prev) => !prev);
        setListViewParams({
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            inlineCreate: readOnlyPermission === false,
            customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
            embeded: true,
            id: fieldContext.data?.id ?? 'new',
            customFilter: buildRelationCustomFilter({ fieldContext, fieldLayoutInfo }),
        });
    };

    useEffect(() => {
        setListViewParams({
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            inlineCreate: readOnlyPermission === false,
            customLayout: fieldLayoutInfo?.attrs?.inlineListLayout,
            embeded: true,
            id: fieldContext.data?.id ?? 'new',
            customFilter: buildRelationCustomFilter({ fieldContext, fieldLayoutInfo }),
        });

        setformViewParams({
            moduleName: fieldContext.fieldMetadata.relationModelModuleName,
            modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName),
            parentFieldName: fieldContext.fieldMetadata.relationCoModelFieldName,
            id: "new",
            embeded: true,
            isCustomCreate: false,
            customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
            parentData: userKeyField
                ? { [userKeyField]: { solidManyToOneLabel: fieldContext.data[userKeyField], solidManyToOneValue: fieldContext.data['id'] } }
                : {},
            onEmbeddedFormSave: fieldContext.onEmbeddedFormSave,
            inlineCreateAutoSave: fieldLayoutInfo?.attrs?.inlineCreateAutoSave,
        });
    }, [readOnlyPermission]);

    const saveParentEntity = async () => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('childEntity', fieldLayoutInfo.attrs.name);
        currentUrl.searchParams.set('viewMode', 'edit');
        try {
            router.push(currentUrl.toString());
            await formik.handleSubmit();
        } catch { }
        setShowSaveParentEntityConfirmationPopup(false);
    };

    const isUnsaved = fieldContext.data?.id === undefined || fieldContext.data?.id === "new";
    const entityName = fieldContext.solidFormViewMetaData?.data?.solidView?.model?.displayName || capitalize(fieldContext.modelName);

    return (
        <div>
            {showFieldLabel !== false && (
                <label htmlFor={fieldLayoutInfo.attrs.name} className={`${styles.fieldLabel} form-field-label`}>
                    {fieldLabel}
                    {fieldMetadata.required && <span className="text-red-500"> *</span>}
                    <SolidFieldTooltip fieldContext={fieldContext} />
                </label>
            )}
            {isUnsaved && (
                <div className="mb-2">
                    <SolidMessage severity="warn" text={`Please save the ${entityName} first to assign ${fieldLabel}.`} className="w-full justify-content-start" />
                </div>
            )}
            {listViewParams && (
                <SolidListView key={refreshList.toString()} {...listViewParams} embededFieldRelationType="many-to-many" handleAddClickForEmbeddedView={handleAddClickForEmbeddedView} handleEditClickForEmbeddedView={handleEditClickForEmbeddedView} handleDeleteClick={handleDeleteClick} />
            )}
            {readOnlyPermission !== true && formViewParams && (
                <RenderSolidFormEmbededView
                    formik={formik}
                    fieldContext={fieldContext}
                    visibleCreateRelationEntity={visibleCreateRelationEntity}
                    setvisibleCreateRelationEntity={setvisibleCreateRelationEntity}
                    formViewParams={formViewParams}
                    handlePopupClose={handlePopupClose}
                />
            )}

            <SolidDialog
                open={visibleLinkDialog}
                onOpenChange={setVisibleLinkDialog}
                style={{ width: '30vw', minWidth: 320 }}
            >
                <SolidDialogHeader>
                    <SolidDialogTitle>{`Link existing ${fieldLabel}`}</SolidDialogTitle>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogBody>
                    <div className="flex flex-column gap-2 pt-2">
                        <label className="form-field-label">
                            Search {fieldLabel}
                        </label>
                        <SolidAutocomplete
                            field="label"
                            value={selectedLinkItem}
                            suggestions={suggestions}
                            completeMethod={handleLinkSearch}
                            onChange={({ value }: { value: any }) => setSelectedLinkItem(value)}
                            onSelect={({ value }: { value: any }) => setSelectedLinkItem(value)}
                            placeholder={`Type to search...`}
                            className="w-full"
                            dropdown
                        />
                    </div>
                </SolidDialogBody>
                <div className="solid-radix-dialog-footer flex gap-2 justify-content-end">
                    <SolidButton
                        label="Link"
                        size="sm"
                        disabled={!selectedLinkItem || isLinking}
                        loading={isLinking}
                        onClick={handleLinkConfirm}
                    />
                    <SolidButton
                        label="Cancel"
                        size="sm"
                        variant="outline"
                        className="bg-primary-reverse"
                        onClick={() => setVisibleLinkDialog(false)}
                    />
                </div>
            </SolidDialog>


            <SolidDialog
                open={showSaveParentEntityConfirmationPopup}
                onOpenChange={setShowSaveParentEntityConfirmationPopup}
                className="solid-confirm-dialog solid-field-confirm-dialog"
                style={{ width: "min(420px, calc(100vw - 2rem))" }}
            >
                <SolidDialogHeader className="solid-field-confirm-header">
                    <SolidDialogTitle>Save Required</SolidDialogTitle>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogBody className="solid-field-confirm-dialog-body">
                    <p className="solid-field-confirm-message">
                        Before creating {fieldLabel}, you need to save{" "}
                        {solidFormViewMetaData?.data?.solidView?.model?.displayName
                            ? solidFormViewMetaData.data.solidView.model.displayName
                            : capitalize(fieldContext.modelName)}
                        . Please save first if you want to continue.
                    </p>
                </SolidDialogBody>
                <div className="solid-radix-dialog-footer solid-field-confirm-actions">
                    <SolidButton label="Save" size="sm" onClick={saveParentEntity} autoFocus />
                    <SolidButton
                        label="Cancel"
                        size="sm"
                        onClick={() => setShowSaveParentEntityConfirmationPopup(false)}
                        variant="outline"
                    />
                </div>
            </SolidDialog>
        </div>
    );
};
