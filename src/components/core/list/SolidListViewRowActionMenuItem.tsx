import { useSession } from "../../../hooks/useSession";
import { hasAnyRole } from "../../../helpers/rolesHelper";

export const SolidListViewRowActionMenuItem = ({ button, params, rowData, solidListViewMetaData, handleCustomButtonClick, onActionComplete }: any) => {

    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);

    if (!hasRole) return null;

    return (
        <button
            type="button"
            className={`solid-row-action-button ${button?.attrs?.className ? button?.attrs?.className : ''}`}
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
            <i className={`${button?.attrs?.icon ? button?.attrs?.icon : "pi pi-pencil"} solid-row-action-button-icon`} />
            <span className="solid-row-action-button-label">{button.attrs.label}</span>
        </button>
    );
};
