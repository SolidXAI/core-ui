import { BackButton } from "../../../components/common/BackButton";
import { SolidFormHeader } from "../../../components/common/SolidFormHeader";
import { useHandleFormCustomButtonClickaction } from "../../../components/common/useHandleFormCustomButtonClick";
import { permissionExpression } from "../../../helpers/permissions";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { normalizeSolidFormActionPath } from "../../../helpers/routePaths";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { SolidFormViewNormalHeaderButton } from "./SolidFormViewNormalHeaderButton";
import { SolidFormViewContextMenuHeaderButton } from "./SolidFormViewContextMenuHeaderButton";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { useSession } from '../../../hooks/useSession'
import { SolidFormStepper } from "../../../components/common/SolidFormStepper";
import { SolidPopover, SolidPopoverContent, SolidPopoverTrigger } from "../../shad-cn-ui/SolidPopover";

export const SolidFormActionHeader = ({ formik, params, actionsAllowed, formViewLayout, solidView, solidFormViewMetaData, initialEntityData, setDeleteDialogVisible, setLayoutDialogVisible, setRedirectToList, viewMode, setViewMode, solidWorkflowFieldValue, setSolidWorkflowFieldValue, internationalisationEnabled, handleDraftPublishWorkFlow, publish, draftEnabled, onStepperUpdate, formData, isSubmitting }: any) => {
    const handleCustomButtonClick = useHandleFormCustomButtonClickaction();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [contextMenuHeaderButtons, setContextMenuHeaderButtons] = useState<any>([]);
    const [normalHeaderButtons, setNormalHeaderButtons] = useState<any>([]);
    const [isNavigating, setIsNavigating] = useState(false);
    const [formActionsMenuOpen, setFormActionsMenuOpen] = useState(false);
    const createHeaderTitle = `Create ${solidView.model.displayName}`;
    const editHeaderTitle = `Edit ${solidView.model.displayName}`;

    const { data: session, status } = useSession();
    const user = session?.user;

    const isPublished = publish && publish !== 'null';   // record is published if publish has value

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
                        if (!hasAnyRole(user?.roles, visibleToRole)) {
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
                        if (!hasAnyRole(user?.roles, visibleToRole)) {
                            return false;
                        }
                    }

                    return !button.attrs || !button.attrs.actionInContextMenu || button.attrs.actionInContextMenu === false;
                });
                setNormalHeaderButtons(normalHeaderButtonsData);
            }
        }
    }, [formViewLayout]);

    const updateViewMode = (newMode: "view" | "edit") => {
        setViewMode(newMode);
        const queryParams = new URLSearchParams(searchParams.toString());
        queryParams.set("viewMode", newMode);
        const basePath = params?.id
            ? normalizeSolidFormActionPath(pathname, `form/${params.id}`)
            : pathname;
        router.push(`${basePath}?${queryParams.toString()}`);
        // const router = useRouter();
        // const pathname = usePathname();
        // const params = new URLSearchParams(searchParams?.toString() || "");
        // params.set("viewMode", newMode);
        // router.push(`${pathname}?${params.toString()}`, { scroll: false });

    };
    const menuButtonClassNames = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

    const FormActionMenuButton = ({
        label,
        icon,
        onClick,
        danger,
    }: {
        label: string;
        icon?: string;
        onClick: () => void;
        danger?: boolean;
    }) => (
        <button
            type="button"
            className={menuButtonClassNames("solid-row-action-button", danger && "solid-row-action-button-danger")}
            onClick={onClick}
        >
            {icon && <i className={`${icon} solid-row-action-button-icon`} />}
            <span className="solid-row-action-button-label">{label}</span>
        </button>
    );

    const FormActionDropdown = () => {
        const canPublish = actionsAllowed.includes(permissionExpression(params.modelName, 'publish'));
        const canUnpublish = actionsAllowed.includes(permissionExpression(params.modelName, 'unpublish'));
        const closeMenu = () => setFormActionsMenuOpen(false);

        return (
            <SolidPopover open={formActionsMenuOpen} onOpenChange={setFormActionsMenuOpen}>
                <div className="flex gap-2">
                    <SolidPopoverTrigger asChild>
                        <Button
                            outlined
                            severity="secondary"
                            type="button"
                            icon={'pi pi-cog'}
                            size="small"
                            className="surface-card solid-icon-button hidden md:flex"
                        />
                    </SolidPopoverTrigger>
                    <SolidPopoverTrigger asChild>
                        <Button
                            outlined
                            type="button"
                            icon={'pi pi-cog'}
                            size="small"
                            className="surface-card solid-icon-button md:hidden"
                        />
                    </SolidPopoverTrigger>
                </div>
                <SolidPopoverContent
                    side="bottom"
                    align="end"
                    className="solid-form-actions-popover"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="solid-row-actions-menu solid-form-actions-menu">
                        {params.embeded !== true &&
                            params.id !== "new" &&
                            actionsAllowed.includes(`${permissionExpression(params.modelName, 'delete')}`) &&
                            !isPublished &&
                            solidView?.layout?.attrs?.showDeleteFormButton !== false &&
                            !formViewLayout.attrs.readonly && (
                                <FormActionMenuButton
                                    label="Delete"
                                    icon="pi pi-trash"
                                    danger
                                    onClick={() => {
                                        setDeleteDialogVisible(true);
                                        closeMenu();
                                    }}
                                />
                            )}
                        <FormActionMenuButton
                            label="Layout"
                            icon="pi pi-objects-column"
                            onClick={() => {
                                setLayoutDialogVisible(true);
                                closeMenu();
                            }}
                        />
                        {draftEnabled && params.id !== 'new' && (
                            <>
                                {!isPublished && canPublish && (
                                    <FormActionMenuButton
                                        label="Publish"
                                        icon="pi pi-cloud-upload"
                                        onClick={() => {
                                            handleDraftPublishWorkFlow('publish');
                                            closeMenu();
                                        }}
                                    />
                                )}

                                {isPublished && canUnpublish && (
                                    <FormActionMenuButton
                                        label="Unpublish"
                                        icon="pi pi-cloud-download"
                                        onClick={() => {
                                            handleDraftPublishWorkFlow('unpublish');
                                            closeMenu();
                                        }}
                                    />
                                )}
                            </>
                        )}

                        {contextMenuHeaderButtons.map((button: any, index: number) => {
                            return (
                                <SolidFormViewContextMenuHeaderButton
                                    key={button?.attrs?.action ?? index}
                                    button={button}
                                    params={params}
                                    formik={formik}
                                    formData={formData}
                                    solidFormViewMetaData={solidFormViewMetaData}
                                    handleCustomButtonClick={handleCustomButtonClick}
                                    variant="menu"
                                    onActionComplete={closeMenu}
                                />
                            )
                        })}
                        <div className="lg:hidden flex flex-column gap-1">
                            {normalHeaderButtons.map((button: any, index: number) => {
                                return (
                                    <SolidFormViewNormalHeaderButton
                                        key={button?.attrs?.action ?? index}
                                        button={button}
                                        params={params}
                                        formik={formik}
                                        formData={formData}
                                        solidFormViewMetaData={solidFormViewMetaData}
                                        handleCustomButtonClick={handleCustomButtonClick}
                                        variant="menu"
                                        onActionComplete={closeMenu}
                                    />
                                )
                            })}
                            {params.embeded !== true && params.draftEnabled &&
                                !formViewLayout.attrs.readonly && params.publish !== 'null' &&
                                formik.dirty && (
                                    <FormActionMenuButton
                                        label="Draft"
                                        onClick={() => { }}
                                    />
                                )}
                        </div>
                    </div>
                </SolidPopoverContent>
            </SolidPopover>
        )
    }
    return (
        <>
            <div className="page-header solid-list-toolbar flex-column lg:flex-row">
                <div className="flex justify-content-between w-full solid-form-toolbar-row">
                    {params.id === "new" ? (
                        <>
                            <div className="flex gap-3 align-items-center solid-form-toolbar-left">
                                {/* {params.embeded !== true && <BackButton />}
                            <p className="m-0 view-title solid-text-wrapper">{createHeaderTitle}</p> */}
                             {params.embeded !== true && 
                                <SolidFormStepper
                                    solidFormViewMetaData={solidFormViewMetaData}
                                    initialEntityData={initialEntityData}
                                    modelName={params.modelName}
                                    id={params.id}
                                    solidWorkflowFieldValue={solidWorkflowFieldValue}
                                    setSolidWorkflowFieldValue={setSolidWorkflowFieldValue}
                                    onStepperUpdate={onStepperUpdate}
                                ></SolidFormStepper>
                             }
                            </div>
                            <div className="flex align-items-center solid-header-buttons-wrapper solid-form-toolbar-actions">
                                <div className="hidden lg:flex solid-header-buttons-wrapper">
                                    {normalHeaderButtons.map((button: any, index: number) => {
                                        return (
                                            <SolidFormViewNormalHeaderButton
                                                key={index}
                                                button={button}
                                                params={params}
                                                formik={formik}
                                                formData={formData}
                                                solidFormViewMetaData={solidFormViewMetaData}
                                                handleCustomButtonClick={handleCustomButtonClick}
                                            />

                                        )
                                    })
                                    }
                                </div>
                                {params.embeded !== true &&
                                    actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    formik.dirty &&
                                    <div>
                                        <Button
                                            label="Save"
                                            size="small"
                                            type="submit"
                                            className="hidden lg:flex"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                        <Button
                                            size="small"
                                            type="submit"
                                            className="lg:hidden solid-icon-button"
                                            icon="pi pi-check"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                }
                                <div className="hidden lg:flex">
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
                                </div>
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
                                            className="hidden lg:flex"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setRedirectToList(params.redirectToPath ? true : false);
                                            }}
                                            type="submit"
                                            className="lg:hidden solid-icon-button"
                                            icon="pi pi-check"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                }
                                {params.embeded == true &&
                                    <>
                                        <div className="hidden lg:flex">
                                            <div>
                                                <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse ' style={{ minWidth: 66 }} />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <Button outlined size="small" type="button" icon="pi pi-times" onClick={() => params.handlePopupClose()} className='bg-primary-reverse solid-icon-button' />
                                        </div>
                                    </>
                                }
                                {/* {params.embeded !== true &&
                                <SolidCancelButton />
                            } */}
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
                            <div className="flex gap-3 align-items-center solid-form-toolbar-left">
                             {params.embeded !== true && 
                                <SolidFormStepper
                                solidFormViewMetaData={solidFormViewMetaData}
                                initialEntityData={initialEntityData}
                                modelName={params.modelName}
                                id={params.id}
                                solidWorkflowFieldValue={solidWorkflowFieldValue}
                                setSolidWorkflowFieldValue={setSolidWorkflowFieldValue}
                                onStepperUpdate={onStepperUpdate}
                                ></SolidFormStepper>
                            }
                                {/* {params.embeded !== true && <BackButton />} */}
                                {/* <p className="m-0 view-title solid-text-wrapper">{viewMode === "edit" ? editHeaderTitle : solidView.model.displayName}</p> */}
                            </div>

                            <div className="flex align-items-center solid-header-buttons-wrapper solid-form-toolbar-actions">
                                <div className="hidden lg:flex solid-header-buttons-wrapper">
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
                                                formData={formData}
                                                solidFormViewMetaData={solidFormViewMetaData}
                                                handleCustomButtonClick={handleCustomButtonClick}
                                            />
                                        )
                                    })
                                    }
                                </div>
                                {
                                    !formViewLayout.attrs.readonly &&
                                    formViewLayout.attrs?.showAddFormButton !== false &&
                                    params.embeded !== true &&
                                    viewMode === "view" &&
                                    actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
                                    <>
                                        <div className="hidden lg:flex">
                                            <div>
                                                <Button type="button" label="Add" size='small' onClick={() => {
                                                    setIsNavigating(true);
                                                    router.replace(`${normalizeSolidFormActionPath(pathname, "form")}/new?viewMode=edit`);
                                                }} loading={isNavigating} disabled={isNavigating} />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <Button type="button" icon="pi pi-plus" size='small' onClick={() => {
                                                setIsNavigating(true);
                                                router.replace(`${normalizeSolidFormActionPath(pathname, "form")}/new?viewMode=edit`);
                                            }} className="p-button-sm solid-icon-button" loading={isNavigating} disabled={isNavigating} />
                                        </div>
                                    </>
                                }
                                {
                                    !formViewLayout.attrs.readonly &&
                                    formViewLayout.attrs?.showEditFormButton !== false &&
                                    params.embeded !== true &&
                                    viewMode === "view" &&
                                    !isPublished &&
                                    actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                    <>
                                        <div className="hidden lg:flex">
                                            <div>
                                                <Button label="Edit" size="small" onClick={() => updateViewMode("edit")} type="button" />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <Button icon="pi pi-pencil" size="small" onClick={() => updateViewMode("edit")} type="button" className="p-button-sm solid-icon-button " />
                                        </div>
                                    </>
                                }

                                {
                                    params.embeded !== true &&
                                    actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    formik.dirty &&

                                    <div>
                                        <Button label="Save" size="small" type="submit" className="hidden lg:flex" loading={isSubmitting} disabled={isSubmitting} />
                                        <Button size="small" type="submit" className="lg:hidden solid-icon-button" icon="pi pi-check" loading={isSubmitting} disabled={isSubmitting} />
                                    </div>
                                }

                                {/* Inline */}
                               
                               
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
                                    <>
                                        <div className="hidden lg:flex">
                                            <div>
                                                <Button outlined size="small" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse ' style={{ minWidth: 66 }} />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <Button outlined size="small" type="button" icon="pi pi-times" onClick={() => params.handlePopupClose()} className='bg-primary-reverse solid-icon-button' />
                                        </div>
                                    </>
                                }
                                {/* {
                                params.embeded !== true &&

                                <SolidCancelButton />
                            } */}
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
            </div>
            {/* {params.embeded !== true &&
                <SolidFormHeader
                    solidFormViewMetaData={solidFormViewMetaData}
                    initialEntityData={initialEntityData}
                    modelName={params.modelName}
                    id={params.id}
                    solidWorkflowFieldValue={solidWorkflowFieldValue}
                    setSolidWorkflowFieldValue={setSolidWorkflowFieldValue}
                    onStepperUpdate={onStepperUpdate}
                />
            } */}
        </>
    )
}
