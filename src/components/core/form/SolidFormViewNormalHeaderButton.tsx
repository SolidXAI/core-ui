import { hasAnyRole } from '../../../helpers/rolesHelper';
import { useSession } from "../../../hooks/useSession";
import { resolveButtonPresentation } from '../../../helpers/buttonPresentation';
import { SolidButton } from '../../shad-cn-ui';
import { SolidIcon, parseSolidIconMeta } from "../../shad-cn-ui/SolidIcon";

interface SolidFormViewNormalHeaderButtonProps {
    button: any;
    params: any;
    formik: any;
    solidFormViewMetaData: any;
    handleCustomButtonClick: (attrs: any, event: any) => void;
    formData: any;
    onActionComplete?: () => void;
    variant?: "default" | "menu";
}

export function SolidFormViewNormalHeaderButton({
    button,
    params,
    formik,
    solidFormViewMetaData,
    handleCustomButtonClick,
    formData,
    onActionComplete,
    variant = "default"
}: SolidFormViewNormalHeaderButtonProps) {

    const { data: session, status } = useSession();
    const user = session?.user;

    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);
    const presentation = resolveButtonPresentation(button?.attrs);

    if (!hasRole) return null;
    if (button?.attrs?.visible == false) return null
    if (!presentation.showIcon && !presentation.showLabel) return null;
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
        const iconMeta = presentation.icon ? parseSolidIconMeta(presentation.icon) : undefined;
        const iconNode = presentation.showIcon
            ? (iconMeta
                ? <SolidIcon name={iconMeta.name} spin={iconMeta.spin} className="solid-row-action-button-icon" />
                : <i className={`${presentation.icon} solid-row-action-button-icon`} />)
            : null;
        return (
            <button
                type="button"
                className={`solid-row-action-button ${presentation.buttonClassName ? presentation.buttonClassName : ''}`}
                onClick={handleClick}
                title={presentation.tooltip}
                aria-label={presentation.isIconOnly ? (presentation.tooltip ?? button?.attrs?.action ?? "Action") : undefined}
            >
                {presentation.iconPos === "left" ? iconNode : null}
                {presentation.showLabel ? <span className="solid-row-action-button-label">{presentation.label}</span> : null}
                {presentation.iconPos === "right" ? iconNode : null}
            </button>
        );
    }

    return (
        <div>
            <SolidButton
                type="button"
                className={`w-full text-left gap-2 solid-icon-button ${presentation.buttonClassName ? presentation.buttonClassName : ''}`}
                {...button.attrs}
                label={presentation.label}
                size="sm"
                iconPos={presentation.iconPos}
                icon={presentation.icon}
                tooltip={presentation.tooltip}
                aria-label={presentation.isIconOnly ? (presentation.tooltip ?? button?.attrs?.action ?? "Action") : undefined}
                onClick={handleClick}
            />
        </div>
    );
}
