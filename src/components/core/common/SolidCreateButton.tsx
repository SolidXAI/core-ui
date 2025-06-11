'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';

export const SolidCreateButton = ({ url, solidListViewLayout }: any) => {
    const pathName = usePathname();
    const createPath = url ? url : pathName.split('/').slice(0, -1).join('/') + '/form/new?viewMode=edit';

    return (
        <div>
            <Link href={createPath}>
                <Button type="button" icon={solidListViewLayout?.attrs?.addButtonIcon ? solidListViewLayout?.attrs?.addButtonIcon : "pi pi-plus"} label={solidListViewLayout?.attrs?.addButtonTitle ? solidListViewLayout?.attrs?.addButtonTitle : "Add"} className={`${solidListViewLayout?.attrs?.addButtonClassName}`} size='small'></Button>
            </Link>
        </div>
    )
}