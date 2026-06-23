import { useSession } from "../../../hooks/useSession";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { resolveButtonPresentation } from "../../../helpers/buttonPresentation";
import { SolidIcon, parseSolidIconMeta } from "../../shad-cn-ui/SolidIcon";

export const SolidListViewRowActionMenuItem = ({ button, params, rowData, solidListViewMetaData, handleCustomButtonClick, onActionComplete }: any) => {

    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);
    const presentation = resolveButtonPresentation(button?.attrs);
    const iconNode = presentation.showIcon
        ? (() => {
            const m = parseSolidIconMeta(presentation.icon);
            return m
                ? <SolidIcon name={m.name} spin={m.spin} className="solid-row-action-button-icon" />
                : <i className={`${presentation.icon} solid-row-action-button-icon`} />;
        })()
        : null;

    if (!hasRole) return null;
    if (!presentation.showIcon && !presentation.showLabel) return null;

    return (
        <button
            type="button"
            className={`solid-row-action-button ${presentation.buttonClassName ? presentation.buttonClassName : ''}`}
            title={presentation.tooltip}
            aria-label={presentation.isIconOnly ? (presentation.tooltip ?? button?.attrs?.action ?? "Action") : undefined}
            onClick={() => {
                const event = {
                    params,
                    rowData: rowData,
                    solidListViewMetaData: solidListViewMetaData.data,
                };

                const modifiedButtonAttrs = { ...button.attrs }; // Create a copy

                // Conditionally add popupWidth for specific actions
                if (modifiedButtonAttrs.action === 'GenerateModelCodeRowAction' || modifiedButtonAttrs.action === 'GenerateModuleCodeRowAction') {
                    modifiedButtonAttrs.popupWidth = '30vw';
                }

                handleCustomButtonClick(modifiedButtonAttrs, event);
                onActionComplete?.();
            }}
        >
            {presentation.iconPos === "left" ? iconNode : null}
            {presentation.showLabel ? <span className="solid-row-action-button-label">{presentation.label}</span> : null}
            {presentation.iconPos === "right" ? iconNode : null}
        </button>
    );
};
