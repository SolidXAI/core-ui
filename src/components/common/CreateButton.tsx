"use client";
import { usePathname, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

export const CreateButton = () => {
    const router = useRouter();
    const pathName = usePathname();
    // console.log("pathname", pathName);
    
    const createPAth = pathName.split('/').slice(0, -1).join('/') + '/create';

    return (
        <div>
            <Button type="button" icon="pi pi-plus" label="Add" size='small' onClick={() => router.push(createPAth)} className='small-button'/>
        </div>
    )
}