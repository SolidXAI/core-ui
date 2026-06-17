import { useSession } from "../../../hooks/useSession";
import { isButtonVisibleInCurrentEnv } from "../../../helpers/buttonEnvironment";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { resolveButtonPresentation } from "../../../helpers/buttonPresentation";
import { SolidButton } from "../../shad-cn-ui";

export const SolidListViewHeaderButton = ({ button, params, solidListViewMetaData, handleCustomButtonClick, selectedRecords, filters }: any) => {
    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);
    const presentation = resolveButtonPresentation(button?.attrs);

    if (!hasRole) return null;
    if (!isButtonVisibleInCurrentEnv(button?.attrs)) return null;
    if (!presentation.showIcon && !presentation.showLabel) return null;

    return (
        <SolidButton
            type="button"
            className={`text-left ${presentation.buttonClassName ?? "gap-2"}`}
            size="small"
            icon={presentation.icon}
            iconPos={presentation.iconPos}
            label={presentation.label}
            tooltip={presentation.tooltip}
            aria-label={presentation.isIconOnly ? (presentation.tooltip ?? button?.attrs?.action ?? "Action") : undefined}
            onClick={() => {
                const event = {
                    params,
                    solidListViewMetaData: solidListViewMetaData.data,
                    selectedRecords: selectedRecords,
                    filters
                };
                handleCustomButtonClick(button.attrs, event);
            }}
        />
    );
};
