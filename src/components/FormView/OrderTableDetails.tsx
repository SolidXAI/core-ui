import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import React from 'react'

export const OrderTableDetails = () => {
    const orderedProduct = [{
        id: '1000',
        name: 'EMS for RH, T and DP in Clean Room Area',
        image: 'bamboo-watch.jpg',
        price: 15000,
        taxes: 18,
        quantity: 24,
        discountAmount: 200,
        totalAmount: 17500
    }]
    const productBodyTemplate = (product: any) => {
        return (
            <div className='flex gap-3'>
                <img src={`https://primefaces.org/cdn/primereact/images/product/${product.image}`} alt={product.image} className="w-3rem shadow-2 border-round" />
                <div className='text-sm font-bold'>{product.name}</div>
            </div>
        )
    };

    const headerClass = "font-normal";
    return (
        <DataTable value={orderedProduct} tableStyle={{ minWidth: '60rem' }}>
            <Column field='products' header="Products" body={productBodyTemplate} headerClassName={headerClass} className='max-w-14rem'></Column>
            <Column field='quantity' header="Quantity" headerClassName={headerClass} className='font-semibold'></Column>
            <Column field='price' header="Price" headerClassName={headerClass} className='font-semibold'></Column>
            <Column field='taxes' header="Taxes(%)" headerClassName={headerClass} className='font-semibold'></Column>
            <Column field='discountAmount' header="Discount Amount" headerClassName={headerClass} className='font-semibold'></Column>
            <Column field='totalAmount' header="Total Amount" headerClassName={headerClass} className='font-semibold'></Column>
        </DataTable>
    )
}