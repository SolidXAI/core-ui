import { hasAnyRole } from "../../../helpers/rolesHelper";
import { isButtonVisibleInCurrentEnv } from "../../../helpers/buttonEnvironment";
import { resolveButtonPresentation } from "../../../helpers/buttonPresentation";
import { useSession } from "../../../hooks/useSession";
import { SolidDropdownMenuItem } from "../../shad-cn-ui";
import { SolidIcon, parseSolidIconMeta } from "../../shad-cn-ui/SolidIcon";

export const SolidListViewHeaderContextMenuButton = ({ button, params, solidListViewMetaData, handleCustomButtonClick, onActionComplete }: any) => {

    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);
    const presentation = resolveButtonPresentation(button?.attrs);
    const iconNode = presentation.showIcon
        ? (() => {
            const m = parseSolidIconMeta(presentation.icon);
            return m
                ? <SolidIcon name={m.name} spin={m.spin} className="solid-header-action-button-icon" />
                : <i className={`${presentation.icon} solid-header-action-button-icon`} />;
        })()
        : null;

    if (!hasRole) return null;
    if (!isButtonVisibleInCurrentEnv(button?.attrs)) return null;
    if (!presentation.showIcon && !presentation.showLabel) return null;

    return (
        <SolidDropdownMenuItem
            className={`solid-header-dropdown-item ${presentation.buttonClassName ?? ""}`}
            onSelect={() => {
                const event = {
                    params,
                    solidListViewMetaData: solidListViewMetaData.data,
                };
                handleCustomButtonClick(button.attrs, event);
                onActionComplete?.();
            }}
            title={presentation.tooltip}
            aria-label={presentation.isIconOnly ? (presentation.tooltip ?? button?.attrs?.action ?? "Action") : undefined}
        >
            {presentation.iconPos === "left" ? iconNode : null}
            {presentation.showLabel ? <span className="solid-header-action-button-label">{presentation.label}</span> : null}
            {presentation.iconPos === "right" ? iconNode : null}
        </SolidDropdownMenuItem>
    );
};
