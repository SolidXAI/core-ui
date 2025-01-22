import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

export const SolidCreateButton = ({ url }: any) => {
    const router = useRouter();
    const pathName = usePathname();

    const createPath = url ? url : pathName.split('/').slice(0, -1).join('/') + '/form/new';


    return (
        <div>
            <Link href={createPath}>
              <Button type="button" icon="pi pi-plus" label="Add" size='small'  className='small-button' ></Button>
            </Link>
        </div>
    )
}