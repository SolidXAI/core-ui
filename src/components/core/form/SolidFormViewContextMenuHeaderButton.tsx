import { Button } from 'primereact/button';
import { hasAnyRole } from '../../../helpers/rolesHelper';
import { useSession } from "../../../hooks/useSession";

interface SolidFormViewContextMenuHeaderButtonProps {
    button: any;
    params: any;
    formik: any;
    solidFormViewMetaData: any;
    handleCustomButtonClick: (attrs: any, event: any) => void;
    formData: any;
    onActionComplete?: () => void;
    variant?: "default" | "menu";
}

export function SolidFormViewContextMenuHeaderButton({
    button,
    params,
    formik,
    solidFormViewMetaData,
    handleCustomButtonClick,
    formData,
    onActionComplete,
    variant = "default"
}: SolidFormViewContextMenuHeaderButtonProps) {

    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);

    if (!hasRole) return null;
    if (button.attrs?.visible == false) return null
    const handleClick = () => {
        const event = {
            action: button.attrs.action,
            params,
            formik,
            solidFormViewMetaData: solidFormViewMetaData.data,
            formData
        };
        handleCustomButtonClick(button.attrs, event);
        onActionComplete?.();
    };

    if (variant === "menu") {
        return (
            <button
                type="button"
                className={`solid-row-action-button ${button?.attrs?.className ? button?.attrs?.className : ''}`}
                onClick={handleClick}
            >
                <i className={`${button?.attrs?.icon ? button?.attrs?.icon : "pi pi-pencil"} solid-row-action-button-icon`} />
                <span className="solid-row-action-button-label">{button.attrs.label}</span>
            </button>
        );
    }

    return (
        <div>
            <Button
                text
                type="button"
                className={`w-full text-left gap-2 ${button?.attrs?.className ? button?.attrs?.className : ''}`}
                label={button.attrs.label}
                size="small"
                iconPos="left"
                icon={button?.attrs?.icon ? button?.attrs?.icon : "pi pi-pencil"}
                onClick={handleClick}
            />
        </div>
    );
}
