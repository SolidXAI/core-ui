import { SolidHeaderRequestStatus } from "../../../components/common/SolidHeaderRequestStatus";
import { useHandleFormCustomButtonClickaction } from "../../../components/common/useHandleFormCustomButtonClick";
import { permissionExpression } from "../../../helpers/permissions";
import { usePathname } from "../../../hooks/usePathname";
import { useRouter } from "../../../hooks/useRouter";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { normalizeSolidFormActionPath } from "../../../helpers/routePaths";
import { useEffect, useState } from "react";
import { SolidFormViewNormalHeaderButton } from "./SolidFormViewNormalHeaderButton";
import { SolidFormViewContextMenuHeaderButton } from "./SolidFormViewContextMenuHeaderButton";
import { hasAnyRole } from "../../../helpers/rolesHelper";
import { useSession } from '../../../hooks/useSession'
import { SolidFormStepper } from "../../../components/common/SolidFormStepper";
import { SolidButton, SolidPopover, SolidPopoverContent, SolidPopoverTrigger } from "../../shad-cn-ui";
import { SolidIcon, parseSolidIconMeta } from "../../shad-cn-ui/SolidIcon";

export const SolidFormActionHeader = ({ formik, params, actionsAllowed, formViewLayout, solidView, solidFormViewMetaData, initialEntityData, setDeleteDialogVisible, setLayoutDialogVisible, setRedirectToList, viewMode, setViewMode, solidWorkflowFieldValue, setSolidWorkflowFieldValue, internationalisationEnabled, handleDraftPublishWorkFlow, publish, draftEnabled, onStepperUpdate, formData, isSubmitting, headerRequestStatusLabel, showMobileOpenChatter, onMobileOpenChatter }: any) => {
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
    const activeHeaderRequestStatusLabel = headerRequestStatusLabel || (isNavigating ? "Loading..." : null);
    const shouldShowSaveForExistingRecord = viewMode === "edit" && formik.dirty;

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
            {icon && (() => { const m = parseSolidIconMeta(icon); return m ? <SolidIcon name={m.name} spin={m.spin} className="solid-row-action-button-icon" /> : <i className={`${icon} solid-row-action-button-icon`} />; })()}
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
                        <SolidButton
                            variant="outline"
                            type="button"
                            icon={'si si-cog'}
                            size="sm"
                            className="surface-card solid-icon-button hidden md:flex"
                        />
                    </SolidPopoverTrigger>
                    <SolidPopoverTrigger asChild>
                        <SolidButton
                            variant="outline"
                            type="button"
                            icon={'si si-cog'}
                            size="sm"
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
                                    icon="si si-trash"
                                    danger
                                    onClick={() => {
                                        setDeleteDialogVisible(true);
                                        closeMenu();
                                    }}
                                />
                            )}
                        <FormActionMenuButton
                            label="Layout"
                            icon="si si-objects-column"
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
                                        icon="si si-cloud-upload"
                                        onClick={() => {
                                            handleDraftPublishWorkFlow('publish');
                                            closeMenu();
                                        }}
                                    />
                                )}

                                {isPublished && canUnpublish && (
                                    <FormActionMenuButton
                                        label="Unpublish"
                                        icon="si si-cloud-download"
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
                                {/* {params.embeded !== true && <BackButton />}*/}
                                {params.embeded == true &&
                                    <p className="m-0 view-title solid-text-wrapper">{createHeaderTitle}</p>
                                }
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
                                <SolidHeaderRequestStatus label={activeHeaderRequestStatusLabel} />
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
                                        <SolidButton
                                            label="Save"
                                            size="sm"
                                            type="submit"
                                            className="hidden lg:flex"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                        <SolidButton
                                            size="sm"
                                            type="submit"
                                            className="lg:hidden solid-icon-button"
                                            icon="si si-check"
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
                                            <SolidButton
                                                label="Draft"
                                                size="sm"
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
                                        <SolidButton
                                            label="Save"
                                            size="sm"
                                            onClick={() => {
                                                setRedirectToList(params.redirectToPath ? true : false);
                                            }}
                                            type="submit"
                                            className="hidden lg:flex"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                        <SolidButton
                                            size="sm"
                                            onClick={() => {
                                                setRedirectToList(params.redirectToPath ? true : false);
                                            }}
                                            type="submit"
                                            className="lg:hidden solid-icon-button"
                                            icon="si si-check"
                                            loading={isSubmitting}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                }
                                {params.embeded == true &&
                                    <>
                                        <div className="hidden lg:flex">
                                            <div>
                                                <SolidButton variant="outline" size="sm" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse ' style={{ minWidth: 66 }} />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <SolidButton variant="outline" size="sm" type="button" icon="si si-times" onClick={() => params.handlePopupClose()} className='bg-primary-reverse solid-icon-button' />
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
                                {
                                    showMobileOpenChatter &&
                                    <div className="lg:hidden">
                                        <SolidButton
                                            type="button"
                                            icon="si si-comments"
                                            size="sm"
                                            className="solid-icon-button"
                                            onClick={onMobileOpenChatter}
                                            aria-label="Open chatter"
                                        />
                                    </div>
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
                                {params.embeded == true &&
                                    <p className="m-0 view-title solid-text-wrapper">{viewMode === "edit" ? editHeaderTitle : solidView.model.displayName}</p>
                                }
                            </div>

                            <div className="flex align-items-center solid-header-buttons-wrapper solid-form-toolbar-actions">
                                <SolidHeaderRequestStatus label={activeHeaderRequestStatusLabel} />
                                <div className="hidden lg:flex solid-header-buttons-wrapper">
                                    {normalHeaderButtons.map((button: any, index: number) => {
                                        return (
                                            // <SolidButton
                                            //     text
                                            //      type="button"
                                            //     className="w-full text-left gap-2"
                                            //     label={button.attrs.label}
                                            //     size="small"
                                            //     iconPos="left"
                                            //     severity="contrast"
                                            //     icon={button?.attrs?.className ? button?.attrs?.className : "si si-pencil"}
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
                                                <SolidButton type="button" label="Add" size='sm' onClick={() => {
                                                    setIsNavigating(true);
                                                    router.replace(`${normalizeSolidFormActionPath(pathname, "form")}/new?viewMode=edit`);
                                                }} loading={isNavigating} disabled={isNavigating} />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <SolidButton type="button" icon="si si-plus" size='sm' onClick={() => {
                                                setIsNavigating(true);
                                                router.replace(`${normalizeSolidFormActionPath(pathname, "form")}/new?viewMode=edit`);
                                            }} className="solid-icon-button" loading={isNavigating} disabled={isNavigating} />
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
                                                <SolidButton label="Edit" size="sm" onClick={() => updateViewMode("edit")} type="button" />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <SolidButton icon="si si-pencil" size="sm" onClick={() => updateViewMode("edit")} type="button" className="solid-icon-button" />
                                        </div>
                                    </>
                                }

                                {
                                    params.embeded !== true &&
                                    actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    shouldShowSaveForExistingRecord &&

                                    <div>
                                        <SolidButton label="Save" size="sm" type="submit" className="hidden lg:flex" loading={isSubmitting} disabled={isSubmitting} />
                                        <SolidButton size="sm" type="submit" className="lg:hidden solid-icon-button" icon="si si-check" loading={isSubmitting} disabled={isSubmitting} />
                                    </div>
                                }

                                {/* Inline */}

                                {
                                    params.embeded == true &&
                                    actionsAllowed.includes(`${permissionExpression(params.modelName, 'update')}`) &&
                                    !formViewLayout.attrs.readonly &&
                                    shouldShowSaveForExistingRecord &&

                                    <div>
                                        <SolidButton label="Save" size="sm" type="submit" className="hidden lg:flex" loading={isSubmitting} disabled={isSubmitting} />
                                        <SolidButton size="sm" type="submit" className="lg:hidden solid-icon-button" icon="si si-check" loading={isSubmitting} disabled={isSubmitting} />

                                    </div>
                                }

                                {
                                    params.embeded == true &&
                                    actionsAllowed.includes(`${permissionExpression(params.modelName, 'delete')}`) &&
                                    formViewLayout.attrs?.showDeleteFormButton !== false &&
                                    !formViewLayout.attrs.readonly &&
                                    !isPublished &&
                                    <div>
                                        <SolidButton size="sm" type="button" label="Delete" variant="destructive" onClick={() => setDeleteDialogVisible(true)} />
                                    </div>
                                }
                                {
                                    params.embeded == true &&
                                    <>
                                        <div className="hidden lg:flex">
                                            <div>
                                                <SolidButton variant="outline" size="sm" type="button" label="Close" onClick={() => params.handlePopupClose()} className='bg-primary-reverse ' style={{ minWidth: 66 }} />
                                            </div>
                                        </div>
                                        <div className="lg:hidden">
                                            <SolidButton variant="outline" size="sm" type="button" icon="si si-times" onClick={() => params.handlePopupClose()} className='bg-primary-reverse solid-icon-button' />
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
                                {
                                    showMobileOpenChatter &&
                                    <div className="lg:hidden">
                                        <SolidButton
                                            type="button"
                                            icon="si si-comments"
                                            size="sm"
                                            className="solid-icon-button"
                                            onClick={onMobileOpenChatter}
                                            aria-label="Open chatter"
                                        />
                                    </div>
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
