"use client"
import { AppTitle } from "@/helpers/AppTitle";
import { useLazyGetAuthSettingsQuery } from "@/redux/api/solidSettingsApi";
import { toggleTheme } from "@/redux/features/themeSlice";
import { LayoutConfig } from "@/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PrimeReactContext } from "primereact/api";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { LayoutContext } from "../layout/context/layoutcontext";
import Image from "next/image";
import SolidLogo from '../../resources/images/SS-Logo.png'
import { Divider } from "primereact/divider";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const [trigger, { data: solidSettingsData }] = useLazyGetAuthSettingsQuery()
    const [allowRegistration, setAllowRegistration] = useState<boolean | null>(null);
    const [isRestricted, setIsRestricted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const { changeTheme } = useContext(PrimeReactContext);
    const { layoutConfig, setLayoutConfig } = useContext(LayoutContext);
    const dispatch = useDispatch();
    const _changeTheme = (theme: string, colorScheme: string) => {
        changeTheme?.(layoutConfig.theme, theme, 'theme-css', () => {
            setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, theme, colorScheme }));
        });
    };
    useEffect(() => {
        const theme = solidSettingsData?.data?.authPagesTheme; // 'dark' or 'light'
        if (theme) {
            dispatch(toggleTheme()); // Dispatch Redux action
            _changeTheme(
                theme === "dark" ? "solid-dark-purple" : "solid-light-purple",
                theme
            );
        }
    }, [solidSettingsData]);
    useEffect(() => {
        // Fetch settings if not already available
        trigger("");

        const allowPublicRegistration = solidSettingsData?.data?.allowPublicRegistration;

        if (allowPublicRegistration === false) {
            setAllowRegistration(false);
            if (pathname === "/auth/register") {
                setIsRestricted(true);
            } else {
                setIsRestricted(false);
            }
        } else if (allowPublicRegistration === true) {
            setAllowRegistration(true);
            setIsRestricted(false);
        }
    }, [solidSettingsData, pathname, trigger]);


    if (allowRegistration === null) return null;

    const authChildren = allowRegistration || pathname !== "/auth/register" ? children : null;
    const handleRegistration = () => {
        router.push("/auth/login");
        setIsRestricted(false);
    }
    return (
        <div className={`solid-auth-theme-wrapper ${solidSettingsData?.data?.authPagesLayout || 'center'}`}>
            <div className={`${solidSettingsData?.data?.authPagesLayout !== 'center' ? 'grid w-full h-full m-0' : ''}`}>
                {solidSettingsData?.data?.authPagesLayout === 'left' &&
                    <div className='col-6 flex align-items-center justify-content-center solid-login-dark-bg'>
                        <div className="w-full">
                            {process.env.NEXT_PUBLIC_AUTH_LOGO && process.env.NEXT_PUBLIC_AUTH_LOGO_POSITION === "in_form_view" &&
                                <div className="flex justify-content-center">
                                    <div className={`solid-logo flex align-items-center ${process.env.NEXT_PUBLIC_AUTH_LOGO_POSITION}`}>
                                        <Image
                                            alt="solid logo"
                                            src={process.env.NEXT_PUBLIC_AUTH_LOGO ?? SolidLogo}
                                            className="relative"
                                            fill
                                        />
                                    </div>
                                </div>
                            }
                            {authChildren}
                        </div>
                    </div>
                }

                <div
                    className={`${solidSettingsData?.data?.authPagesLayout !== 'center' ? 'col-6 position-relative' : ''} 
                                ${solidSettingsData?.data?.authPagesLayout === 'left' ? 'solid-left-layout' : ''} 
                                ${solidSettingsData?.data?.authPagesLayout === 'right' ? 'solid-right-layout' : ''}`.trim()}
                >
                    {process.env.NEXT_PUBLIC_AUTH_LOGO && process.env.NEXT_PUBLIC_AUTH_LOGO_POSITION === "in_image_view" &&
                        <div className={`solid-logo flex align-items-center gap-3 ${process.env.NEXT_PUBLIC_AUTH_LOGO_POSITION}`}>
                            <Image
                                alt="solid logo"
                                src={process.env.NEXT_PUBLIC_AUTH_LOGO ?? SolidLogo}
                                className="relative"
                                fill
                            />
                        </div>
                    }
                    {process.env.NEXT_PUBLIC_SHOW_AUTH_TEXT_CONTENT === 'true' &&
                        <div className="w-full" style={{ zIndex: 1 }}>
                            <div className="grid">
                                <div className="col-8 mx-auto">
                                    <h1 className="solid-auth-image-subtitle m-0">{process.env.NEXT_PUBLIC_AUTH_SUBTITLE}</h1>
                                    <h1 className="solid-auth-image-title mt-0">{process.env.NEXT_PUBLIC_AUTH_TITLE}</h1>
                                    <p className="solid-auth-image-helper-text">{process.env.NEXT_PUBLIC_AUTH_HELPER_TEXT}</p>
                                </div>
                            </div>
                        </div>
                    }
                </div>
                {solidSettingsData?.data?.authPagesLayout === 'center' && <div className="solid-center-layout">
                    {authChildren}
                </div>}
                {solidSettingsData?.data?.authPagesLayout === 'right' &&
                    <div className='col-6 flex align-items-center justify-content-center solid-login-dark-bg'>
                        <div className="w-full">
                            {process.env.NEXT_PUBLIC_AUTH_LOGO && process.env.NEXT_PUBLIC_AUTH_LOGO_POSITION === "in_form_view" &&
                                <div className="flex justify-content-center">
                                    <div className={`solid-logo flex align-items-center gap-3 ${process.env.NEXT_PUBLIC_AUTH_LOGO_POSITION}`}>
                                        <Image
                                            alt="solid logo"
                                            src={process.env.NEXT_PUBLIC_AUTH_LOGO ?? SolidLogo}
                                            className="relative"
                                            fill
                                        />
                                    </div>
                                </div>
                            }
                            {authChildren}
                        </div>
                    </div>
                }
            </div>
            <div className={`absolute  ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'solid-auth-footer flex align-items-center justify-content-between' : 'solid-auth-footer-2 grid'}`}>
                <div className={solidSettingsData?.data?.authPagesLayout !== 'center' ? 'col-6 flex justify-content-center' : ''}>
                    <p className={`solid-auth-input-label text-sm m-0 ${solidSettingsData?.data?.authPagesLayout === 'right' ? 'right' : ''}`}>Made with <svg className="mx-1" width="12px" height="12px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z" fill="#ff0000"></path> </g></svg> in Mumbai</p>
                </div>
                <div className={solidSettingsData?.data?.authPagesLayout !== 'center' ? 'col-6 flex justify-content-center' : ''}>
                    <div className={`flex align-items-center gap-5 solid-auth-subtitle ${solidSettingsData?.data?.authPagesLayout === 'left' ? 'left' : ''}`}>
                        <p className="m-0 "> <Link className="text-sm no-underline font-normal" href={solidSettingsData ? solidSettingsData?.data?.appTnc : "#"}>Terms of Service</Link></p>
                        <p className="m-0 "> <Link className="text-sm no-underline font-normal" href={solidSettingsData ? solidSettingsData?.data?.appPrivacyPolicy : "#"}>Privacy Policy.</Link></p>
                    </div>
                </div>
            </div>
            <Dialog
                visible={isRestricted}
                onHide={handleRegistration}
                header="Access Restricted"
                headerClassName="py-2" contentClassName="px-0 pb-0"
                footer={
                    <div className="flex align-items-center justify-content-start">
                        <Button label="Close" onClick={handleRegistration} size="small" />
                    </div>
                }
                draggable={false}
            >
                <Divider className="m-0" />
                <div className="p-4">
                    <p>Sign-up is not available. Please contact the admin.</p>
                </div>
            </Dialog>
        </div>
    )
}