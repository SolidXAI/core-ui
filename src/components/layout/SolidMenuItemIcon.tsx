import { SolidIcon } from "../shad-cn-ui";
import { SolidMaterialSymbol } from "../common/SolidMaterialSymbol";
import {
  resolveMenuItemIcon,
  type MenuItemIconSource,
} from "../../helpers/menuItemIcons";

type SolidMenuItemIconProps = {
  item?: MenuItemIconSource | null;
  className?: string;
  size?: number | string;
};

export const SolidMenuItemIcon = ({ item, className, size = 18, }: SolidMenuItemIconProps) => {
  if (item?.isSystem) {
    return null;
  }
  const icon = resolveMenuItemIcon(item);
  if (!icon) {
    return null;
  }

  if (icon.kind === "solid") {
    return (
      <SolidIcon
        aria-hidden="true"
        className={className}
        name={icon.name}
        size={size}
        spin={icon.spin}
      />
    );
  }

  // Material icon
  return (
    <SolidMaterialSymbol
      aria-hidden="true"
      className={className}
      name={icon.name}
      size={size}
      fallback={null}
    />
  );
};