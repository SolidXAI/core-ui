"use client"
import { BackButton } from "@/components/common/BackButton";
import { SolidCancelButton } from "@/components/common/CancelButton";
import { SolidFormHeader } from "@/components/common/SolidFormHeader";
import { useHandleFormCustomButtonClickaction } from "@/components/common/useHandleFormCustomButtonClick";
import { permissionExpression } from "@/helpers/permissions";
import { getExtensionFunction } from "@/helpers/registry";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { useEffect, useRef, useState } from "react";
import { SolidFormViewNormalHeaderButton } from "./SolidFormViewNormalHeaderButton";
import { SolidFormViewContextMenuHeaderButton } from "./SolidFormViewContextMenuHeaderButton";
import { hasAnyRole } from "@/helpers/rolesHelper";
import { useSelector } from "react-redux";

export const SolidFormActionHeader = ({ formik, params, actionsAllowed, formViewLayout, solidView, solidFormViewMetaData, initialEntityData, setDeleteDialogVisible, setLayoutDialogVisible, setRedirectToList, viewMode, setViewMode, solidWorkflowFieldValue, setSolidWorkflowFieldValue, internationalisationEnabled, handleDraftPublishWorkFlow, publish, draftEnabled }: any) => {
    const handleCustomButtonClick = useHandleFormCustomButtonClickaction();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const op = useRef(null);
    const [contextMenuHeaderButtons, setContextMenuHeaderButtons] = useState<any>([]);
    const [normalHeaderButtons, setNormalHeaderButtons] = useState<any>([]);
    const createHeaderTitle = `Create ${solidView.model.displayName}`;
    const editHeaderTitle = `Edit ${solidView.model.displayName}`;

    const { user } = useSelector((state: any) => state.auth);

    const isPublished = publish !== null;   // record is published if publish has value

    useEffect(() => {
        if (solidView) {
            let contextMenuHeaderButtonsData: any = [];
            let normalHeaderButtonsData: any = [];
            const formHeaderButtons = formViewLayout?.attrs?.formButtons;
            if (formHeaderButtons && formHeaderButtons.length > 0) {

                // Process normal header buttons
                contextMenuHeaderButtonsData = formHeaderButtons.filter((button: any) => {
                    const visibleToRole = button.attrs?.roles || [];
                    const defaultVisible = button.attrs?.visible;
                    if (defaultVisible === false) {
                        return false;
                    }
                    if (visibleToRole.length > 0) {
                        if (!hasAnyRole(user?.user?.roles, visibleToRole)) {
                            return false;
                        }
                    }
                    return button.attrs && button.attrs.actionInContextMenu && button.attrs.actionInContextMenu === true;
                });
                setContextMenuHeaderButtons(contextMenuHeaderButtonsData)

                // Process normal header buttons
                normalHeaderButtonsData = formHeaderButtons.filter((button: any) => {
                    const visibleToRole = button.attrs?.roles || [];
                    if (visibleToRole.length > 0) {
                        if (!hasAnyRole(user?.user?.roles, visibleToRole)) {
                            return false;
                        }
                    }

                    return !button.attrs || !button.attrs.actionInContextMenu || button.attrs.actionInContextMenu === false;
                });
                setNormalHeaderButtons(normalHeaderButtonsData);
            }
        }
    }, []);

    const updateViewMode = (newMode: "view" | "edit") => {
        setViewMode(newMode);
        const params = new URLSearchParams(searchParams.toString());
        params.set("viewMode", newMode);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
        // const router = useRouter();
        // const pathname = usePathname();
        // const params = new URLSearchParams(searchParams?.toString() || "");
        // params.set("viewMode", newMode);
        // router.push(`${pathname}?${params.toString()}`, { scroll: false });

    };
    const FormActionDropdown = () => {
        const canPublish = actionsAllowed.includes(permissionExpression(params.modelName, 'publish'));
        const canUnpublish = actionsAllowed.includes(permissionExpression(params.modelName, 'unpublish'));

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
                        {params.embeded !== true &&
                            params.id !== "new" &&
                            actionsAllowed.includes(`${permissionExpression(params.modelName, 'delete')}`) &&
                            !isPublished &&
                            solidView?.layout?.attrs?.showDeleteFormButton !== false &&
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
                        {draftEnabled && params.id !== 'new' && (
                            <>
                                {!isPublished && canPublish && (
                                    <Button
                                        text
                                        type="button"
                                        className="w-8rem text-left gap-2 purple-200"
                                        label="Publish"
                                        size="small"
                                        iconPos="left"
                                        severity="contrast"
                                        icon="pi pi-cloud-upload"
                                        onClick={() => handleDraftPublishWorkFlow('publish')}
                                    />
                                )}

                                {isPublished && canUnpublish && (
                                    <Button
                                        text
                                        type="button"
                                        className="w-8rem text-left gap-2 purple-200"
                                        label="Unpublish"
                                        size="small"
                                        iconPos="left"
                                        severity="contrast"
                                        icon="pi pi-cloud-download"
                                        onClick={() => handleDraftPublishWorkFlow('unpublish')}
                                    />
                                )}
                            </>
                        )}


                        {contextMenuHeaderButtons.map((button: any, index: number) => {
                            return (
                                <SolidFormViewContextMenuHeaderButton
                                    key={index}
                                    button={button}
                                    params={params}
                                    formik={formik}
                                    solidFormViewMetaData={solidFormViewMetaData}
                                    handleCustomButtonClick={handleCustomButtonClick}
                                />

                            )
                        })
                        }

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
                            {normalHeaderButtons.map((button: any, index: number) => {
                                return (
                                    // <Button
                                    //     text
                                    //     type="button"
                                    //     className="w-full text-left gap-2"
                                    //     label={button.attrs.label}
                                    //     size="small"
                                    //     iconPos="left"
                                    //     severity="contrast"
                                    //     icon={button?.attrs?.className ? button?.attrs?.className : "pi pi-pencil"}
                                    //     onClick={() => {
                                    //         const event = {
                                    //             action: button.attrs.action,
                                    //             params,
                                    //             formik,
                                    //             solidFormViewMetaData: solidFormViewMetaData.data
                                    //         }
                                    //         handleCustomButtonClick(button.attrs, event)
                                    //     }}
                                    // />
                                    <SolidFormViewNormalHeaderButton
                                        key={index}
                                        button={button}
                                        params={params}
                                        formik={formik}
                                        solidFormViewMetaData={solidFormViewMetaData}
                                        handleCustomButtonClick={handleCustomButtonClick}
                                    />

                                )
                            })
                            }
                            {params.embeded !== true &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
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
                            {params.embeded !== true && params.draftEnabled &&
                                !formViewLayout.attrs.readonly && params.publish !== 'null' &&
                                formik.dirty &&
                                <div>
                                    <Button
                                        label="Draft"
                                        size="small"
                                        type="button"
                                    />
                                </div>
                            }
                            {params.embeded == true &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
                                !formViewLayout.attrs.readonly &&
                                formik.dirty &&
                                <div>
                                    <Button
                                        label="Save"
                                        size="small"
                                        onClick={() => {
                                            setRedirectToList(params.redirectToPath ? true : false);
                                        }}
                                        type="submit"
                                    />
                                </div>
                            }
                            {params.embeded == true &&
                                <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse' style={{ minWidth: 66 }} />
                            }
                            {params.embeded !== true &&
                                <SolidCancelButton />
                            }
                            {
                                formViewLayout?.attrs?.showCogWheelFormButton !== false &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
                                <FormActionDropdown />
                            }
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex align-items-center gap-3">
                            {params.embeded !== true && <BackButton />}
                            <div className="form-wrapper-title"> {viewMode === "edit" ? editHeaderTitle : solidView.model.displayName}</div>
                        </div>

                        <div className="gap-3 flex">
                            {normalHeaderButtons.map((button: any, index: number) => {
                                return (
                                    // <Button
                                    //     text
                                    //     type="button"
                                    //     className="w-full text-left gap-2"
                                    //     label={button.attrs.label}
                                    //     size="small"
                                    //     iconPos="left"
                                    //     severity="contrast"
                                    //     icon={button?.attrs?.className ? button?.attrs?.className : "pi pi-pencil"}
                                    //     onClick={() => {
                                    //         const event = {
                                    //             action: button.attrs.action,
                                    //             params,
                                    //             formik,
                                    //             solidFormViewMetaData: solidFormViewMetaData.data
                                    //         }
                                    //         handleCustomButtonClick(button.attrs, event)
                                    //     }}
                                    // />
                                    <SolidFormViewNormalHeaderButton
                                        key={index}
                                        button={button}
                                        params={params}
                                        formik={formik}
                                        solidFormViewMetaData={solidFormViewMetaData}
                                        handleCustomButtonClick={handleCustomButtonClick}
                                    />
                                )
                            })
                            }
                            {
                                !formViewLayout.attrs.readonly &&
                                formViewLayout.attrs?.showAddFormButton !== false &&
                                params.embeded !== true &&
                                viewMode === "view" &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&

                                <Button type="button" label="Add" size='small' onClick={() => router.replace('new?viewMode=edit')} />
                            }
                            {
                                !formViewLayout.attrs.readonly &&
                                formViewLayout.attrs?.showEditFormButton !== false &&
                                params.embeded !== true &&
                                viewMode === "view" &&
                                !isPublished &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&

                                <div>
                                    <Button label="Edit" size="small" onClick={() => updateViewMode("edit")} type="button" />
                                </div>
                            }

                            {
                                params.embeded !== true &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                !formViewLayout.attrs.readonly &&
                                formik.dirty &&

                                <div>
                                    <Button label="Save" size="small" type="submit" />
                                </div>
                            }

                            {/* Inline */}
                            {
                                params.embeded == true &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                !formViewLayout.attrs.readonly &&
                                formik.dirty &&

                                <div>
                                    <Button label="Save" size="small" type="submit" />
                                </div>
                            }
                            {
                                params.embeded == true &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'delete')}`) &&
                                formViewLayout.attrs?.showDeleteFormButton !== false &&
                                !formViewLayout.attrs.readonly &&
                                !isPublished &&
                                <div>
                                    <Button size="small" type="button" label="Delete" severity="danger" onClick={() => setDeleteDialogVisible(true)} />
                                </div>
                            }
                            {
                                params.embeded == true &&

                                <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse' style={{ minWidth: 66 }} />
                            }
                            {
                                params.embeded !== true &&

                                <SolidCancelButton />
                            }
                            {
                                formViewLayout?.attrs?.showCogWheelFormButton !== false &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&

                                <FormActionDropdown />
                            }
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
                    solidWorkflowFieldValue={solidWorkflowFieldValue}
                    setSolidWorkflowFieldValue={setSolidWorkflowFieldValue}
                />
            }
        </>
    )
}