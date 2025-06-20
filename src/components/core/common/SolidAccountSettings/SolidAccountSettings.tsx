"use client"

import { Dialog } from "primereact/dialog";
import { useState } from "react";
import { SolidPersnoalInfo } from "./SolidPersnoalInfo";
import { SolidNotifications } from "./SolidNotifications";
import { SolidChangePassword } from "./SolidChangePassword";
import styles from './SolidAccountSettings.module.css'
export const SolidAccountSettings = ({ showProfileSettingsDialog, setShowProfileSettingsDialog }: any) => {
    const [setting, setSetting] = useState({ key: "personal_info", label: "Persnoal Info" });
    const settings = [
        {
            label: "Persnoal Info",
            key: "personal_info",
            icon: "pi pi-user-edit"
        },
        {
            label: "Notification",
            key: "notifications",
            icon: "pi pi-bell"
        },
        {
            label: "Change Password",
            key: "change_password",
            icon: "pi pi-key"
        },
    ]

    const renderSettingComponent = () => {
        switch (setting.key) {
            case "personal_info":
                return <SolidPersnoalInfo />;
            case "notifications":
                return <SolidNotifications />;
            case "change_password":
                return <SolidChangePassword />;
            default:
                return null;
        }
    };

    return (
        <Dialog
            header={<h5 className='m-0 font-bold'>Account Settings</h5>}
            headerClassName="px-4 py-3 secondary-border-bottom"
            contentClassName="p-0"
            visible={showProfileSettingsDialog}
            style={{ width: '60vw' }}
            onHide={() => {
                if (!showProfileSettingsDialog) return;
                setShowProfileSettingsDialog(false);
            }}
            draggable={false}
        >
            <div className="grid m-0">
                <div className={`col-3 p-3 ${styles.SolidSettingTabWrapper}`}>
                    <div className="flex flex-column gap-1">
                        {settings.map((option) => (
                            <div
                                key={option.key}
                                className={`w-full flex align-items-center gap-2 text-start ${styles.SolidSettingTab} ${option.key === setting.key ? styles.SolidActiveSetting : styles.SolidDeActiveSetting}`}
                                onClick={() => setSetting(option)}
                            >
                                <span className={option.icon}></span> {option.label}
                            </div>
                        ))}
                    </div>
                </div>
                <div className={`col-9 py-3 px-4 ${styles.SolidAccountSettingFormWrapper}`}>
                    {renderSettingComponent()}
                    {/* <div className="p-3 secondary-border-bottom">
                        <h5 className="m-0"></h5>
                    </div>
                    <div className="py-3 px-4 h-full">
                        {renderSettingComponent()}
                    </div> */}
                </div>
            </div>
        </Dialog>
    )
}