import Link from "../../common/Link";
import { usePathname } from "../../../hooks/usePathname";
import { normalizeSolidListTreeKanbanActionPath } from "../../../helpers/routePaths";
import { SolidButton } from "../../shad-cn-ui";
import { Plus } from "lucide-react";

export const SolidCreateButton = ({ createButtonUrl, createActionQueryParams, solidListViewLayout, responsiveIconOnly = false }: any) => {
    const pathName = usePathname();

    const resolveCreatePath = () => {
        if (createButtonUrl) {
            const normalizedUrl = normalizeSolidListTreeKanbanActionPath(pathName, createButtonUrl);
            const query = new URLSearchParams(createActionQueryParams).toString();
            return query ? `${normalizedUrl}?${query}` : normalizedUrl;
        }

        return `${normalizeSolidListTreeKanbanActionPath(pathName, "form")}/new?viewMode=edit`;
    };

    const createPath = resolveCreatePath();

    const icon = solidListViewLayout?.attrs?.addButtonIcon;
    const label = solidListViewLayout?.attrs?.addButtonTitle || "Add";
    const className = solidListViewLayout?.attrs?.addButtonClassName || "";
    const defaultIcon = <Plus size={14} />;

    return (
        <div>
            <Link href={createPath}>
                {responsiveIconOnly ? (
                    <>
                        <SolidButton
                            type="button"
                            icon={icon}
                            leftIcon={!icon ? defaultIcon : undefined}
                            className={`${className} lg:hidden solid-icon-button `}
                            size='sm'
                        />

                        <SolidButton
                            type="button"
                            icon={icon}
                            leftIcon={!icon ? defaultIcon : undefined}
                            className={`${className} hidden lg:inline-flex`}
                            size='sm'
                        >
                            {label}
                        </SolidButton>
                    </>
                ) : (
                    <SolidButton
                        type="button"
                        icon={icon}
                        leftIcon={!icon ? defaultIcon : undefined}
                        className={`${className}`}
                        size='sm'
                    >
                        {label}
                    </SolidButton>
                )}

            </Link>
        </div>
    );
};
