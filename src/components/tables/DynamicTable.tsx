"use client"
import Link from 'next/link';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useEffect, useState } from 'react';

interface Menu {
    id: string;
    name: string;
    tempField: string;
}

interface ColumnMeta {
    field: string;
    header: string;
}

interface Root {
    data: any
}
export const DynamicTable = (props: Root) => {
    const { data } = props;
    const [menus, setMenus] = useState<Menu[]>([]);
    const columns: ColumnMeta[] = [
        { field: 'id', header: 'ID' },
        { field: 'name', header: 'NAME' },
        { field: 'tempField', header: 'TEMPFIELD' },
    ];

    useEffect(() => {
        setMenus(data)
    }, []);

    const editBodyTemplate = (product: Menu) => {
        return <div className='flex gap-4'>
            <Link href={product.id} rel="noopener noreferrer" className="text-sm font-bold p-0" style={{ color: '#12415D' }}>
                <svg className='opacity-50' xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" fill="none" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#212134" fill-rule="evenodd" d="M23.604 3.514c.528.528.528 1.36 0 1.887l-2.622 2.607-4.99-4.99L18.6.396a1.322 1.322 0 0 1 1.887 0l3.118 3.118ZM0 24v-4.99l14.2-14.2 4.99 4.99L4.99 24H0Z" clip-rule="evenodd"></path></svg>
            </Link>
            <Button link onClick={() => console.log(product.id)} rel="noopener noreferrer" className="text-sm font-bold p-0" style={{ color: '#12415D' }}>
                <svg className='opacity-50' xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" fill="none" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#32324D" d="M3.236 6.149a.2.2 0 0 0-.197.233L6 24h12l2.96-17.618a.2.2 0 0 0-.196-.233H3.236ZM21.8 1.983c.11 0 .2.09.2.2v1.584a.2.2 0 0 1-.2.2H2.2a.2.2 0 0 1-.2-.2V2.183c0-.11.09-.2.2-.2h5.511c.9 0 1.631-1.09 1.631-1.983h5.316c0 .894.73 1.983 1.631 1.983H21.8Z"></path></svg>
            </Button>
        </div >
    };

    return (
        <div className="card">
            <DataTable size='small' className='text-sm' value={menus} tableStyle={{ minWidth: '50rem' }}>
                {columns.map((col, i) => (
                    <Column key={col.field} field={col.field} header={col.header} />
                ))}
                <Column key={'edit'} field={"edit"} body={editBodyTemplate} style={{ maxWidth: 100 }} headerStyle={{ height: 40 }} />
            </DataTable>
        </div>
    );
}