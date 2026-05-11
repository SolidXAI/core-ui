import Link from "../common/Link";
import { usePathname } from "../../hooks/usePathname";
import { useRouter } from "../../hooks/useRouter";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import Image from "../common/Image";
import SolidLogo from '../../resources/images/SolidXLogo.svg'
import AuthScreenCenterBackgroundImage from '../../resources/images/auth/solid-login-light.png';
import { env } from "../../adapters/env";
import { SolidButton, SolidDialog, SolidDivider } from "../shad-cn-ui";
import { LayoutContext } from "../layout/context/layoutcontext";
import { solidGet } from "../../http/solidHttp";
import { AuthSettingsContext } from "./AuthSettingsContext";

const SHADCN_PLACEHOLDER_IMAGE = "https://ui.shadcn.com/placeholder.svg";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    const layoutContext = useContext(LayoutContext);
    const [solidSettingsData, setSolidSettingsData] = useState<any>(null);
    const [isLoadingAuthSettings, setIsLoadingAuthSettings] = useState(true);

    const [allowRegistration, setAllowRegistration] = useState<boolean | null>(null);
    const [isRestricted, setIsRestricted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const loadAuthSettings = useCallback(async () => {
        setIsLoadingAuthSettings(true);
        try {
            const response = await solidGet("/setting/wrapped");
            setSolidSettingsData(response?.data ?? null);
        } catch (error) {
            console.error("Failed to load auth settings", error);
            setSolidSettingsData(null);
        } finally {
            setIsLoadingAuthSettings(false);
        }
    }, []);

    useEffect(() => {
        loadAuthSettings();
    }, [loadAuthSettings]);

    useEffect(() => {
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
    }, [solidSettingsData, pathname]);

    if (isLoadingAuthSettings && pathname === "/auth/register") {
        return null;
    }

    const authChildren = allowRegistration !== false || pathname !== "/auth/register" ? children : null;
    const handleRegistration = () => {
        router.push("/auth/login");
        setIsRestricted(false);
    }

    const solidSideBanner = () => {
        const layout = solidSettingsData?.data?.authPagesLayout;

        let src = '';

        if (layout === 'left') {
            src = solidSettingsData?.data?.authScreenLeftBackgroundImage || SHADCN_PLACEHOLDER_IMAGE;
        } else if (layout === 'right') {
            src = solidSettingsData?.data?.authScreenRightBackgroundImage || SHADCN_PLACEHOLDER_IMAGE;
        } else if (layout === 'center') {
            src = solidSettingsData?.data?.authScreenCenterBackgroundImage || (AuthScreenCenterBackgroundImage as any).src || AuthScreenCenterBackgroundImage;
        }

        // Normalize image path if coming from API
        const isBlobOrAbsolute = src?.startsWith("blob:") || src?.startsWith("http");
        if (!isBlobOrAbsolute && !src?.startsWith("/")) {
            src = `${env("API_URL")}/${src}`;
        }

        return src;
    };

    const normalizeAssetUrl = (src?: string) => {
        if (!src) return "";
        const isBlobOrAbsolute = src.startsWith("blob:") || src.startsWith("http");
        if (isBlobOrAbsolute || src.startsWith("/")) return src;
        return `${env("API_URL")}/${src}`;
    };

    const authLogoSrc = normalizeAssetUrl(solidSettingsData?.data?.appLogo || "");
    const appName = solidSettingsData?.data?.appTitle?.trim() || "";

    const renderBrand = (align: "center" | "start" = "start") => {
        if (!authLogoSrc && !appName) return null;

        const brandLabel = appName || "Application logo";

        return (
            <div className={`solid-auth-brand ${align === "center" ? "is-center" : ""}`} aria-label={brandLabel}>
                {authLogoSrc ? (
                    <span className="solid-auth-brand-logo">
                        <img src={authLogoSrc} alt={brandLabel} />
                    </span>
                ) : null}
                {appName ? <span className="solid-auth-brand-text">{appName}</span> : null}
            </div>
        );
    };

    const authLayout = solidSettingsData?.data?.authPagesLayout || "center";
    const authTheme = layoutContext?.themeMode === "dark" ? "dark" : "light";
    const isCenter = authLayout === "center";
    const isLeft = authLayout === "left";
    const isRight = authLayout === "right";
    const authSettingsContextValue = useMemo(
        () => ({
            solidSettingsData,
            isLoadingAuthSettings,
            reloadAuthSettings: loadAuthSettings,
        }),
        [solidSettingsData, isLoadingAuthSettings, loadAuthSettings]
    );

    const formPane = (
        <div className="solid-auth-form-pane solid-login-dark-bg">
            <div className="solid-auth-form-pane-inner">
                {renderBrand("start")}
                {authChildren}
            </div>
        </div>
    );

    const imagePane = (
        <div
            className={`solid-auth-image-pane position-relative ${isLeft ? "solid-left-layout pane-on-right" : "solid-right-layout pane-on-left"}`.trim()}
            style={{ backgroundImage: `url(${solidSideBanner()})` }}
        >
            {solidSettingsData?.data?.appLogoPosition === "in_image_view" &&
                <div className={`solid-logo flex align-items-center gap-3 ${solidSettingsData?.data?.appLogoPosition}`}>
                    <Image
                        alt="solid logo"
                        src={solidSettingsData?.data?.appLogo || SolidLogo}
                        className="relative"
                        fill
                    />
                </div>
            }
            {solidSettingsData?.data?.showAuthContent &&
                <div className="w-full" style={{ zIndex: 1 }}>
                    <div className="grid">
                        <div className="col-8 mx-auto">
                            {solidSettingsData?.data?.appSubtitle && <h1 className="solid-auth-image-subtitle m-0">{solidSettingsData?.data?.appSubtitle}</h1>}
                            {solidSettingsData?.data?.appTitle && <h1 className="solid-auth-image-title mt-0">{solidSettingsData?.data?.appTitle}</h1>}
                            {solidSettingsData?.data?.appDescription && <p className="solid-auth-image-helper-text">{solidSettingsData?.data?.appDescription}</p>}
                        </div>
                    </div>
                </div>
            }
        </div>
    );

    return (
        <AuthSettingsContext.Provider value={authSettingsContextValue}>
        <div className={`solid-auth-theme-wrapper ${authLayout} auth-theme-${authTheme}`} data-auth-theme={authTheme}>
            {!isCenter && (
                <div className="solid-auth-split">
                    {isLeft && formPane}
                    {imagePane}
                    {isRight && formPane}
                </div>
            )}
            {isCenter && <div className="solid-center-layout">
                <div className="solid-auth-center-stack">
                    {renderBrand("center")}
                    {authChildren}
                </div>
            </div>}
            {/* {solidSettingsData?.data?.showLegalLinks === true && */}
            <div className={`absolute hidden md:flex ${solidSettingsData?.data?.authPagesLayout === 'center' ? 'solid-auth-footer flex flex-column sm:flex-row align-items-center justify-content-between' : 'solid-auth-footer-2 grid'}`}>
                {solidSettingsData?.data?.authPagesLayout !== 'left' &&
                    <div className={solidSettingsData?.data?.authPagesLayout !== 'center' ? 'col-6 lg:col-5  xl:col-6 flex justify-content-center' : ''}>
                        {solidSettingsData?.data?.showLegalLinks === true &&
                            <p className={`solid-auth-input-label text-sm m-0 ${solidSettingsData?.data?.authPagesLayout}`}>Made with <svg className="mx-1" width="12px" height="12px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z" fill="#ff0000"></path> </g></svg> in Mumbai</p>
                        }
                    </div>
                }
                <div className={solidSettingsData?.data?.authPagesLayout !== 'center' ? 'col-6 flex justify-content-center' : ''}>
                    {solidSettingsData?.data?.showLegalLinks === true && <div className={`flex flex-column sm:flex-row align-items-center gap-1 sm:gap-5 solid-auth-subtitle mr-3 ${solidSettingsData?.data?.authPagesLayout === 'left' ? 'left' : ''}`}>
                        {solidSettingsData?.data?.appTnc !== "" && <p className="m-0 "> <Link className="text-sm no-underline font-normal" href={solidSettingsData?.data?.appTnc}>Terms of Service</Link></p>}
                        {solidSettingsData?.data?.appPrivacyPolicy !== "" && <p className="m-0 "> <Link className="text-sm no-underline font-normal" href={solidSettingsData?.data?.appPrivacyPolicy}>Privacy Policy.</Link></p>}
                    </div>
                    }
                    {solidSettingsData?.data?.copyright !== "" &&
                        <div className="mt-1">
                            <p className="m-0 text-sm font-normal">{solidSettingsData?.data?.copyright}</p>
                        </div>
                    }
                </div>
                {
                    solidSettingsData?.data?.authPagesLayout === 'left' &&
                    <div className={solidSettingsData?.data?.authPagesLayout !== 'center' ? 'col-6 lg:col-5 xl:col-6  flex justify-content-center' : ''}>
                        {solidSettingsData?.data?.showLegalLinks === true &&
                            <p className={`solid-auth-input-label text-sm m-0 right`}>Made with <svg className="mx-1" width="12px" height="12px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z" fill="#ff0000"></path> </g></svg> in Mumbai</p>
                        }
                    </div>
                }
            </div >

            {/* } */}
            <SolidDialog
                visible={isRestricted}
                onHide={handleRegistration}
                header="Access Restricted"
                headerClassName="py-2" contentClassName="px-0 pb-0"
                className="solid-confirm-dialog "
                footer={
                    < div className="flex align-items-center justify-content-start" >
                        <SolidButton size="sm" onClick={handleRegistration}>Close</SolidButton>
                    </div >
                }
            >
                <SolidDivider className="m-0" />
                <div className="p-4">
                    <p>Sign-up is not available. Please contact the admin.</p>
                </div>
            </SolidDialog >
        </div >
        </AuthSettingsContext.Provider>
    )
}
