'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';

export const SolidCreateButton = ({ url, solidListViewLayout, responsiveIconOnly = false }: any) => {
    const pathName = usePathname();
    const createPath = url
        ? url
        : pathName.split('/').slice(0, -1).join('/') + '/form/new?viewMode=edit';

    const icon = solidListViewLayout?.attrs?.addButtonIcon || "pi pi-plus";
    const label = solidListViewLayout?.attrs?.addButtonTitle || "Add";
    const className = solidListViewLayout?.attrs?.addButtonClassName || "";

    return (
        <div>
            <Link href={createPath}>
                {responsiveIconOnly ? (
                    <>
                        <Button
                            type="button"
                            icon={icon}
                            className={`${className} p-button-sm lg:hidden`}
                            size='small'
                        />

                        <Button
                            type="button"
                            icon={icon}
                            label={label}
                            className={`${className} hidden lg:inline-flex`}
                            size='small'

                        />
                    </>
                ) : (
                    <Button
                        type="button"
                        icon={icon}
                        label={label}
                        className={`${className}`}
                        size='small'
                    />
                )}

            </Link>
        </div>
    );
};
