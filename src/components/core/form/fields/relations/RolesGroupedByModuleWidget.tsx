import { useEffect, useState } from 'react';
import qs from 'qs';
import { SolidAccordion, SolidAccordionItem, SolidAccordionTrigger, SolidAccordionContent } from '../../../../shad-cn-ui/SolidAccordion';
import { SolidCheckbox } from '../../../../shad-cn-ui/SolidCheckbox';
import { SolidPanel } from '../../../../shad-cn-ui/SolidPanel';
import { solidGet } from '../../../../../http/solidHttp';

type RoleGroup = {
    moduleId: number | null;
    moduleDisplayName: string;
    roles: { label: string; value: any }[];
};

interface RolesGroupedByModuleWidgetProps {
    selectedRoles: string[];
    onToggle: (roleName: string) => void;
    readOnly?: boolean;
}

function cx(...parts: Array<string | false | undefined>) {
    return parts.filter(Boolean).join(' ');
}

export const RolesGroupedByModuleWidget = ({
    selectedRoles,
    onToggle,
    readOnly = false,
}: RolesGroupedByModuleWidgetProps) => {
    const [allRoles, setAllRoles] = useState<any[]>([]);
    const [groups, setGroups] = useState<RoleGroup[]>([]);
    const [openItems, setOpenItems] = useState<string[]>([]);

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
    }, []);

    useEffect(() => {
        if (!allRoles.length) return;

        const groupMap = new Map<number | null, { displayName: string; roles: { label: string; value: any }[] }>();
        groupMap.set(null, { displayName: 'Default', roles: [] });

        allRoles.forEach((role: any) => {
            const moduleId: number | null = role.moduleId ?? role.module?.id ?? null;
            const moduleDisplayName: string = role.module?.displayName ?? 'Default';
            const item = { label: role.name, value: role.id };

            if (moduleId === null || moduleId === undefined) {
                groupMap.get(null)!.roles.push(item);
            } else {
                if (!groupMap.has(moduleId)) {
                    groupMap.set(moduleId, { displayName: moduleDisplayName, roles: [] });
                }
                groupMap.get(moduleId)!.roles.push(item);
            }
        });

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

    if (groups.length === 0) {
        return (
            <SolidPanel>
                <p className="text-sm text-muted-foreground m-0">No roles defined.</p>
            </SolidPanel>
        );
    }

    return (
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
                            <div className="solid-user-role-grid pt-1">
                                {group.roles.map((item) => {
                                    const isSelected = selectedRoles.includes(item.label);

                                    return (
                                        <div
                                            key={item.value}
                                            className={cx(
                                                'solid-user-role-card',
                                                isSelected && 'is-selected'
                                            )}
                                        >
                                            <SolidCheckbox
                                                className="solid-user-role-control"
                                                disabled={readOnly}
                                                id={`role-${item.value}`}
                                                checked={isSelected}
                                                onChange={() => onToggle(item.label)}
                                                label={item.label}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </SolidAccordionContent>
                    </SolidAccordionItem>
                );
            })}
        </SolidAccordion>
    );
};
