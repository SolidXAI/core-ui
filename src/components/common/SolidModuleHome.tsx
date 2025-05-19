"use client"
import { useSession } from 'next-auth/react'
import styles from './solidModuleHome.module.css'
import { Button } from 'primereact/button';
import { DocsSvg } from '../Svg/DocsSvg';
import { SettingsSvg } from '../Svg/SettingsSvg';
import { DevDocs } from '../Svg/DevDocs';
import { FieldSvg } from '../Svg/FieldSvg';
import { ModelSvg } from '../Svg/ModelSvg';
import { ModuleSvg } from '../Svg/ModuleSvg';
import { HomePageModuleSvg } from '../Svg/HomePageModuleSvg';
export const SolidModuleHome = () => {
    const { data: session, status } = useSession();
    //@ts-ignore
    const user = session?.user?.user?.username;

    return (
        <div className="h-screen surface-0">
            <div className="page-header" style={{ borderBottom: '1px solid var(--primary-light-color)' }}>
                <p className="m-0 view-title">
                    Dashboard
                </p>
            </div>
            <div></div>
            <div className="p-5 flex flex-column gap-4">
                <div className={styles.solidModuleWelcomeSection}>
                    <div className='flex flex-column gap-2'>
                        <h3 className={styles.solidModuleHomeTitle1}>
                            Welcome, {status === "loading" ? "..." : user}
                        </h3>
                        <p className='m-0 w-30rem text-sm'>
                            Lorem ipsum dolor sit amet consectetur. Rhoncus commodo ullamcorper posuere morbi vulputate vitae enim.
                        </p>
                        <div className='mt-2'>
                            <Button size='small' label='View Profile' />
                        </div>
                    </div>
                    <div className={styles.homeSvg}>
                        <HomePageModuleSvg />
                    </div>
                </div>
                <div className='grid'>
                    <div className='col'>
                        <div className={`${styles.solidModuleHomeColorCards} ${styles.dashboardCardOne}`}>
                            <div>
                                <div className={styles.solidModuleHomeCardSvgWrapper}>
                                    <DocsSvg />
                                </div>
                                <h3 className={`${styles.solidModuleHomeTitle1} mt-4`}>
                                    Admin Docs
                                </h3>
                                <p className='mb-0 mt-2 text-xs'>
                                    Lorem ipsum dolor sit amet consectetur. Rhoncus commodo ullamcorper posuere morbi vulputate vitae enim.
                                </p>
                            </div>
                            <div>
                                <Button outlined label='Add' size='small' icon="pi pi-plus" iconPos='right' className="font-bold" style={{ background: 'var(--solid-module-home-add-button-bg)' }} />
                            </div>
                        </div>
                    </div>
                    <div className='col'>
                        <div className={`${styles.solidModuleHomeColorCards} ${styles.dashboardCardTwo}`}>
                            <div>
                                <div className={styles.solidModuleHomeCardSvgWrapper}>
                                    <DevDocs />
                                </div>
                                <h3 className={`${styles.solidModuleHomeTitle1} mt-4`}>
                                    Dev Docs
                                </h3>
                                <p className='mb-0 mt-2 text-xs'>
                                    Lorem ipsum dolor sit amet consectetur. Rhoncus commodo ullamcorper posuere morbi vulputate vitae enim.
                                </p>
                            </div>
                            <div>
                                <Button outlined label='Add' size='small' icon="pi pi-plus" iconPos='right' className="font-bold" style={{ background: 'var(--solid-module-home-add-button-bg)' }} />
                            </div>
                        </div>
                    </div>
                    <div className='col'>
                        <div className={`${styles.solidModuleHomeColorCards} ${styles.dashboardCardThree}`}>
                            <div>
                                <div className={styles.solidModuleHomeCardSvgWrapper}>
                                    <SettingsSvg />
                                </div>
                                <h3 className={`${styles.solidModuleHomeTitle1} mt-4`}>
                                    Settings
                                </h3>
                                <p className='mb-0 mt-2 text-xs'>
                                    Lorem ipsum dolor sit amet consectetur. Rhoncus commodo ullamcorper posuere morbi vulputate vitae enim.
                                </p>
                            </div>
                            <div>
                                <Button outlined label='Add' size='small' icon="pi pi-plus" iconPos='right' className="font-bold" style={{ background: 'var(--solid-module-home-add-button-bg)' }} />
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h5 className='font-bold'>
                        Action
                    </h5>

                    <div className='grid'>
                        <div className='col'>
                            <div className={`${styles.solidModuleHomeActionCard}`}>
                                <div>
                                    <div className={styles.solidModuleHomeActionCardSvgWrapper}>
                                        <ModuleSvg />
                                    </div>
                                    <h3 className={`${styles.solidModuleHomeTitle1} mt-4`}>
                                        Add Module
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className='col'>
                            <div className={`${styles.solidModuleHomeActionCard}`}>
                                <div>
                                    <div className={styles.solidModuleHomeActionCardSvgWrapper}>
                                        <ModelSvg />
                                    </div>
                                    <h3 className={`${styles.solidModuleHomeTitle1} mt-4`}>
                                        Add Model
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className='col'>
                            <div className={`${styles.solidModuleHomeActionCard}`}>
                                <div>
                                    <div className={styles.solidModuleHomeActionCardSvgWrapper}>
                                        <FieldSvg />
                                    </div>
                                    <h3 className={`${styles.solidModuleHomeTitle1} mt-4`}>
                                        Add Field
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}