'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelMenu } from "primereact/panelmenu";
import { useState } from "react";

const NavbarTwoMenu = ({ menuItems }: any) => {
    const pathname = usePathname();
    const activeParentPath = pathname.split('/').slice(-2, -1)[0];

    const [expandedKeys, setExpandedKeys] = useState<any>({});
    const itemRenderer = (item: any, options: any) => {
        const currentItem = item?.url?.split('/').slice(-2, -1)[0];
        const isSettingsPage = pathname.includes('/settings/') && item?.url?.includes('/settings/')
        ? pathname === item?.url // Exact match check for settings pages
        : currentItem === activeParentPath

        // currentItem === activeParentPath ?' p-highlight' : ''
        return (
            <div key={item?.key} className={`flex align-items-center cursor-pointer menuHead px-3 ${isSettingsPage ? ' p-highlight' : ''}`} onClick={options.onClick}>
                <Link href={item?.url ? item?.url : '#'} className="w-full flex justify-content-between font-normal">
                    <div className="flex align-items-center" style={{gap: 10}}>
                        {item.icon && (
                            // material-symbols-${item.iconVariant ?? 'outlined'}
                            <span className={`material-symbols-outlined`} style={{ fontSize: 18 }}>
                                {item.icon}
                            </span>
                        )}
                        <span>
                            {item.label}
                        </span>
                    </div>
                    {item?.items && item?.items?.length > 0 &&
                        <span className={`sidebar-chevrons ${expandedKeys[item.key] === true ? "pi pi-angle-up" : "pi pi-angle-down"}`} />
                    }
                </Link>
            </div>
        )
    };

    const createMenuItems = (menuItems: any[]): any[] => {
        return menuItems.map((mi) => ({
            key: mi.key,
            label: mi.title,
            icon: mi.icon ?? "",
            // iconVariant: mi.iconVariant,
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
        <div className="solid-panel-menu">
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