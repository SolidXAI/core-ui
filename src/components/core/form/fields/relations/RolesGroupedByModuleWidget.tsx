import { useEffect, useState } from 'react';
import qs from 'qs';
import { SolidFormFieldWidgetProps } from '../../../../../types/solid-core';
import { useRelationEntityHandler, RelationItem } from './widgets/helpers/useRelationEntityHandler';
import { SolidAccordion, SolidAccordionItem, SolidAccordionTrigger, SolidAccordionContent } from '../../../../shad-cn-ui/SolidAccordion';
import { SolidCheckbox } from '../../../../shad-cn-ui/SolidCheckbox';
import { SolidMessage } from '../../../../shad-cn-ui/SolidMessage';
import { SolidPanel } from '../../../../shad-cn-ui/SolidPanel';
import { SolidButton } from '../../../../shad-cn-ui/SolidButton';
import { capitalize } from 'lodash';
import { InlineRelationEntityDialog } from './widgets/helpers/InlineRelationEntityDialog';
import { SolidFieldTooltip } from '../../../../../components/common/SolidFieldTooltip';
import { solidGet } from '../../../../../http/solidHttp';
import styles from '../solidFields.module.css';

type RoleGroup = {
    moduleId: number | null;
    moduleDisplayName: string;
    roles: RelationItem[];
};

/**
 * RolesGroupedByModuleWidget
 *
 * Groups roles by their associated module on the User form:
 *   - Roles with no module → "Default Roles" accordion (first)
 *   - Roles linked to a module → "<Module Display Name> Roles" accordion
 *
 * Each checkbox immediately fires a link/unlink API call.
 */
export const RolesGroupedByModuleWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const showFieldLabel = fieldLayoutInfo?.attrs?.showLabel;
    const readOnlyPermission = fieldContext.readOnly;

    const [visibleCreateDialog, setVisibleCreateDialog] = useState(false);
    const [allRoles, setAllRoles] = useState<any[]>([]);
    const [groups, setGroups] = useState<RoleGroup[]>([]);
    const [openItems, setOpenItems] = useState<string[]>([]);

    const {
        currentValues,
        fetchCurrentValues,
        linkItem,
        unlinkItem,
        addNewRelation,
    } = useRelationEntityHandler({ fieldContext });

    // Sync currentValues to Formik for validation
    useEffect(() => {
        formik.setFieldValue(fieldLayoutInfo.attrs.name, currentValues);
    }, [currentValues]);

    // On mount: load currently linked roles
    useEffect(() => {
        fetchCurrentValues();
    }, [fieldContext.data?.id]);

    // Fetch all roles with module populated
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const qsStr = qs.stringify(
                    { offset: 0, limit: 1000, populate: ['module'] },
                    { encodeValuesOnly: true }
                );
                const response = await solidGet(`/role-metadata?${qsStr}`);
                const records = response?.data?.data?.records ?? [];
                setAllRoles(records);
            } catch (e) {
                console.error('RolesGroupedByModuleWidget: failed to fetch roles', e);
            }
        };
        fetchRoles();
    }, [fieldContext.data?.id]);

    // Rebuild groups whenever allRoles changes
    useEffect(() => {
        if (!allRoles.length) return;

        const groupMap = new Map<number | null, { displayName: string; roles: RelationItem[] }>();
        groupMap.set(null, { displayName: 'Default', roles: [] });

        allRoles.forEach((role: any) => {
            const moduleId: number | null = role.moduleId ?? role.module?.id ?? null;
            const moduleDisplayName: string = role.module?.displayName ?? 'Default';
            const item: RelationItem = { label: role.name, value: role.id, original: role };

            if (moduleId === null || moduleId === undefined) {
                groupMap.get(null)!.roles.push(item);
            } else {
                if (!groupMap.has(moduleId)) {
                    groupMap.set(moduleId, { displayName: moduleDisplayName, roles: [] });
                }
                groupMap.get(moduleId)!.roles.push(item);
            }
        });

        // Default group first, then modules sorted alphabetically by displayName
        const built: RoleGroup[] = [];
        built.push({ moduleId: null, moduleDisplayName: 'Default', roles: groupMap.get(null)!.roles });

        const moduleKeys = Array.from(groupMap.keys())
            .filter((k) => k !== null)
            .sort((a, b) => {
                const dA = groupMap.get(a as number)!.displayName;
                const dB = groupMap.get(b as number)!.displayName;
                return dA.localeCompare(dB);
            });

        moduleKeys.forEach((moduleId) => {
            const g = groupMap.get(moduleId as number)!;
            built.push({ moduleId: moduleId as number, moduleDisplayName: g.displayName, roles: g.roles });
        });

        const nonEmpty = built.filter((g) => g.roles.length > 0);
        setGroups(nonEmpty);
        setOpenItems(nonEmpty.map((g) => String(g.moduleId ?? 'default')));
    }, [allRoles]);

    const handleCheckboxChange = (item: RelationItem) => {
        const isLinked = currentValues.some((s) => s.value === item.value);
        if (isLinked) unlinkItem(item);
        else linkItem(item);
    };

    const isUnsaved = fieldContext.data?.id === undefined || fieldContext.data?.id === 'new';
    const entityName =
        fieldContext.solidFormViewMetaData?.data?.solidView?.model?.displayName ||
        capitalize(fieldContext.modelName);

    const isFormFieldValid = (fmk: any, fieldName: string) =>
        fmk.touched[fieldName] && fmk.errors[fieldName];

    return (
        <div>
            {isUnsaved && (
                <div className="mb-2">
                    <SolidMessage
                        severity="warn"
                        text={`Please save the ${entityName} first to assign ${fieldLabel}.`}
                        className="w-full justify-start"
                    />
                </div>
            )}

            <div className="flex items-center gap-3 mb-2">
                {showFieldLabel !== false && (
                    <label className={`${styles.fieldLabel} form-field-label`}>
                        {fieldLabel}
                        {fieldMetadata.required && <span className="text-red-500"> *</span>}
                        <SolidFieldTooltip fieldContext={fieldContext} />
                    </label>
                )}
                {fieldLayoutInfo.attrs.inlineCreate && (
                    <>
                        <SolidButton
                            icon="si si-plus"
                            rounded
                            variant="outline"
                            aria-label="Add role"
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

            {groups.length === 0 && !isUnsaved && (
                <SolidPanel>
                    <p className="text-sm text-muted-foreground m-0">No roles defined.</p>
                </SolidPanel>
            )}

            {groups.length > 0 && (
                <SolidAccordion
                    type="multiple"
                    value={openItems}
                    onValueChange={setOpenItems}
                    className="w-full"
                >
                    {groups.map((group) => {
                        const key = String(group.moduleId ?? 'default');
                        const title =
                            group.moduleId === null
                                ? 'Default Roles'
                                : `${group.moduleDisplayName} Roles`;
                        return (
                            <SolidAccordionItem key={key} value={key}>
                                <SolidAccordionTrigger>{title}</SolidAccordionTrigger>
                                <SolidAccordionContent>
                                    <div className="flex flex-wrap -mx-2 -mt-2 pt-1">
                                        {group.roles.map((item, i) => (
                                            <div
                                                key={item.value}
                                                className={`field flex w-1/2 gap-2 ${i >= 2 ? 'mt-3' : ''}`}
                                            >
                                                <SolidCheckbox
                                                    disabled={readOnlyPermission || isUnsaved}
                                                    id={`role-${item.value}`}
                                                    checked={currentValues.some((s) => s.value === item.value)}
                                                    onChange={() => handleCheckboxChange(item)}
                                                />
                                                <label
                                                    htmlFor={`role-${item.value}`}
                                                    className={`${styles.fieldLabel} form-field-label m-0`}
                                                >
                                                    {item.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </SolidAccordionContent>
                            </SolidAccordionItem>
                        );
                    })}
                </SolidAccordion>
            )}

            {isFormFieldValid(formik, fieldLayoutInfo.attrs.name) && (
                <div className="mt-1">
                    <SolidMessage
                        severity="error"
                        text={formik?.errors[fieldLayoutInfo.attrs.name]?.toString()}
                    />
                </div>
            )}
        </div>
    );
};
