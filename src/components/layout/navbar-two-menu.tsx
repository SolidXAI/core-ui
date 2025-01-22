"use client";
import { useState } from "react";
import { PanelMenu } from "primereact/panelmenu";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NavbarTwoMenu = ({ menuItems }: any) => {
    const pathname = usePathname();
    const activeParentPath = pathname.split('/').slice(-2, -1)[0];

    const [expandedKeys, setExpandedKeys] = useState<any>({});
    const itemRenderer = (item: any, options: any) => {
        const currentItem = item?.url?.split('/').slice(-2, -1)[0];
        return (
            <div key={item?.key} className={`flex align-items-center cursor-pointer menuHead px-2 ${currentItem === activeParentPath ? 'active-solid-men p-highlight' : ''}`} onClick={options.onClick}>
                <Link href={item?.url ? item?.url : '#'} className="w-full flex justify-content-between font-semibold">
                    <span className="">
                        {item.label}
                    </span>
                    {item?.items && item?.items?.length > 0 &&
                        <span className={`${expandedKeys[item.key] === true ? "pi pi-angle-up" : "pi pi-angle-down"}`} style={{ color: "#8D9199" }} />
                    }
                </Link>
            </div>
        )
    };

    const createMenuItems = (menuItems: any[]): any[] => {
        return menuItems.map((mi) => ({
            key: mi.key,
            label: mi.title,
            icon: mi.children ? "pi pi-angle-down" : "",
            template: itemRenderer,
            url: mi.path ? mi.path : null,
            items: mi.children ? createMenuItems(mi.children) : null, // Recursively add children
        }));
    };

    const items = createMenuItems(menuItems);

    const onExpandedKeysChange = (keys: any) => {
        setExpandedKeys(keys);
    };

    const expandNode = (node: any) => {
        if (node.items && node.items.length) {
            expandedKeys[node.key] = true;
            node.items.forEach(expandNode);
        }
    };

    return (
        <div className="card flex flex-column align-items-center gap-3">
            <PanelMenu
                model={items}
                expandedKeys={expandedKeys}
                onExpandedKeysChange={onExpandedKeysChange}
                className="w-full"
                multiple
            />
        </div>
    );
};

export default NavbarTwoMenu;