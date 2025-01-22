"use client"
import { Button } from 'primereact/button';
import { useState } from 'react';
import { OrderPaymentDetails } from './OrderPaymentDetails';
import { OrderTableDetails } from './OrderTableDetails';

export const DetailsViews = () => {
    const [details, setDetails] = useState("Product Details");
    const detailsData = [
        {
            title: 'Product Details',
            component: <OrderTableDetails />
        },
        {
            title: 'Payment Details',
            component: <OrderPaymentDetails />
        },
    ]
    return (
        <div className="">
            <div className='flex gap-3'>
                {detailsData.map((detail, i) => {
                    return (
                        <Button
                            key={i}
                            label={detail.title}
                            text={detail.title !== details ? true : false}
                            onClick={() => setDetails(detail.title)}
                            className={`outline-none ${details === detail.title ? 'surface-200 border-200 text-color outline-none' : 'text-color font-normal'}`}
                            size="small"
                        />
                    )
                })}
            </div>
            <div className='mt-3'>
                {detailsData.map((detail, i) => (
                    details === detail.title && (
                        <div key={i}>
                            {detail.component}
                        </div>
                    )
                ))}
            </div>
        </div>
    )
}