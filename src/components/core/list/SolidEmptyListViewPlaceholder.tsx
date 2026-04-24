import { permissionExpression } from '../../../helpers/permissions'
import { SolidCreateButton } from '../common/SolidCreateButton'
import { useHandleListCustomButtonClick } from '../../../components/common/useHandleListCustomButtonClick'
import { hasAnyRole } from '../../../helpers/rolesHelper'
import { env } from "../../../adapters/env";
import { useSession } from "../../../hooks/useSession";
import { useState } from "react";
import { Download, SquarePen } from "lucide-react";
import { SolidGenericImport } from "../common/SolidGenericImport/SolidGenericImport";
import { SolidButton } from "../../shad-cn-ui";

export const SolidEmptyListViewPlaceholder = ({
    createButtonUrl,
    createActionQueryParams,
    actionsAllowed,
    params,
    solidListViewMetaData,
    handleFetchUpdatedRecords,
}: any) => {
    const [openImportDialog, setOpenImportDialog] = useState(false);
    const { data: session } = useSession();
    const user = session?.user;

    const layoutAttrs = solidListViewMetaData?.data?.solidView?.layout?.attrs ?? {};
    const displayName = solidListViewMetaData?.data?.solidView?.displayName ?? "records";
    const entityName = displayName.toLowerCase();
    const noDataText = solidListViewMetaData?.data?.solidView?.layout?.attrs?.listViewNoDataHelperText
        ?? (env("NEXT_PUBLIC_DEFAULT_LIST_VIEW_NODATA_HELPER_TEXT") && solidListViewMetaData?.data?.solidView?.displayName
            ? `${env("NEXT_PUBLIC_DEFAULT_LIST_VIEW_NODATA_HELPER_TEXT")} ${solidListViewMetaData.data.solidView.displayName}`
            : `There are no ${entityName} records yet.`);

    const handleCustomButtonClick = useHandleListCustomButtonClick();

    const normalizeAction = (value: boolean | string[] | undefined) => {
        if (value === true || value === undefined) return { enabled: true, roles: [] as string[] };
        if (value === false) return { enabled: false, roles: [] as string[] };
        if (Array.isArray(value)) return { enabled: true, roles: value };
        return { enabled: true, roles: [] as string[] };
    };

    const importAction = normalizeAction(layoutAttrs.import);
    const canCreate =
        actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
        layoutAttrs?.create !== false &&
        params.embeded !== true &&
        layoutAttrs.showDefaultAddButton !== false;
    const canImport =
        params.embeded !== true &&
        importAction.enabled &&
        actionsAllowed.includes(`${permissionExpression(params.modelName, 'create')}`) &&
        actionsAllowed.includes(`${permissionExpression('importTransaction', 'create')}`) &&
        (importAction.roles.length === 0 || hasAnyRole(user?.roles, importAction.roles));

    const CustomActionButtons = () => {
        const headerButtons = layoutAttrs?.headerButtons ?? [];
        if (layoutAttrs.showDefaultAddButton !== false || !headerButtons.length) return null;

        return (
            <div className="solid-empty-listview-custom-actions">
                {headerButtons.map((button: any) => {
                    const hasRole = !button?.attrs?.roles || button?.attrs?.roles.length === 0 ? true : hasAnyRole(user?.roles, button?.attrs?.roles);
                    if (!hasRole) return null;

                    return (
                        <SolidButton
                            key={button?.attrs?.name || button?.attrs?.label}
                            type="button"
                            className={`solid-empty-listview-secondary-action ${button?.attrs?.className ?? ''}`}
                            variant={button?.attrs?.showText === false ? "primary" : "ghost"}
                            size="small"
                            icon={button?.attrs?.icon}
                            leftIcon={!button?.attrs?.icon ? <SquarePen size={14} /> : undefined}
                            onClick={() => {
                                const event = {
                                    params,
                                    solidListViewMetaData: solidListViewMetaData.data
                                };
                                handleCustomButtonClick(button.attrs, event);
                            }}
                        >
                            {button.attrs.label}
                        </SolidButton>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <div className='solid-empty-listview-placeholder-container'>
                <div className="solid-empty-listview-placeholder-panel">
                    <div className="solid-empty-listview-header">
                        <div className="solid-empty-listview-header-title">{displayName}</div>
                        <div className="solid-empty-listview-header-subtitle">{noDataText}</div>
                    </div>

                    <div className="solid-empty-listview-body">
                        {/* <div className="solid-empty-listview-icon-wrap">
                            <FolderOpen className="solid-empty-listview-icon" aria-hidden="true" />
                        </div>
                        <div className="solid-empty-listview-title">
                            No {displayName} Data Available
                        </div> */}

                        <div className="solid-empty-listview-actions">
                            {canCreate && (
                                <div className="solid-empty-listview-create-action">
                                    <SolidCreateButton
                                        createButtonUrl={createButtonUrl}
                                        createActionQueryParams={createActionQueryParams}
                                        title={solidListViewMetaData?.data?.solidView?.displayName}
                                    />
                                </div>
                            )}
                            {canImport && (
                                <SolidButton
                                    type="button"
                                    variant="outline"
                                    leftIcon={<Download size={14} />}
                                    className="solid-empty-listview-import-button"
                                    onClick={() => setOpenImportDialog(true)}
                                >
                                    Import
                                </SolidButton>
                            )}
                        </div>

                        <div className="solid-empty-listview-description">
                            Click Create or Import to add {entityName} entities.
                        </div>

                        <CustomActionButtons />

                        {(canCreate || canImport) && (
                            <div className="solid-empty-listview-description">
                                Click Create or Import to add {entityName} entities.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {openImportDialog && (
                <SolidGenericImport
                    openImportDialog={openImportDialog}
                    setOpenImportDialog={setOpenImportDialog}
                    listViewMetaData={solidListViewMetaData}
                    handleFetchUpdatedRecords={handleFetchUpdatedRecords}
                />
            )}
        </>
    );
};
