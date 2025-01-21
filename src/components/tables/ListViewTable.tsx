"use client"
import React, { useState, useEffect } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column';
import { DemoService } from './DemoData';
import { CustomTag } from '../Tag/CustomTag';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Calendar, CalendarViewChangeEvent } from 'primereact/calendar';
import { InputNumber, InputNumberChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { FilterIcon } from '../modelsComponents/filterIcon';
const defaultFilters: DataTableFilterMeta = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    date: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }],
    },
    price: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    quantity: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    orderStatus: {
        operator: FilterOperator.OR,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
};
export interface Product {
    id: string;
    date: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    orderStatus: string;
    slug: string;
}
export const ListViewTable = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters);
    const [selectedProducts, setSelectedProducts] = useState<Product[] | null>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState<string>('');
    const [statuses] = useState<string[]>(['Delivered', 'On The Way', 'Cancelled', 'Returned']);
    const clearFilter = () => {
        initFilters();
    };
    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        // @ts-ignore
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };
    const initFilters = () => {
        setFilters(defaultFilters);
        setGlobalFilterValue('');
    };
    useEffect(() => {
        DemoService.getDemos().then((data) => setProducts(data));
    }, []);
    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };
    const priceBodyTemplate = (product: Product) => {
        return formatCurrency(product.price);
    };
    const imageBodyTemplate = (product: Product) => {
        return <img src={`https://primefaces.org/cdn/primereact/images/product/${product.image}`} alt={product.image} className="w-3rem shadow-2 border-round" />;
    };
    const statusBodyTemplate = (product: Product) => {
        return <div>
            <CustomTag className={''} value={product.orderStatus} severity={product.orderStatus} />
        </div>
    };
    const detailsBodyTemplate = (product: Product) => {
        return <a href={`${product.slug}`} rel="noopener noreferrer" className="text-sm font-bold p-0" style={{ color: '#12415D' }}>
            View Details
        </a>
    };
    const quantityBodyTemplate = (product: Product) => {
        return <p className="text-sm m-0" style={{ color: '#197EF7' }}>
            {product.quantity < 10 ? `0${product.quantity}` : product.quantity}
        </p>
    };
    const statusItemTemplate = (option: string) => {
        return <CustomTag className={''} value={option} severity={option} />;
    };
    const statusFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return <Dropdown value={options.value} options={statuses} onChange={(e: DropdownChangeEvent) => options.filterCallback(e.value, options.index)} itemTemplate={statusItemTemplate} placeholder="Select One" className="p-column-filter" showClear />;
    };
    const formatDate = (value: Date) => {
        return value.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    const dateBodyTemplate = (rowData: Product) => {
        return formatDate(new Date(rowData.date));
    };
    const dateFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return <Calendar value={options.value} onChange={(e: any) => options.filterCallback(e.value, options.index)} dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" mask="99/99/9999" />;
    };
    const priceFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return <InputNumber value={options.value} onChange={(e: InputNumberChangeEvent) => options.filterCallback(e.value, options.index)} mode="currency" currency="INR" locale="en-IN" />;
    };
    const quantityFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
        return <InputNumber value={options.value} onChange={(e: InputNumberChangeEvent) => options.filterCallback(e.value, options.index)} />;
    };
    return (
        <div className="">
              <div className="form-wrapper-title mb-5">All</div>
            <div className='flex gap-3 mb-3'>

                {selectedProducts?.length ?
                    <div className='flex gap-3 mb-3'>
                        <p className='text-xs'>{selectedProducts.length} entry selected</p>
                        <Button severity="danger" label='Delete' size='small' outlined>
                        </Button>
                    </div>
                    : null
                }
                <Button type="button" icon="pi pi-filter-slash" label="Clear" size='small' outlined onClick={clearFilter} className='mb-3' />
            </div>
            <DataTable
                value={products} tableStyle={{ minWidth: '60rem' }} size='small' paginator rows={10}
                dataKey="id"
                filters={filters} globalFilterFields={['name', 'orderStatus', 'price', "date"]}
                emptyMessage="No Product found." onFilter={(e) => setFilters(e.filters)}
                filterIcon={() => <FilterIcon />}
                selectionMode={'checkbox'}
                selection={selectedProducts|| []}
                onSelectionChange={(e) => setSelectedProducts(e.value)}
            >
                <Column selectionMode="multiple" headerStyle={{ width: '4rem' }}></Column>
                <Column header="Product Image" body={imageBodyTemplate}></Column>
                <Column field="name" filter header="Product Name" className='text-sm' filterPlaceholder="Search by Product Name" ></Column>
                <Column field="date" filterField="date" dataType="date" header="Date" className='text-sm' body={dateBodyTemplate} filter filterElement={dateFilterTemplate}></Column>
                <Column header="Quantity" filterField="quantity" body={quantityBodyTemplate} filter filterElement={quantityFilterTemplate}></Column>
                <Column field="price" filterField="price" dataType="numeric" header="Price" body={priceBodyTemplate} className='text-sm' filter filterElement={priceFilterTemplate} ></Column>
                <Column field="orderStatus" header="Status" body={statusBodyTemplate} filter filterElement={statusFilterTemplate} ></Column>
                <Column body={detailsBodyTemplate}></Column>
            </DataTable>
        </div>
    )
}