import { BackButton } from "@/components/common/BackButton";
import { SolidCancelButton } from "@/components/common/CancelButton";
import { SolidFormHeader } from "@/components/common/SolidFormHeader";
import { createPermission, deletePermission, updatePermission } from "@/helpers/permissions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { useRef } from "react";

export const SolidFormActionHeader = ({ formik, params, actionsAllowed, formViewLayout, solidView, solidFormViewMetaData, initialEntityData, setDeleteDialogVisible, setLayoutDialogVisible, setRedirectToList, viewMode, setViewMode }: any) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const op = useRef(null);
    const customLabel = formViewLayout?.attrs?.customLabel;
    const createHeaderTitle = customLabel || `Create ${solidView.model.displayName}`;
    const editHeaderTitle = customLabel || `Edit ${solidView.model.displayName}`;

    const updateViewMode = (newMode: "view" | "edit") => {
        setViewMode(newMode);
        const params = new URLSearchParams(searchParams.toString());
        params.set("viewMode", newMode);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };
    const FormActionDropdown = () => {
        return (
            <div>
                <Button
                    outlined
                    severity="secondary"
                    type="button"
                    icon={'pi pi-cog'}
                    size="small"
                    className="surface-card p-0"
                    style={{
                        height: 33.06,
                        width: 33.06
                    }}
                    onClick={(e) =>
                        // @ts-ignore 
                        op.current.toggle(e)
                    }
                />
                <OverlayPanel ref={op} className="solid-custom-overlay">
                    <div className="flex flex-column gap-1 p-1">
                        {/* <Button
                            text
                            type="button"
                            className="w-8rem text-left gap-2 text-color"
                            label="Duplicate"
                            size="small"
                            iconPos="left"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M6 11.9997C5.63333 11.9997 5.31944 11.8691 5.05833 11.608C4.79722 11.3469 4.66667 11.033 4.66667 10.6663V2.66634C4.66667 2.29967 4.79722 1.98579 5.05833 1.72467C5.31944 1.46356 5.63333 1.33301 6 1.33301H12C12.3667 1.33301 12.6806 1.46356 12.9417 1.72467C13.2028 1.98579 13.3333 2.29967 13.3333 2.66634V10.6663C13.3333 11.033 13.2028 11.3469 12.9417 11.608C12.6806 11.8691 12.3667 11.9997 12 11.9997H6ZM6 10.6663H12V2.66634H6V10.6663ZM3.33333 14.6663C2.96667 14.6663 2.65278 14.5358 2.39167 14.2747C2.13056 14.0136 2 13.6997 2 13.333V3.99967H3.33333V13.333H10.6667V14.6663H3.33333Z" fill="black" fill-opacity="0.88" />
                            </svg>}
                        /> */}
                        {params.embeded !== true &&
                            params.id !== "new" &&
                            actionsAllowed.includes(`${deletePermission(params.modelName)}`) &&
                            !formViewLayout.attrs.readonly &&
                            <Button
                                text
                                type="button"
                                className="w-8rem text-left gap-2"
                                label="Delete"
                                size="small"
                                iconPos="left"
                                severity="danger"
                                icon={'pi pi-trash'}
                                onClick={() => setDeleteDialogVisible(true)}
                            />
                        }
                        <Button
                            text
                            type="button"
                            className="w-8rem text-left gap-2 purple-200"
                            label="Layout"
                            size="small"
                            iconPos="left"
                            severity="contrast"
                            icon={'pi pi-objects-column'}
                            onClick={() => setLayoutDialogVisible(true)}
                        />
                    </div>
                </OverlayPanel>
            </div>
        )
    }

    return (
        <>
            <div className="solid-form-header">
                {params.id === "new" ? (
                    <>
                        <div className="flex align-items-center gap-3">
                            {params.embeded !== true && <BackButton />}
                            <div className="form-wrapper-title"> {createHeaderTitle}</div>
                        </div>
                        <div className="gap-3 flex">
                            {params.embeded !== true &&
                                actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
                                !formViewLayout.attrs.readonly &&
                                formik.dirty &&
                                <div>
                                    <Button
                                        label="Save"
                                        size="small"
                                        type="submit"
                                    />
                                </div>
                            }
                            {params.embeded == true &&
                                actionsAllowed.includes(`${createPermission(params.modelName)}`) &&
                                !formViewLayout.attrs.readonly &&
                                formik.dirty &&
                                <div>
                                    <Button
                                        label="Save"
                                        size="small"
                                        onClick={() => {
                                            setRedirectToList(false);
                                        }}
                                        type="submit"
                                    />
                                </div>
                            }
                            {params.embeded == true &&
                                <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse' />

                            }
                            {params.embeded !== true &&
                                <SolidCancelButton />
                            }
                            <FormActionDropdown />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex align-items-center gap-3">
                            {params.embeded !== true && <BackButton />}
                            <div className="form-wrapper-title"> {editHeaderTitle}</div>
                        </div>
                        <div className="gap-3 flex">
                            {params.embeded !== true && viewMode === "view" &&
                                <div>
                                    <Button
                                        label="Edit"
                                        size="small"
                                        onClick={() => updateViewMode("edit")}
                                        type="button"
                                    />
                                </div>
                            }

                            {params.embeded !== true &&
                                actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
                                !formViewLayout.attrs.readonly &&
                                formik.dirty &&
                                <div>
                                    <Button
                                        label="Save"
                                        size="small"
                                        type="submit"
                                    />
                                </div>
                            }

                            {/* Inline */}
                            {params.embeded == true &&
                                actionsAllowed.includes(`${updatePermission(params.modelName)}`) &&
                                !formViewLayout.attrs.readonly &&
                                formik.dirty &&
                                <div>
                                    <Button
                                        label="Save"
                                        size="small"
                                        type="submit"
                                    />
                                </div>
                            }
                            {params.embeded == true &&
                                actionsAllowed.includes(`${deletePermission(params.modelName)}`) &&
                                !formViewLayout.attrs.readonly &&
                                <div>
                                    <Button
                                        size="small"
                                        type="button"
                                        label="Delete"
                                        severity="danger"
                                        onClick={() => setDeleteDialogVisible(true)}
                                    />
                                </div>
                            }
                            {params.embeded == true &&
                                <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse' />

                            }
                            {params.embeded !== true &&
                                <SolidCancelButton />
                            }
                            <FormActionDropdown />
                        </div>
                    </>
                )}
            </div>
            {params.embeded !== true &&
                <SolidFormHeader
                    solidFormViewMetaData={solidFormViewMetaData}
                    initialEntityData={initialEntityData}
                    modelName={params.modelName}
                    id={params.id}
                />
            }
        </>
    )
}