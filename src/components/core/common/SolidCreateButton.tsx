'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from 'primereact/button';

export const SolidCreateButton = ({ url, title }: any) => {
    const pathName = usePathname();
    const createPath = url ? url : pathName.split('/').slice(0, -1).join('/') + '/form/new?viewMode=edit';

    return (
        <div>
            <Link href={createPath}>
                <Button type="button" icon="pi pi-plus" label={`Add ${title ? title : ''}`} size='small'></Button>
            </Link>
        </div>
    )
}