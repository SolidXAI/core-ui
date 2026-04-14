import { useSession } from "../../../hooks/useSession";
import { permissionExpression } from "../../../helpers/permissions";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import { useEffect, useRef, useState } from "react";
import { SolidListColumnSelector } from "./SolidColumnSelector/SolidListColumnSelector";
import { SolidExport } from "../../../components/common/SolidExport";
import { useHandleListCustomButtonClick } from "../../../components/common/useHandleListCustomButtonClick";
import { SolidListViewHeaderContextMenuButton } from "./SolidListViewHeaderContextMenuButton";
import "../../common/solid-export.css";
import { SolidGenericImport } from "../common/SolidGenericImport/SolidGenericImport";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { SolidListViewHeaderButton } from "./SolidListViewHeaderButton";
import { capitalize } from "lodash";
import { Cog, Download, RefreshCw, Save, SlidersHorizontal, Table, Trash2, Upload } from "lucide-react";
import {
    SolidDialog,
    SolidDialogBody,
    SolidDialogClose,
    SolidDialogDescription,
    SolidDialogHeader,
    SolidDialogSeparator,
    SolidDialogTitle,
    SolidDropdownMenu,
    SolidDropdownMenuCheckboxItem,
    SolidDropdownMenuContent,
    SolidDropdownMenuItem,
    SolidDropdownMenuLabel,
    SolidDropdownMenuRadioGroup,
    SolidDropdownMenuRadioItem,
    SolidDropdownMenuSeparator,
    SolidDropdownMenuSub,
    SolidDropdownMenuSubContent,
    SolidDropdownMenuSubTrigger,
    SolidDropdownMenuTrigger,
} from "../../shad-cn-ui";

export type ViewMode = {
    actionId: string;
    actionName: string;
    menuItemId: string;
    menuItemName: string;
    type: string;
}

export const SolidListViewConfigure = (
    { listViewMetaData,
        solidListViewLayout,
        setShowArchived,
        showArchived,
        viewData,
        sizeOptions,
        setSize,
        size,
        viewModes,
        params,
        actionsAllowed,
        selectedRecords,
        setDialogVisible,
        setShowSaveFilterPopup,
        filters,
        handleFetchUpdatedRecords,
        setRecoverDialogVisible,

    }:
        any) => {
    // const [visible, setVisible] = useState<boolean>(false);
    const handleCustomButtonClick = useHandleListCustomButtonClick();
    const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
    const pathname = usePathname();
    const router = useRouter();
    const [view, setView] = useState<string>("");
    const [exportView, setExportView] = useState<boolean>(false);
    const [isCogMenuOpen, setIsCogMenuOpen] = useState(false);
    const [showColumnSelectorDialog, setShowColumnSelectorDialog] = useState(false);

    const handleViewChange = (newView: ViewMode) => {
        if (view === newView.type) return; // Prevent unnecessary updates
        const pathSegments = pathname.split('/').filter(Boolean);
        pathSegments[pathSegments.length - 1] = newView.type; // Replace the last part with new view
        const newPath = '/' + pathSegments.join('/') + `?menuItemId=${newView.menuItemId}&menuItemName=${newView.menuItemName}&actionId=${newView.actionId}&actionName=${newView.actionName}`;
        router.push(newPath);
    };

    useEffect(() => {
        if (typeof pathname === 'string') {
            const pathSegments = pathname.split('/').filter(Boolean);
            if (pathSegments.length > 0) {
                setView(pathSegments[pathSegments.length - 1]);
            }
        }
    }, [])

    //Build a map of actionKey → boolean at the top level
    const headerActions = solidListViewLayout?.attrs ?? {};

    const normalizeAction = (value: boolean | string[]) => {
        if (value === true) return { enabled: true, roles: [] };
        if (value === false) return { enabled: false, roles: [] };
        if (Array.isArray(value)) return { enabled: true, roles: value };
        return { enabled: true, roles: [] }; // default
    };
    const normalized = {
        import: normalizeAction(headerActions.import),
        export: normalizeAction(headerActions.export),
        customizeLayout: normalizeAction(headerActions.customizeLayout),
        savedFilters: normalizeAction(headerActions.savedFilters),
    };

    // Role checks
    const { data: session, status } = useSession();
    const user = session?.user;
    const useRoleCheck = (roles: string[]) => hasAnyRole(user?.roles, roles);

    // Map of action → roleCheck
    const roleCheckMap = {
        import: useRoleCheck(normalized.import.roles),
        export: useRoleCheck(normalized.export.roles),
        customizeLayout: useRoleCheck(normalized.customizeLayout.roles),
        savedFilters: useRoleCheck(normalized.savedFilters.roles),
    };

    const isHeaderActionEnabled = (action: keyof typeof normalized) => {
        const { enabled, roles } = normalized[action];

        // 1. If explicitly disabled
        if (!enabled) return false;

        // 2. If roles list exists → must have at least one
        if (roles.length > 0) {
            return roleCheckMap[action] === true;
        }
        // 3. No restrictions → enabled
        return true;
    };

    const clearLocalstorageCache = () => {
        const currentPageUrl = window.location.pathname; // Get the current page URL
        localStorage.removeItem(currentPageUrl); // Remove from local storage with the URL as the key
        window.location.reload();
    };

    const visibleViewModes = Array.isArray(viewModes) ? viewModes : [];
    const showSwitchType = visibleViewModes.length > 1;
    const handleViewTypeChange = (nextType: string) => {
        const nextView = visibleViewModes.find((option: ViewMode) => option.type === nextType);
        if (nextView) {
            handleViewChange(nextView);
        }
    };

    return (
        <div className="position-relative">
            <SolidDropdownMenu open={isCogMenuOpen} onOpenChange={setIsCogMenuOpen}>
                <SolidDropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="solid-icon-button solid-header-cog-trigger"
                        aria-label="Open list options"
                    >
                        <Cog size={16} />
                    </button>
                </SolidDropdownMenuTrigger>
                <SolidDropdownMenuContent className="listview-cogwheel-panel">
                    {(
                        (actionsAllowed.includes(`${permissionExpression(params.modelName, 'deleteMany')}`) &&
                            viewData?.data?.solidView?.layout?.attrs?.delete !== false &&
                            selectedRecords.length > 0) ||
                        isHeaderActionEnabled('import') && actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) && actionsAllowed.includes(`${permissionExpression('importTransaction', 'create')}`) ||
                        isHeaderActionEnabled('export') && actionsAllowed.includes(`${permissionExpression(params.modelName, 'findMany')}`) && actionsAllowed.includes(`${permissionExpression('exportTransaction', 'create')}`) ||
                        isHeaderActionEnabled('customizeLayout') && actionsAllowed.includes(`${permissionExpression('userViewMetadata', 'create')}`) ||
                        isHeaderActionEnabled('savedFilters') && actionsAllowed.includes(`${permissionExpression('savedFilters', 'create')}`) ||
                        (solidListViewLayout?.attrs?.headerButtons
                            ?.some((rb: any) => rb.attrs.actionInContextMenu === true)) ||
                        viewData?.data?.solidView?.model?.enableSoftDelete
                    ) && (
                        <>
                            {actionsAllowed.includes(`${permissionExpression(params.modelName, 'deleteMany')}`) && viewData?.data?.solidView?.layout?.attrs?.delete !== false && selectedRecords.length > 0 && (
                                <SolidDropdownMenuItem
                                    className="solid-header-dropdown-item solid-header-dropdown-item-danger"
                                    onSelect={() => {
                                        setDialogVisible(true);
                                        setIsCogMenuOpen(false);
                                    }}
                                >
                                    <Trash2 size={14} className="solid-header-action-button-icon" />
                                    <span className="solid-header-action-button-label">Delete</span>
                                </SolidDropdownMenuItem>
                            )}
                            {isHeaderActionEnabled("import") && actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) && actionsAllowed.includes(`${permissionExpression('importTransaction', 'create')}`) && (
                                <SolidDropdownMenuItem
                                    className="solid-header-dropdown-item"
                                    onSelect={() => {
                                        setOpenImportDialog(true);
                                        setIsCogMenuOpen(false);
                                    }}
                                >
                                    <Download size={14} className="solid-header-action-button-icon" />
                                    <span className="solid-header-action-button-label">Import</span>
                                </SolidDropdownMenuItem>
                            )}
                            {isHeaderActionEnabled("export") && actionsAllowed.includes(`${permissionExpression(params.modelName, 'findMany')}`) && actionsAllowed.includes(`${permissionExpression('exportTransaction', 'create')}`) && (
                                <SolidDropdownMenuItem
                                    className="solid-header-dropdown-item"
                                    onSelect={() => {
                                        setExportView((current) => !current);
                                        setIsCogMenuOpen(false);
                                    }}
                                >
                                    <Upload size={14} className="solid-header-action-button-icon" />
                                    <span className="solid-header-action-button-label">Export</span>
                                </SolidDropdownMenuItem>
                            )}
                            {solidListViewLayout?.attrs?.headerButtons
                                ?.filter((rb: any) => rb.attrs.actionInContextMenu === true)
                                ?.map((button: any, index: number) => (
                                    <SolidListViewHeaderContextMenuButton
                                        key={index}
                                        button={button}
                                        params={params}
                                        solidListViewMetaData={listViewMetaData}
                                        handleCustomButtonClick={handleCustomButtonClick}
                                        onActionComplete={() => setIsCogMenuOpen(false)}
                                    />
                                ))}
                            {viewData?.data?.solidView?.model?.enableSoftDelete && (
                                <SolidDropdownMenuCheckboxItem
                                    checked={showArchived}
                                    onCheckedChange={() => setShowArchived(!showArchived)}
                                >
                                    Show Archived Records
                                </SolidDropdownMenuCheckboxItem>
                            )}
                            {showArchived && (
                                <SolidDropdownMenuItem
                                    className="solid-header-dropdown-item lg:hidden"
                                    onSelect={() => {
                                        setRecoverDialogVisible(true);
                                        setIsCogMenuOpen(false);
                                    }}
                                >
                                    <RefreshCw size={14} className="solid-header-action-button-icon" />
                                    <span className="solid-header-action-button-label">Recover</span>
                                </SolidDropdownMenuItem>
                            )}

                            {(
                                isHeaderActionEnabled('customizeLayout') && actionsAllowed.includes(`${permissionExpression('userViewMetadata', 'create')}`) ||
                                isHeaderActionEnabled('savedFilters') && actionsAllowed.includes(`${permissionExpression('savedFilters', 'create')}`) ||
                                true
                            ) && <SolidDropdownMenuSeparator />}

                            {isHeaderActionEnabled('customizeLayout') && actionsAllowed.includes(`${permissionExpression('userViewMetadata', 'create')}`) && (
                                <SolidDropdownMenuSub>
                                    <SolidDropdownMenuSubTrigger className="solid-header-dropdown-item">
                                        <SlidersHorizontal size={14} className="solid-header-action-button-icon" />
                                        <span className="solid-header-action-button-label">Customize Layout</span>
                                    </SolidDropdownMenuSubTrigger>
                                    <SolidDropdownMenuSubContent className="customize-layout-panel">
                                        {showSwitchType && (
                                            <>
                                                <SolidDropdownMenuLabel>Switch Type</SolidDropdownMenuLabel>
                                                <SolidDropdownMenuRadioGroup value={view} onValueChange={handleViewTypeChange}>
                                                    {visibleViewModes.map((option: ViewMode) => (
                                                        <SolidDropdownMenuRadioItem key={option.type} value={option.type}>
                                                            {capitalize(option.type)}
                                                        </SolidDropdownMenuRadioItem>
                                                    ))}
                                                </SolidDropdownMenuRadioGroup>
                                                <SolidDropdownMenuSeparator />
                                            </>
                                        )}
                                        <SolidDropdownMenuLabel>Row Spacing</SolidDropdownMenuLabel>
                                        <SolidDropdownMenuRadioGroup value={size} onValueChange={(value: string) => setSize(value)}>
                                            {sizeOptions.map((option: any) => (
                                                <SolidDropdownMenuRadioItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SolidDropdownMenuRadioItem>
                                            ))}
                                        </SolidDropdownMenuRadioGroup>
                                        <SolidDropdownMenuSeparator />
                                        <SolidDropdownMenuItem
                                            onSelect={() => {
                                                setShowColumnSelectorDialog(true);
                                                setIsCogMenuOpen(false);
                                            }}
                                        >
                                            <Table size={14} className="solid-header-action-button-icon" />
                                            <span className="solid-header-action-button-label">Column Selector</span>
                                        </SolidDropdownMenuItem>
                                    </SolidDropdownMenuSubContent>
                                </SolidDropdownMenuSub>
                            )}
                            {isHeaderActionEnabled('savedFilters') && actionsAllowed.includes(`${permissionExpression('savedFilters', 'create')}`) && (
                                <SolidDropdownMenuItem
                                    className="solid-header-dropdown-item"
                                    onSelect={() => {
                                        setShowSaveFilterPopup(true);
                                        setIsCogMenuOpen(false);
                                    }}
                                >
                                    <Save size={14} className="solid-header-action-button-icon" />
                                    <span className="solid-header-action-button-label">Save Custom Filter</span>
                                </SolidDropdownMenuItem>
                            )}
                            <SolidDropdownMenuItem
                                className="solid-header-dropdown-item"
                                onSelect={() => {
                                    clearLocalstorageCache();
                                    setIsCogMenuOpen(false);
                                }}
                            >
                                <Trash2 size={14} className="solid-header-action-button-icon" />
                                <span className="solid-header-action-button-label">Clear cache</span>
                            </SolidDropdownMenuItem>
                        </>
                    )}
                </SolidDropdownMenuContent>
            </SolidDropdownMenu>
            <SolidDialog
                open={exportView}
                onOpenChange={setExportView}
                className="solid-kanban-export-dialog solid-list-export-dialog"
                style={{ width: "min(980px, calc(100vw - 32px))" }}
            >
                <SolidDialogHeader className="solid-export-dialog-header">
                    <div>
                        <SolidDialogTitle>Export</SolidDialogTitle>
                        <SolidDialogDescription className="solid-filter-dialog-subtitle m-0">
                            Choose the file format, refine the field set, and save reusable export templates.
                        </SolidDialogDescription>
                    </div>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogSeparator />
                <SolidDialogBody className="solid-kanban-export-dialog-body">
                    <SolidExport listViewMetaData={listViewMetaData} filters={filters} />
                </SolidDialogBody>
            </SolidDialog>
            <SolidDialog
                open={showColumnSelectorDialog}
                onOpenChange={setShowColumnSelectorDialog}
                className="solid-column-selector-dialog"
                style={{ width: "min(388px, calc(100vw - 2rem))" }}
            >
                <SolidDialogHeader className="solid-filter-dialog-head">
                    <div>
                        <SolidDialogTitle className="solid-filter-dialog-title m-0">Column Selector</SolidDialogTitle>
                        <SolidDialogDescription className="solid-filter-dialog-subtitle m-0">
                            Choose visible columns and reorder them for this list view.
                        </SolidDialogDescription>
                    </div>
                    <SolidDialogClose className="solid-filter-dialog-close" />
                </SolidDialogHeader>
                <SolidDialogSeparator className="solid-filter-dialog-sep" />
                <SolidDialogBody className="solid-filter-dialog-body">
                    <SolidListColumnSelector
                        listViewMetaData={listViewMetaData}
                        onClose={() => setShowColumnSelectorDialog(false)}
                    />
                </SolidDialogBody>
            </SolidDialog>
            {openImportDialog &&
                <SolidGenericImport
                    openImportDialog={openImportDialog}
                    setOpenImportDialog={setOpenImportDialog}
                    listViewMetaData={listViewMetaData}
                    handleFetchUpdatedRecords={handleFetchUpdatedRecords}
                />
            }
        </div>
    )
}
