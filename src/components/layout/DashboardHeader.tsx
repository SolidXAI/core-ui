
import { useState } from "react";
import { SolidButton, SolidPopover, SolidPopoverContent, SolidPopoverTrigger } from "../shad-cn-ui";
import { SolidIcon, parseSolidIconMeta } from "../shad-cn-ui/SolidIcon";

const DashboardHeader = () => {

    const [menuOpen, setMenuOpen] = useState(false);
    const items = [
        {
            label: 'Refresh',
            icon: 'pi pi-refresh'
        },
        {
            label: 'Export',
            icon: 'pi pi-upload'
        }
    ];

    return (
        <div className="flex justify-content-between  align-items-center px-5 surface-0 border-bottom-1 surface-border relative lg:static" style={{ height: "60px" }}>
            <div className="flex align-items-center">
                <SolidButton label="New" size="sm" type="submit" className="small-button" />
                <SolidPopover open={menuOpen} onOpenChange={setMenuOpen}>
                    <SolidPopoverTrigger asChild>
                        <SolidButton
                            type="button"
                            icon="pi pi-cog"
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                        />
                    </SolidPopoverTrigger>
                    <SolidPopoverContent side="bottom" align="start" className="solid-form-actions-popover">
                        <div className="solid-row-actions-menu">
                            {items.map((item) => (
                                <button key={item.label} type="button" className="solid-row-action-button" onClick={() => setMenuOpen(false)}>
                                    {(() => { const m = parseSolidIconMeta(item.icon); return m ? <SolidIcon name={m.name} spin={m.spin} className="solid-row-action-button-icon" /> : <i className={`${item.icon} solid-row-action-button-icon`} />; })()}
                                    <span className="solid-row-action-button-label">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </SolidPopoverContent>
                </SolidPopover>
            </div>
            <div className="flex align-items-center">
                <div className="bgCircle">
                    <div style={{ position: "relative" }}>
                        <SolidIcon name="si-bell" />
                        <span className="topbar-badge">
                        </span>
                    </div>
                </div>
                <div className="bgCircle ml-3">
                    <div style={{ position: "relative" }}>
                        <SolidIcon name="si-envelope" />
                        <span className="topbar-badge">
                        </span>
                    </div>
                </div>
                <div className="topbar-profile">
                    <button className="topbar-profile-button p-link" type="button">
                        <img alt="avatar" src="/images/dashboard/Ellipse 1.svg" />
                        <span className="profile-details">
                            <span className="profile-name">Gene Russell</span>
                            <span className="profile-email">ben95@example.com</span>
                        </span>
                        <SolidIcon name="si-angle-down" />
                    </button>
                    <ul className="list-none p-3 m-0 border-round shadow-2 absolute surface-overlay origin-top w-full sm:w-12rem mt-2 right-0 top-auto hidden">
                        <li>
                            <a className="p-ripple flex p-2 border-round align-items-center hover:surface-hover transition-colors transition-duration-150 cursor-pointer">
                                <SolidIcon name="si-user" className="mr-3" />
                                <span>Profile</span>
                            </a>
                            <a className="p-ripple flex p-2 border-round align-items-center hover:surface-hover transition-colors transition-duration-150 cursor-pointer">
                                <SolidIcon name="si-inbox" className="mr-3" />
                                <span>Inbox</span></a>
                            <a className="p-ripple flex p-2 border-round align-items-center hover:surface-hover transition-colors transition-duration-150 cursor-pointer">
                                <SolidIcon name="si-cog" className="mr-3" />
                                <span>Settings</span>
                            </a>
                            <a className="p-ripple flex p-2 border-round align-items-center hover:surface-hover transition-colors transition-duration-150 cursor-pointer">
                                <SolidIcon name="si-power-off" className="mr-3" />
                                <span>Sign Out</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
export default DashboardHeader;
