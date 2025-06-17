"use client"
import { deleteManyPermission, deletePermission } from "@/helpers/permissions";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Button } from "primereact/button";
import { Checkbox, CheckboxChangeEvent } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { OverlayPanel } from "primereact/overlaypanel";
import { RadioButton } from "primereact/radiobutton";
import { useEffect, useRef, useState } from "react";
import { SolidListColumnSelector } from "./SolidListColumnSelector";
import { SolidExport } from "@/components/common/SolidExport";
import { Dialog } from "primereact/dialog";
import { SolidListViewHeaderButton } from "./SolidListViewHeaderButton";
import { useHandleListCustomButtonClick } from "@/components/common/useHandleListCustomButtonClick";
import { SolidListViewHeaderContextMenuButton } from "./SolidListViewHeaderContextMenuButton";
import "../../common/solid-export.css";
import { SolidGenericImport } from "../common/SolidGenericImport/SolidGenericImport";

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
        handleFetchUpdatedRecords
    }:
        any) => {
    // const [visible, setVisible] = useState<boolean>(false);
    const handleCustomButtonClick = useHandleListCustomButtonClick();
    const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
    const op = useRef(null);
    const exportRef = useRef(null);
    const customizeLayout = useRef<OverlayPanel | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const [view, setView] = useState<string>("");
    const [exportView, setExportView] = useState<boolean>(false);

    const handleViewChange = (newView: string) => {
        if (view === newView) return; // Prevent unnecessary updates
        const pathSegments = pathname.split('/').filter(Boolean);
        pathSegments[pathSegments.length - 1] = newView; // Replace the last part with new view
        const newPath = '/' + pathSegments.join('/');
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


    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                customizeLayout.current &&
                !customizeLayout.current.getElement()?.contains(event.target as Node)
            ) {
                setIsOverlayOpen(false);
            }
        };

        if (isOverlayOpen) {
            document.addEventListener("click", handleClickOutside);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }

        return () => document.removeEventListener("click", handleClickOutside);
    }, [isOverlayOpen])

    return (
        <div className="position-relative">
            <Button
                type="button"
                size="small"
                icon="pi pi-cog"
                severity="secondary"
                outlined
                // @ts-ignore
                onClick={(e) => op.current.toggle(e)}
            />
            <Dialog header="Export" visible={exportView} className="ExportDialog p-0 m-0" onHide={() => { if (!exportView) return; setExportView(false); }}>
                <SolidExport listViewMetaData={listViewMetaData} filters= {filters} />
            </Dialog>
            <OverlayPanel ref={exportRef} className="listview-export-panel">

            </OverlayPanel>
            <OverlayPanel ref={op} className="listview-cogwheel-panel">
                <div className="p-2">
                    <div className="flex flex-column">
                        {actionsAllowed.includes(`${deleteManyPermission(params.modelName)}`) && viewData?.data?.solidView?.layout?.attrs?.delete !== false && selectedRecords.length > 0 &&
                            <Button
                                text
                                type="button"
                                className="text-left gap-2 text-base"
                                label="Delete"
                                size="small"
                                iconPos="left"
                                severity="danger"
                                icon={'pi pi-trash'}
                                onClick={() => setDialogVisible(true)}
                            />}
                        <Button text icon='pi pi-download' label="Import" size="small" severity="secondary" className="text-left gap-2 text-base"
                            onClick={() => setOpenImportDialog(true)}
                        />
                        <Button text icon='pi pi-upload' label="Export" size="small" severity="secondary" className="text-left gap-2 text-base"
                            // @ts-ignore
                            onClick={() => { setExportView((exportView) => !exportView); }} />
                        {/* <Button text icon='pi pi-share-alt' label="Share" size="small" severity="secondary" className="text-left gap-2" /> */}
                        {/* {viewData?.data?.solidView?.model?.enableSoftDelete &&
                        <Button text severity="secondary" size="small" className="text-left w-13rem" label={showArchived ? "Hide Archived Records" : "Show Archived Records"} iconPos="left" onClick={() => { setShowArchived(!showArchived); }} />
                        } */}
                        {solidListViewLayout?.attrs?.headerButtons
                            ?.filter((rb: any) => rb.attrs.actionInContextMenu === true)
                            ?.map((button: any, index: number) => (
                                <SolidListViewHeaderContextMenuButton
                                    key={index}
                                    button={button}
                                    params={params}
                                    solidListViewMetaData={listViewMetaData}
                                    handleCustomButtonClick={handleCustomButtonClick}
                                />
                            ))}
                        {viewData?.data?.solidView?.model?.enableSoftDelete && (
                            <div className="flex align-items-center px-3 gap-2 mt-2 mb-1">
                                <Checkbox
                                    inputId="showArchived"
                                    checked={showArchived}
                                    onChange={() => setShowArchived(!showArchived)}
                                />
                                <label htmlFor="showArchived" className="ml-2 text-base solid-secondary-text-color">
                                    Show Archived Records
                                </label>
                            </div>
                        )}
                    </div>
                </div>
                <Divider className="m-0" />
                <div className="p-2 relative flex flex-column gap-1">
                    <Button
                        icon='pi pi-sliders-h'
                        label="Customize Layout"
                        severity={isOverlayOpen ? undefined : "secondary"}
                        size="small"
                        text={isOverlayOpen ? false : true}
                        className="text-left gap-2 w-full text-base"
                        // @ts-ignore
                        onClick={(e) => {
                            customizeLayout.current?.toggle(e);
                            setIsOverlayOpen((prev) => !prev); // ✅ Ensure state updates when toggled
                        }}
                    >
                        <i className="pi pi-chevron-right text-sm"></i>
                    </Button>
                    <Button text icon='pi pi-save' label="Save Custom Filter" size="small" severity="secondary" className="text-left gap-2 text-base" onClick={() => setShowSaveFilterPopup(true)} />
                    {/* <p className="mt-3 mb-1 font-medium" style={{ color: 'var(--gray-400)' }}>Saved Layouts</p> */}
                    {/* <Button text severity="secondary" label="Diet Tracking" icon="pi pi-plus" size="small" /> */}
                    <OverlayPanel ref={customizeLayout} className="customize-layout-panel" style={{ minWidth: 250 }}
                        onShow={() => setIsOverlayOpen(true)}
                        onHide={() => {
                            setTimeout(() => setIsOverlayOpen(false), 50); // ✅ Ensure state updates
                        }}
                    >

                        <div className="solid-layout-accordion">
                            <Accordion multiple expandIcon="pi pi-chevron-down" collapseIcon="pi pi-chevron-up" activeIndex={[2]}>
                                {viewModes && viewModes.length > 0 &&
                                    <AccordionTab header="Switch Type">
                                        <div className="flex flex-column gap-1 p-1">
                                            {viewModes.map((option: any) => (
                                                <div key={option.value} className={`flex align-items-center ${option.value === view ? 'solid-active-view' : 'solid-view'}`}>
                                                    <RadioButton
                                                        inputId={option.value}
                                                        name="views"
                                                        value={option.value}
                                                        // onChange={(e) => router}
                                                        onChange={() => handleViewChange(option.value)}
                                                        checked={option.value === view}
                                                    />
                                                    <label htmlFor={option.value} className="ml-2 flex align-items-center justify-content-between w-full">
                                                        {option.label}
                                                        {/* <Image
                                                        src={option.image}
                                                        alt={option.value}
                                                        fill
                                                        className='relative row-spacing-img'
                                                    /> */}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionTab>
                                }
                                <AccordionTab header="Row Spacing">
                                    <div className="flex flex-column gap-1 p-1flex flex-column gap-1 p-1">
                                        {/* <p className="m-0 px-3">Row Spacing</p> */}
                                        {sizeOptions.map((option: any) => (
                                            <div key={option.value} className={`flex align-items-center ${option.value === size ? 'solid-active-view' : 'solid-view'}`}>
                                                <RadioButton
                                                    inputId={option.value}
                                                    name="sizes"
                                                    value={option.value}
                                                    onChange={(e) => setSize(e.value)}
                                                    checked={option.value === size}
                                                />
                                                <label htmlFor={option.value} className="ml-2 flex align-items-center justify-content-between w-full">
                                                    {option.label}
                                                    <Image
                                                        src={option.image}
                                                        alt={option.value}
                                                        fill
                                                        className='relative row-spacing-img'
                                                    />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionTab>
                                <AccordionTab header="Column Selector">
                                    <SolidListColumnSelector listViewMetaData={listViewMetaData} />
                                </AccordionTab>
                            </Accordion>
                        </div>
                    </OverlayPanel>
                </div>
            </OverlayPanel>
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