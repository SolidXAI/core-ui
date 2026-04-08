import { permissionExpression } from "../../../helpers/permissions";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import { useEffect, useState } from "react";
import { SolidExport } from "../../../components/common/SolidExport";
import { SolidGenericImport } from "../common/SolidGenericImport/SolidGenericImport";
import {
    SolidDropdownMenu,
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
    SolidDialog,
    SolidDialogBody,
    SolidDialogClose,
    SolidDialogHeader,
    SolidDialogSeparator,
    SolidDialogTitle,
} from "../../shad-cn-ui";

const normalizeViewModes = (viewModes: any[] = []) => {
    return viewModes
        .map((option: any) => {
            if (!option) return null;

            if (typeof option === "string") {
                return {
                    type: option,
                    label: option.charAt(0).toUpperCase() + option.slice(1),
                };
            }

            const type = option.type || option.value;
            if (!type) return null;

            return {
                ...option,
                type,
                label: option.label || (type.charAt(0).toUpperCase() + type.slice(1)),
            };
        })
        .filter(Boolean);
};

export const SolidKanbanViewConfigure = ({
    solidKanbanViewMetaData,
    modelName,
    actionsAllowed,
    setLayoutDialogVisible,
    viewModes,
    setShowSaveFilterPopup,
    filters,
    handleRefreshView,
}: any) => {
    const pathname = usePathname();
    const router = useRouter();
    const [view, setView] = useState<string>("");
    const [isCogMenuOpen, setIsCogMenuOpen] = useState(false);
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const [exportView, setExportView] = useState(false);

    const visibleViewModes = normalizeViewModes(Array.isArray(viewModes) ? viewModes : []);
    const showSwitchType = visibleViewModes.length > 1;
    const layoutAttrs = solidKanbanViewMetaData?.data?.solidView?.layout?.attrs ?? {};

    useEffect(() => {
        if (typeof pathname === "string") {
            const pathSegments = pathname.split("/").filter(Boolean);
            if (pathSegments.length > 0) {
                setView(pathSegments[pathSegments.length - 1]);
            }
        }
    }, [pathname]);

    const handleViewChange = (newView: string) => {
        if (view === newView) return;
        const pathSegments = pathname.split("/").filter(Boolean);
        pathSegments[pathSegments.length - 1] = newView;
        const newPath = "/" + pathSegments.join("/");
        router.push(newPath);
    };

    const clearLocalstorageCache = () => {
        const currentPageUrl = window.location.pathname;
        localStorage.removeItem(currentPageUrl);
        window.location.reload();
    };

    const canImport =
        Boolean(modelName) &&
        actionsAllowed.includes(`${permissionExpression(modelName, "create")}`) &&
        actionsAllowed.includes(`${permissionExpression("importTransaction", "create")}`);

    const canExport =
        Boolean(modelName) &&
        actionsAllowed.includes(`${permissionExpression(modelName, "findMany")}`) &&
        actionsAllowed.includes(`${permissionExpression("exportTransaction", "create")}`);

    const canCustomizeLayout = actionsAllowed.includes(`${permissionExpression("userViewMetadata", "create")}`);
    const canSaveCustomFilter = actionsAllowed.includes(`${permissionExpression("savedFilters", "create")}`);

    return (
        <div className="position-relative">
            <SolidDropdownMenu open={isCogMenuOpen} onOpenChange={setIsCogMenuOpen}>
                <SolidDropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="solid-icon-button solid-header-cog-trigger"
                        aria-label="Open kanban options"
                    >
                        <i className="pi pi-cog" />
                    </button>
                </SolidDropdownMenuTrigger>
                <SolidDropdownMenuContent className="listview-cogwheel-panel">
                    {canImport && (
                        <SolidDropdownMenuItem
                            className="solid-header-dropdown-item"
                            onSelect={() => {
                                setOpenImportDialog(true);
                                setIsCogMenuOpen(false);
                            }}
                        >
                            <i className="pi pi-download solid-header-action-button-icon" />
                            <span className="solid-header-action-button-label">Import</span>
                        </SolidDropdownMenuItem>
                    )}

                    {canExport && (
                        <SolidDropdownMenuItem
                            className="solid-header-dropdown-item"
                            onSelect={() => {
                                setExportView(true);
                                setIsCogMenuOpen(false);
                            }}
                        >
                            <i className="pi pi-upload solid-header-action-button-icon" />
                            <span className="solid-header-action-button-label">Export</span>
                        </SolidDropdownMenuItem>
                    )}

                    {(canCustomizeLayout || canSaveCustomFilter) && <SolidDropdownMenuSeparator />}

                    {canCustomizeLayout && (
                        <SolidDropdownMenuSub>
                            <SolidDropdownMenuSubTrigger className="solid-header-dropdown-item">
                                <i className="pi pi-sliders-h solid-header-action-button-icon" />
                                <span className="solid-header-action-button-label">Customize Layout</span>
                            </SolidDropdownMenuSubTrigger>
                            <SolidDropdownMenuSubContent className="customize-layout-panel">
                                {showSwitchType && (
                                    <>
                                        <SolidDropdownMenuLabel>Switch Type</SolidDropdownMenuLabel>
                                        <SolidDropdownMenuRadioGroup value={view} onValueChange={handleViewChange}>
                                            {visibleViewModes.map((option: any) => (
                                                <SolidDropdownMenuRadioItem key={option.type} value={option.type}>
                                                    {option.label}
                                                </SolidDropdownMenuRadioItem>
                                            ))}
                                        </SolidDropdownMenuRadioGroup>
                                        <SolidDropdownMenuSeparator />
                                    </>
                                )}
                                <SolidDropdownMenuItem
                                    onSelect={() => {
                                        setLayoutDialogVisible(true);
                                        setIsCogMenuOpen(false);
                                    }}
                                >
                                    <i className="pi pi-code solid-header-action-button-icon" />
                                    <span className="solid-header-action-button-label">Layout Editor</span>
                                </SolidDropdownMenuItem>
                            </SolidDropdownMenuSubContent>
                        </SolidDropdownMenuSub>
                    )}

                    {canSaveCustomFilter && (
                        <SolidDropdownMenuItem
                            className="solid-header-dropdown-item"
                            onSelect={() => {
                                setShowSaveFilterPopup(true);
                                setIsCogMenuOpen(false);
                            }}
                        >
                            <i className="pi pi-save solid-header-action-button-icon" />
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
                        <i className="pi pi-trash solid-header-action-button-icon" />
                        <span className="solid-header-action-button-label">Clear cache</span>
                    </SolidDropdownMenuItem>
                </SolidDropdownMenuContent>
            </SolidDropdownMenu>

            <SolidDialog
                open={exportView}
                onOpenChange={setExportView}
                className="solid-kanban-export-dialog"
                style={{ width: "min(960px, calc(100vw - 32px))" }}
            >
                <SolidDialogHeader className="solid-export-dialog-header">
                    <SolidDialogTitle>Export</SolidDialogTitle>
                    <SolidDialogClose />
                </SolidDialogHeader>
                <SolidDialogSeparator />
                <SolidDialogBody className="solid-kanban-export-dialog-body">
                    <SolidExport listViewMetaData={solidKanbanViewMetaData} filters={filters} />
                </SolidDialogBody>
            </SolidDialog>

            {openImportDialog && (
                <SolidGenericImport
                    openImportDialog={openImportDialog}
                    setOpenImportDialog={setOpenImportDialog}
                    listViewMetaData={solidKanbanViewMetaData}
                    handleFetchUpdatedRecords={handleRefreshView}
                />
            )}
        </div>
    );
};
