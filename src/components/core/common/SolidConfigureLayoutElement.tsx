"use client"
import { Button } from "primereact/button";
import { Checkbox, CheckboxChangeEvent } from "primereact/checkbox";
import { Divider } from "primereact/divider";
import { OverlayPanel } from "primereact/overlaypanel";
import { useRef, useState } from "react";

interface FilterColumns {
    name: string;
    key: string;
}
export const SolidConfigureLayoutElement = ({ setShowArchived, showArchived, viewData }: any) => {

    // const [visible, setVisible] = useState<boolean>(false);
    const op = useRef(null);
    const customizeLayout = useRef(null);

    const categories: FilterColumns[] = [
        { name: 'ID', key: 'A' },
        { name: 'Tracker Date', key: 'M' },
        { name: 'Production', key: 'P' },
        { name: 'Research', key: 'R' }
    ];
    const [selectedCategories, setSelectedCategories] = useState<FilterColumns[]>([categories[1]]);

    const onCategoryChange = (e: CheckboxChangeEvent) => {
        let _selectedCategories = [...selectedCategories];

        if (e.checked)
            _selectedCategories.push(e.value);
        else
            _selectedCategories = _selectedCategories.filter(category => category.key !== e.value.key);

        setSelectedCategories(_selectedCategories);
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
            <OverlayPanel ref={op}>
                <div className="p-2">
                    <div className="flex flex-column">
                        <Button text icon='pi pi-download' label="Import" size="small" severity="secondary" className="text-left gap-2" />
                        <Button text icon='pi pi-upload' label="Export" size="small" severity="secondary" className="text-left gap-2" />
                        <Button text icon='pi pi-share-alt' label="Share" size="small" severity="secondary" className="text-left gap-2" />
                    </div>
                </div>
                <Divider className="m-0" />
                <div className="p-2 position-relative flex flex-column gap-1">
                    {viewData?.data?.solidView?.model?.enableSoftDelete &&
                        <Button text size="small" className="text-left w-13rem" label={showArchived ? "Hide Archived Records" : "Show Archived Records"} iconPos="left" onClick={() => { setShowArchived(!showArchived); }} />
                    }
                    <Button
                        icon='pi pi-sliders-h'
                        label="Customize Layout"
                        size="small"
                        className="text-left gap-2 w-13rem"
                        // @ts-ignore
                        onClick={(e) => customizeLayout.current.toggle(e)}
                    // onMouseEnter={(e) => customizeLayout.current.show(e)}
                    />
                    <p className="mt-3 mb-1 font-medium" style={{ color: 'var(--gray-400)' }}>Saved Layouts</p>
                    <Button text severity="secondary" label="Diet Tracking" icon="pi pi-plus" size="small" />
                    <OverlayPanel ref={customizeLayout} className="customize-layout-panel" style={{ minWidth: 250 }}>
                        <div className="pl-3 pt-2 flex align-items-center justify-content-between">
                            <p className="m-0 font-bold">Columns</p>
                            <Button text label="Save Layout" icon="pi pi-plus" />
                        </div>
                        <div className="flex flex-column gap-3 p-3">
                            {categories.map((category) => {
                                return (
                                    <div key={category.key} className="flex align-items-center gap-1">
                                        <Checkbox
                                            inputId={category.key}
                                            name="category"
                                            value={category}
                                            onChange={onCategoryChange}
                                            checked={selectedCategories.some((item) => item.key === category.key)}
                                        />
                                        <label htmlFor={category.key} className="ml-2">
                                            {category.name}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                        <Divider className="m-0" />
                        <div className="p-3 flex gap-2">
                            <Button label="Apply" size="small" />
                            <Button outlined label="Cancel" size="small" />
                        </div>
                    </OverlayPanel>
                </div>
            </OverlayPanel>
        </div>
    )
}