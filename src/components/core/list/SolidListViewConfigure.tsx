"use client"
import { deleteManyPermission, deletePermission } from "@/helpers/permissions";
import Image from "next/image";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Button } from "primereact/button";
import { Checkbox, CheckboxChangeEvent } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { OverlayPanel } from "primereact/overlaypanel";
import { RadioButton } from "primereact/radiobutton";
import { useEffect, useRef, useState } from "react";

interface FilterColumns {
    name: string;
    key: string;
}
export const SolidListViewConfigure = ({ listViewMetaData, setShowArchived, showArchived, viewData, sizeOptions, setSize, size, viewModes, setView, view, params, actionsAllowed, selectedRecords, setDialogVisible }: any) => {
    if (!listViewMetaData) {
        return;
    }
    if (!listViewMetaData.data) {
        return;
    }

    const solidView = listViewMetaData?.data?.solidView;

    // This is a key value map of field name vs field metadata.
    const solidFieldsMetadata = listViewMetaData?.data?.solidFieldsMetadata;

    // const [visible, setVisible] = useState<boolean>(false);
    const op = useRef(null);
    const customizeLayout = useRef<OverlayPanel | null>(null);
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

    if (!solidView || !solidFieldsMetadata) {
        return;
    }

    const solidListColumns: FilterColumns[] = solidView?.layout?.children?.map((column: { attrs: { name: string } }) => ({
        name: solidFieldsMetadata[column?.attrs?.name]?.displayName,
        key: column?.attrs?.name,
    }));
    const [selectedColumns, setSelectedColumns] = useState<FilterColumns[]>([]);

    const onCategoryChange = (e: CheckboxChangeEvent) => {
        let _selectedColumns = [...selectedColumns];

        if (e.checked)
            _selectedColumns.push(e.value);
        else
            _selectedColumns = _selectedColumns.filter(column => column.key !== e.value.key);

        setSelectedColumns(_selectedColumns);
    };

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
                        <Button text icon='pi pi-download' label="Import" size="small" severity="secondary" className="text-left gap-2 text-base" />
                        <Button text icon='pi pi-upload' label="Export" size="small" severity="secondary" className="text-left gap-2 text-base" />
                        {/* <Button text icon='pi pi-share-alt' label="Share" size="small" severity="secondary" className="text-left gap-2" /> */}
                        {/* {viewData?.data?.solidView?.model?.enableSoftDelete &&
                            <Button text severity="secondary" size="small" className="text-left w-13rem" label={showArchived ? "Hide Archived Records" : "Show Archived Records"} iconPos="left" onClick={() => { setShowArchived(!showArchived); }} />
                        } */}
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
                    {/* <p className="mt-3 mb-1 font-medium" style={{ color: 'var(--gray-400)' }}>Saved Layouts</p> */}
                    {/* <Button text severity="secondary" label="Diet Tracking" icon="pi pi-plus" size="small" /> */}
                    <OverlayPanel ref={customizeLayout} className="customize-layout-panel" style={{ minWidth: 250 }}
                        onShow={() => setIsOverlayOpen(true)}
                        onHide={() => {
                            console.log("Overlay closed");
                            setTimeout(() => setIsOverlayOpen(false), 50); // ✅ Ensure state updates
                        }}
                    >
                        <div className="solid-layout-accordion">
                            <Accordion multiple expandIcon="pi pi-chevron-down" collapseIcon="pi pi-chevron-up" activeIndex={[2]}>
                                <AccordionTab header="Switch Type">
                                    <div className="flex flex-column gap-1 p-1">
                                        {viewModes.map((option: any) => (
                                            <div key={option.value} className={`flex align-items-center ${option.value === view ? 'solid-active-view' : 'solid-view'}`}>
                                                <RadioButton
                                                    inputId={option.value}
                                                    name="views"
                                                    value={option.value}
                                                    onChange={(e) => setView(e.value)}
                                                    checked={option.value === view}
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
                                    <div className="flex flex-column gap-1 p-1">
                                        <div className="flex flex-column gap-3 px-3 cogwheel-column-filter">
                                            {solidListColumns.map((column) => {
                                                return (
                                                    <div key={column.key} className="flex align-items-center gap-1">
                                                        <Checkbox
                                                            inputId={column.key}
                                                            name="column"
                                                            value={column}
                                                            onChange={onCategoryChange}
                                                            checked={selectedColumns.some((item) => item.key === column.key)}
                                                            className="text-base"
                                                        />
                                                        <label htmlFor={column.key} className="ml-2 text-base">
                                                            {column.name}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="p-3 flex gap-2">
                                            <Button label="Apply" size="small" />
                                            <Button outlined label="Cancel" size="small"
                                                // @ts-ignore
                                                onClick={(e) => op.current.hide(e)}
                                            />
                                        </div>
                                    </div>
                                </AccordionTab>
                            </Accordion>
                        </div>
                    </OverlayPanel>
                </div>
            </OverlayPanel>
        </div>
    )
}