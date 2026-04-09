import { hasAnyRole } from "../../../helpers/rolesHelper";
import { useSession } from "../../../hooks/useSession";
import { SquarePen } from "lucide-react";
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
            {button?.attrs?.icon
                ? <i className={`${button.attrs.icon} solid-header-action-button-icon`} />
                : <SquarePen size={14} className="solid-header-action-button-icon" />}
            <span className="solid-header-action-button-label">{button.attrs.label}</span>
        </SolidDropdownMenuItem>
    );
};
