import { isButtonVisibleInCurrentEnv } from "../../../helpers/buttonEnvironment";
import { resolveButtonPresentation } from "../../../helpers/buttonPresentation";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { useSession } from "../../../hooks/useSession";
import {
  SolidDropdownMenuItem,
  SolidDropdownMenuSeparator,
  SolidIcon,
  parseSolidIconMeta,
} from "../../shad-cn-ui";

type SolidCollectionRowActionMenuItemsProps = {
  buttons?: any[];
  params: any;
  rowData: any;
  solidViewMetaData: any;
  handleCustomButtonClick: (buttonAttrs: any, event: any) => void;
  showSeparator?: boolean;
  onActionComplete?: () => void;
};

export function SolidCollectionRowActionMenuItems({
  buttons = [],
  params,
  rowData,
  solidViewMetaData,
  handleCustomButtonClick,
  showSeparator = false,
  onActionComplete,
}: SolidCollectionRowActionMenuItemsProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const visibleButtons = buttons.filter((button: any) => {
    const attrs = button?.attrs;
    const roles = attrs?.roles ?? [];
    const presentation = resolveButtonPresentation(attrs);

    return (
      attrs?.actionInContextMenu === true &&
      attrs?.visible !== false &&
      isButtonVisibleInCurrentEnv(attrs) &&
      (roles.length === 0 || hasAnyRole(user?.roles, roles)) &&
      (presentation.showIcon || presentation.showLabel)
    );
  });

  if (visibleButtons.length === 0) return null;

  return (
    <>
      {showSeparator ? <SolidDropdownMenuSeparator /> : null}
      {visibleButtons.map((button: any, index: number) => {
        const presentation = resolveButtonPresentation(button.attrs);
        const iconMeta = presentation.showIcon
          ? parseSolidIconMeta(presentation.icon)
          : undefined;
        const iconNode = presentation.showIcon
          ? iconMeta
            ? <SolidIcon name={iconMeta.name} spin={iconMeta.spin} className="solid-header-action-button-icon" aria-hidden />
            : <i className={`${presentation.icon} solid-header-action-button-icon`} aria-hidden="true" />
          : null;

        return (
          <SolidDropdownMenuItem
            key={`${rowData?.id ?? "row"}-${button?.attrs?.action ?? index}`}
            className={`solid-header-dropdown-item ${presentation.buttonClassName ?? ""}`}
            title={presentation.tooltip}
            aria-label={presentation.isIconOnly
              ? (presentation.tooltip ?? button?.attrs?.action ?? "Action")
              : undefined}
            onSelect={() => {
              handleCustomButtonClick(button.attrs, {
                params,
                rowData,
                solidListViewMetaData: solidViewMetaData?.data ?? solidViewMetaData,
              });
              onActionComplete?.();
            }}
          >
            {presentation.iconPos === "left" ? iconNode : null}
            {presentation.showLabel
              ? <span className="solid-header-action-button-label">{presentation.label}</span>
              : null}
            {presentation.iconPos === "right" ? iconNode : null}
          </SolidDropdownMenuItem>
        );
      })}
    </>
  );
}
