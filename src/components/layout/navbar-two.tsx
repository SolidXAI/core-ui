"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const NavbarTwo = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [renderMenu, setRenderMenu] = useState();

  const iamMenu = [
    {
      title: "Users",
      url: "users",
      subMenu: [],
    },
    {
      title: "Model",
      url: "model",
      subMenu: [
        { title: "Add Model", url: "", subMenu: ["Add One", "Add Multiple"] },
        { title: "Delete Model", url: "delete", subMenu: [] },
      ],
    },
    {
      title: "Field",
      url: "field",
      subMenu: [
        { title: "Add Field", subMenu: ["Add One", "Add Multiple"] },
        { title: "Delete Field", url: "delete", subMenu: [] },
      ],
    },
  ];

  return <></>
};

export default NavbarTwo;
