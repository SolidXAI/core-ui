import { useSession } from "../../../hooks/useSession";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { SquarePen } from "lucide-react";
import { SolidButton } from "../../shad-cn-ui";

export const SolidListViewHeaderButton = ({ button, params, solidListViewMetaData, handleCustomButtonClick, selectedRecords, filters }: any) => {
    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);

    if (!hasRole) return null;

    return (
        <SolidButton
            type="button"
            className={`text-left ${button?.attrs?.className ?? "gap-2"}`}
            size="small"
            icon={button?.attrs?.icon}
            leftIcon={!button?.attrs?.icon ? <SquarePen size={14} /> : undefined}
            onClick={() => {
                const event = {
                    params,
                    solidListViewMetaData: solidListViewMetaData.data,
                    selectedRecords: selectedRecords,
                    filters
                };
                handleCustomButtonClick(button.attrs, event);
            }}
        >
            {button.attrs.label}
        </SolidButton>
    );
};
