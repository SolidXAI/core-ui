import { hasAnyRole } from "../../../helpers/rolesHelper";
import { useSession } from "../../../hooks/useSession";
import { SolidDropdownMenuItem } from "../../shad-cn-ui";

export const SolidListViewHeaderContextMenuButton = ({ button, params, solidListViewMetaData, handleCustomButtonClick, onActionComplete }: any) => {

    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);

    if (!hasRole) return null;

    return (
        <SolidDropdownMenuItem
            className="solid-header-dropdown-item"
            onSelect={() => {
                const event = {
                    params,
                    solidListViewMetaData: solidListViewMetaData.data,
                };
                handleCustomButtonClick(button.attrs, event);
                onActionComplete?.();
            }}
        >
            <i className={`${button?.attrs?.className ? button?.attrs?.className : "pi pi-pencil"} solid-header-action-button-icon`} />
            <span className="solid-header-action-button-label">{button.attrs.label}</span>
        </SolidDropdownMenuItem>
    );
};
