import { hasAnyRole } from "../../../helpers/rolesHelper";
import { useSession } from "../../../hooks/useSession";
import { SolidButton, SolidIcon, parseSolidIconMeta } from "../../shad-cn-ui";

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
    const iconMeta = parseSolidIconMeta(button?.attrs?.icon ?? "si si-pencil");
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
                {iconMeta ? (
                    <SolidIcon
                        name={iconMeta.name}
                        spin={iconMeta.spin}
                        className="solid-row-action-button-icon"
                        aria-hidden
                    />
                ) : null}
                <span className="solid-row-action-button-label">{button.attrs.label}</span>
            </button>
        );
    }

    return (
        <div>
            <SolidButton
                text
                type="button"
                className={`w-full text-left gap-2 ${button?.attrs?.className ? button?.attrs?.className : ''}`}
                label={button.attrs.label}
                size="sm"
                leftIcon={
                    iconMeta ? <SolidIcon name={iconMeta.name} spin={iconMeta.spin} aria-hidden /> : undefined
                }
                onClick={handleClick}
            />
        </div>
    );
}
