import { ToastContainer } from "../../helpers/ToastContainer";
import { useGetSolidMenuBasedOnRoleQuery } from "../../redux/api/solidMenuApi";
import { hideNavbar, toggleNavbar } from "../../redux/features/navbarSlice";
import { setIsAuthenticated, setUser } from "../../redux/features/userSlice";
import { useSession } from "../../hooks/useSession";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import UserProfileMenu from "./user-profile-menu";
import SolidLink from "../common/Link";
import { usePathname } from "../../hooks/usePathname";
import { env } from "../../adapters/env";

type SolidMenuItem = {
    key?: string;
    title: string;
    path?: string;
    icon?: string | { src?: string };
    children?: SolidMenuItem[];
};

const defaultMenuKey = env("NEXT_PUBLIC_DEFAULT_MENU_KEY");
const SIDEBAR_STORAGE_KEY = "solidx.sidebar.collapsed";
const SIDEBAR_TOGGLE_EVENT = "solidx:sidebar-toggle";
const DESKTOP_SIDEBAR_WIDTH = "272px";

function filterMenuItems(items: SolidMenuItem[], query: string): SolidMenuItem[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    const next: SolidMenuItem[] = [];
    items.forEach((item) => {
        const children = item.children ? filterMenuItems(item.children, normalizedQuery) : [];
        const matchesSelf = item.title.toLowerCase().includes(normalizedQuery);
        if (matchesSelf || children.length > 0) {
            next.push({ ...item, children });
        }
    });
    return next;
}

const SidebarMenuTree = ({
    items,
    pathname,
    forceExpand,
}: {
    items: SolidMenuItem[];
    pathname: string;
    forceExpand?: boolean;
}) => {
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

    const buildNodeId = (node: SolidMenuItem, parentId: string, index: number) => {
        const base = node.key || node.path || node.title || `node-${index}`;
        return `${parentId}/${base}`;
    };

    useEffect(() => {
        const initialExpanded: Record<string, boolean> = {};
        if (forceExpand) {
            const walk = (nodes: SolidMenuItem[], parentId = "root") => {
                nodes.forEach((node, index) => {
                    const nodeId = buildNodeId(node, parentId, index);
                    if (node.children && node.children.length > 0 && node.key) {
                        initialExpanded[nodeId] = true;
                        walk(node.children, nodeId);
                    } else if (node.children && node.children.length > 0) {
                        initialExpanded[nodeId] = true;
                        walk(node.children, nodeId);
                    }
                });
            };
            walk(items);
        }
        setExpandedKeys(initialExpanded);
    }, [items, forceExpand]);

    const toggleExpanded = (nodeId: string) => {
        setExpandedKeys((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const renderNode = (node: SolidMenuItem, depth = 0, parentId = "root", index = 0) => {
        const nodeId = buildNodeId(node, parentId, index);
        const hasChildren = !!(node.children && node.children.length > 0);
        const isExpanded = expandedKeys[nodeId] === true;
        const isActive = !!node.path && pathname === node.path;
        const paddingLeft = 12 + depth * 14;

        return (
            <li key={nodeId} className="solid-sidebar-tree-item">
                <div
                    className={`solid-sidebar-tree-row ${isActive ? "is-active" : ""}`}
                    style={{ paddingLeft }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            className="solid-sidebar-tree-parent"
                            onClick={() => toggleExpanded(nodeId)}
                            aria-expanded={isExpanded}
                            aria-label={`Toggle ${node.title}`}
                        >
                            <span className="solid-sidebar-tree-label">{node.title}</span>
                        </button>
                    ) : node.path ? (
                        <SolidLink href={node.path} className="solid-sidebar-tree-link">
                            <span className="solid-sidebar-tree-label">{node.title}</span>
                        </SolidLink>
                    ) : (
                        <span className="solid-sidebar-tree-label">{node.title}</span>
                    )}
                    {hasChildren && (
                        <button
                            type="button"
                            className="solid-sidebar-tree-toggle"
                            onClick={() => toggleExpanded(nodeId)}
                            aria-label={`Toggle ${node.title}`}
                        >
                            <span className="solid-tree-plusminus">{isExpanded ? "−" : "+"}</span>
                        </button>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <ul className="solid-sidebar-tree-list solid-sidebar-tree-children">
                        {node.children!.map((child, childIndex) => renderNode(child, depth + 1, nodeId, childIndex))}
                    </ul>
                )}
            </li>
        );
    };

    return <ul className="solid-sidebar-tree-list">{items.map((item, index) => renderNode(item, 0, "root", index))}</ul>;
};

const AppSidebar = () => {
    const dispatch = useDispatch();
    const pathname = usePathname();
    const visibleNavbar = useSelector((state: any) => state.navbarState.visibleNavbar);
    const { data: menu } = useGetSolidMenuBasedOnRoleQuery("");

    const [searchTerm, setSearchTerm] = useState("");
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    const [selectedWorkspaceKey, setSelectedWorkspaceKey] = useState("");
    const [isDesktop, setIsDesktop] = useState<boolean>(typeof window === "undefined" ? true : window.innerWidth > 1199);
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (stored === null) return true;
        return stored === "true";
    });

    const { data } = useSession();

    useEffect(() => {
        if (data) {
            dispatch(setUser(data?.user));
            dispatch(setIsAuthenticated(true));
        }
    }, [data, dispatch]);

    useEffect(() => {
        const onResize = () => {
            const desktop = window.innerWidth > 1199;
            setIsDesktop(desktop);
            if (desktop) {
                dispatch(hideNavbar());
            }
        };

        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [dispatch]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    useEffect(() => {
        const width = isDesktop ? (isCollapsed ? "0px" : DESKTOP_SIDEBAR_WIDTH) : "0px";
        document.documentElement.style.setProperty("--solid-sidebar-width", width);
    }, [isDesktop, isCollapsed]);

    useEffect(() => {
        if (!menu?.data?.length) return;
        const defaultWorkspace = menu.data.find((m: any) => m.key === defaultMenuKey) || menu.data[0];
        setSelectedWorkspaceKey((prev) => prev || defaultWorkspace?.key || "");
    }, [menu]);

    useEffect(() => {
        if (!isDesktop) {
            dispatch(hideNavbar());
        }
    }, [pathname, dispatch, isDesktop]);

    useEffect(() => {
        const onToggleRequest = () => {
            if (window.innerWidth > 1199) {
                setIsCollapsed((prev) => !prev);
                return;
            }
            dispatch(toggleNavbar());
        };

        window.addEventListener(SIDEBAR_TOGGLE_EVENT, onToggleRequest);
        return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, onToggleRequest);
    }, [dispatch]);

    const workspaces: SolidMenuItem[] = menu?.data || [];
    const selectedWorkspace = workspaces.find((m) => m.key === selectedWorkspaceKey) || workspaces[0];
    const selectedWorkspaceChildren = selectedWorkspace?.children || [];

    const filteredMenu = useMemo(
        () => filterMenuItems(selectedWorkspaceChildren, searchTerm),
        [selectedWorkspaceChildren, searchTerm]
    );

    const shellClasses = [
        "solid-sidebar",
        isDesktop && isCollapsed ? "is-collapsed" : "",
        !isDesktop && visibleNavbar ? "is-open" : "",
    ]
        .filter(Boolean)
        .join(" ");

    const selectWorkspace = (workspace: SolidMenuItem) => {
        setSelectedWorkspaceKey(workspace.key || "");
        setSearchTerm("");
        setWorkspaceOpen(false);
    };

    return (
        <>
            <ToastContainer />
            {!isDesktop && visibleNavbar && <div className="solid-sidebar-backdrop" onClick={() => dispatch(toggleNavbar())} />}

            <aside className={shellClasses}>
                <div className="solid-sidebar-header">
                    <div className="solid-workspace-switcher">
                        <button
                            type="button"
                            className="solid-workspace-trigger"
                            onClick={() => setWorkspaceOpen((prev) => !prev)}
                            aria-label="Select workspace"
                        >
                            <span className="solid-workspace-avatar">
                                {(selectedWorkspace?.title || "W").slice(0, 1).toUpperCase()}
                            </span>
                            {!isCollapsed && (
                                <>
                                    <span className="solid-workspace-label-wrap">
                                        <span className="solid-workspace-label-top">Workspace</span>
                                        <span className="solid-workspace-label">{selectedWorkspace?.title || "Workspace"}</span>
                                    </span>
                                    <span className={`solid-workspace-chevron-dual ${workspaceOpen ? "is-open" : ""}`} aria-hidden="true">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M4 6L7 3L10 6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M4 8L7 11L10 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </>
                            )}
                        </button>

                        {workspaceOpen && !isCollapsed && (
                            <div className="solid-workspace-menu">
                                {workspaces.map((workspace) => (
                                    <button
                                        type="button"
                                        key={workspace.key || workspace.title}
                                        className={`solid-workspace-item ${workspace.key === selectedWorkspace?.key ? "is-active" : ""}`}
                                        onClick={() => selectWorkspace(workspace)}
                                    >
                                        <span className="solid-workspace-item-avatar">{workspace.title.slice(0, 1).toUpperCase()}</span>
                                        <span className="solid-workspace-item-label">{workspace.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {!isCollapsed ? (
                    <>
                        <div className="solid-sidebar-search-wrap">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search in menu..."
                                className="solid-sidebar-search"
                            />
                        </div>

                        <div className="solid-sidebar-tree-wrap">
                            <SidebarMenuTree items={filteredMenu} pathname={pathname} forceExpand={!!searchTerm.trim()} />
                        </div>
                    </>
                ) : (
                    <div className="solid-sidebar-collapsed-nav">
                        {filteredMenu.slice(0, 10).map((item) => (
                            <SolidLink
                                key={item.key || item.title}
                                href={item.path || "#"}
                                className={`solid-collapsed-item ${pathname === item.path ? "is-active" : ""}`}
                                title={item.title}
                            >
                                {item.title.slice(0, 1).toUpperCase()}
                            </SolidLink>
                        ))}
                    </div>
                )}

                <div className="solid-sidebar-footer">
                    <UserProfileMenu />
                </div>
            </aside>

            {isDesktop && isCollapsed && (
                <button
                    type="button"
                    className="solid-sidebar-hotspot"
                    onClick={() => setIsCollapsed(false)}
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                />
            )}
        </>
    );
};

export default AppSidebar;
