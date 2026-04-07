import { capitalize } from "lodash";
import { Message } from "primereact/message";
import { Panel } from "primereact/panel";
import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { useRelationEntityHandler } from "../../../../../components/core/form/fields/relations/widgets/helpers/useRelationEntityHandler";
import { InlineRelationEntityDialog } from "../../../../../components/core/form/fields/relations/widgets/helpers/InlineRelationEntityDialog";
import { Checkbox } from "primereact/checkbox";
import { SolidFormFieldWidgetProps } from "../../../../../types/solid-core";
import qs from 'qs';

const groupByController = (items: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    items.forEach((item) => {
        const controllerName = item.label.split(".")[0];
        if (!grouped[controllerName]) {
            grouped[controllerName] = [];
        }
        grouped[controllerName].push(item);
    });
    return grouped;
};

export const RolePermissionsManyToManyFieldWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldLayoutInfo = fieldContext.field;
    const readOnlyPermission = fieldContext.readOnly;
    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);

    const [visibleDialogs, setVisibleDialogs] = useState<{ [key: string]: boolean }>({});

    const {
        allOptions,
        currentValues,
        fetchAllOptions,
        fetchCurrentValues,
        linkItem,
        unlinkItem,
        addNewRelation,
    } = useRelationEntityHandler({ fieldContext });

    // On mount: load already-linked permissions into currentValues
    useEffect(() => {
        fetchCurrentValues();
    }, [fieldContext.data?.id]);

    // On mount: load all available permissions into allOptions
    useEffect(() => {
        const queryData = { offset: 0, limit: 1000 };
        fetchAllOptions(qs.stringify(queryData, { encodeValuesOnly: true }));
    }, []);

    const handleCheckboxChange = (item: any) => {
        const isCurrentlyLinked = currentValues.some((s) => s.value === item.value);
        if (isCurrentlyLinked) {
            unlinkItem(item);
        } else {
            linkItem(item);
        }
    };

    const getHeaderTemplate = (controllerName: string) => (options: any) => {
        const className = `${options.className} justify-content-space-between`;

        return (
            <div className={className}>
                <div className="flex align-items-center gap-3">
                    <label className="form-field-label text-base lg:text-lg font-bold">
                        {controllerName}
                    </label>
                    {fieldContext.field.attrs.inlineCreate && (
                        <>
                            <Button
                                icon="pi pi-plus"
                                rounded
                                outlined
                                aria-label="Add"
                                type="button"
                                size="small"
                                onClick={() =>
                                    setVisibleDialogs((prev) => ({
                                        ...prev,
                                        [controllerName]: true,
                                    }))
                                }
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
                <div>{options.togglerElement}</div>
            </div>
        );
    };

    const isUnsaved = fieldContext.data?.id === undefined || fieldContext.data?.id === "new";
    const entityName = fieldContext.solidFormViewMetaData?.data?.solidView?.model?.displayName || capitalize(fieldContext.modelName);
    const fieldLabel = fieldLayoutInfo.attrs.label || "Permissions";

    const groupedEntities = groupByController(allOptions || []);
    return (
        <div>
            {isUnsaved && (
                <div className="mb-2">
                    <Message severity="warn" text={`Please save the ${entityName} first to assign ${fieldLabel}.`} className="w-full justify-content-start" />
                </div>
            )}
            {Object.keys(groupedEntities).map((controllerName) => (
                <Panel
                    key={controllerName}
                    toggleable
                    headerTemplate={getHeaderTemplate(controllerName)}
                    className="mt-3 lg:mt-4"
                >
                    <div className="formgrid grid gap-3 lg:gap-0">
                        {groupedEntities[controllerName].map((entity: any, i: number) => (
                            <div
                                key={entity.value}
                                className={`field col-12 lg:col-6 flex gap-2 ${i >= 2 ? 'lg:mt-3' : ''}`}
                            >
                                <Checkbox
                                    readOnly={readOnlyPermission || isUnsaved}
                                    disabled={isUnsaved}
                                    inputId={entity.label}
                                    checked={currentValues.some((s) => s.value === entity.value)}
                                    onChange={() => handleCheckboxChange(entity)}
                                />
                                <label htmlFor={entity.label} className="form-field-label m-0 solid-permisson-form-label">
                                    {entity.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </Panel>
            ))}
            {Object.keys(groupedEntities).map((controllerName) => (
                <InlineRelationEntityDialog
                    key={`dialog-${controllerName}`}
                    visible={visibleDialogs[controllerName] || false}
                    setVisible={(visible: any) =>
                        setVisibleDialogs((prev) => ({
                            ...prev,
                            [controllerName]: visible,
                        }))
                    }
                    fieldContext={fieldContext}
                    onCreate={addNewRelation}
                />
            ))}
        </div>
    );
};