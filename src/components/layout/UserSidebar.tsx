

import Link from "../common/Link";
import { usePathname } from "../../hooks/usePathname";
import { useState } from "react";
import { SolidIcon } from "../shad-cn-ui";

const UserSidebar = () => {
  const pathname = usePathname();

  const menuItem: { name: string; url: string; icon: import("../shad-cn-ui").SolidIconName }[] = [
    {
      name: "Update Profile",
      url: "/me/update",
      icon: "si-user",
    },
    {
      name: "Upload Avatar",
      url: "/me/upload_avatar",
      icon: "si-user",
    },
    {
      name: "Update Password",
      url: "/me/update_password",
      icon: "si-lock",
    },
  ];

  const [activeMenuItem, setActiveMenuItem] = useState(pathname);

  const handleMenuItemClick = (menuItem: string) => {
    setActiveMenuItem(menuItem);
  };

  return (
    <div className="list-group mt-5 pl-4">
      {menuItem.map((menuItem, index) => (
        <Link
          key={index}
          href={menuItem.url}
          className={`fw-bold list-group-item list-group-item-action ${activeMenuItem === menuItem.url ? "active" : ""
            }`}
          onClick={() => handleMenuItemClick(menuItem.url)}
          aria-current={activeMenuItem === menuItem.url ? "true" : "false"}
        >
          <SolidIcon name={menuItem.icon} className="fa-fw pe-2" /> {menuItem.name}
        </Link>
      ))}
    </div>
  );
};

export default UserSidebar;
