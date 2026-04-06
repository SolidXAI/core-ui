import Link from "../common/Link";
import { usePathname } from "../../hooks/usePathname";
import { PanelMenu } from "primereact/panelmenu";
import { useState, useEffect } from "react";
import { useSearchParams } from "@/hooks/useSearchParams";

const NavbarTwoMenu = ({ menuItems }: any) => {
    const searchParams = useSearchParams();
    const [expandedKeys, setExpandedKeys] = useState<any>({});

    const activeId = searchParams.get("menuItemId");
    const hasActiveChild = (items: any[]): boolean => {
        if (!activeId) return false;
        return items?.some((item) =>
            (item.id !== null && item.id === activeId) || hasActiveChild(item.items ?? [])
        );
    };
    const itemRenderer = (item: any, options: any) => {
        const isSelected = activeId !== null && item.id !== null && item.id === activeId;
        const isParentActive = activeId !== null && item.items?.length > 0 && hasActiveChild(item.items);
        return (
            <div key={item?.key} className={`flex align-items-center cursor-pointer menuHead px-3 ${isSelected || isParentActive ? "p-highlight" : ""}`} onClick={options.onClick} >
                <Link href={item?.url ? item?.url : "#"} className="w-full flex justify-content-between font-normal">
                    <div className="flex align-items-center" style={{ gap: 10 }}>
                        {item.icon && (
                            // material-symbols-${item.iconVariant ?? 'outlined'}
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                {item.icon}
                            </span>
                        )}
                        <span>
                            {item.label}
                        </span>
                    </div>
                    {item?.items?.length > 0 &&
                        <span className={`sidebar-chevrons ${expandedKeys[item.key] ? "pi pi-angle-up" : "pi pi-angle-down"}`} />
                    }
                </Link>
            </div>
        )
    };

    const createMenuItems = (menuItems: any[]): any[] =>
        menuItems.map((mi) => {
            const menuItemId = new URLSearchParams(mi.path?.split("?")[1]).get("menuItemId");
            return {
                key: mi.key,
                id: menuItemId,   // ← extracted from path
                label: mi.title,
                icon: mi.icon ?? "",
                // iconVariant: mi.iconVariant,
                template: itemRenderer,
                url: mi.path ?? null,
                items: mi.children ? createMenuItems(mi.children) : null,
            };
        })


    const items = createMenuItems(menuItems);

    // Auto-expand parents with active child when activeId changes
    useEffect(() => {
        const newExpandedKeys: any = {};
        const expandIfActive = (items: any[]) => {
            items?.forEach((item) => {
                if (item.items?.length && hasActiveChild(item.items)) {
                    newExpandedKeys[item.key] = true;
                    expandIfActive(item.items);
                }
            });
        };
        expandIfActive(createMenuItems(menuItems));
        setExpandedKeys((prev: any) => ({ ...prev, ...newExpandedKeys }));
    }, [activeId]);

    return (
        <div className="solid-panel-menu">
            <PanelMenu
                model={items}
                expandedKeys={expandedKeys}
                onExpandedKeysChange={setExpandedKeys}
                className="w-full"
                multiple
            />
        </div>
    );
};

export default NavbarTwoMenu;
