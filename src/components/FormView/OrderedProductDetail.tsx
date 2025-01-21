import React from 'react'

export const OrderedProductDetail = () => {
    return (
        <div className="flex flex-row gap-3">
            <img className="w-8rem shadow-2 border-round" src={`https://primefaces.org/cdn/primereact/images/product/bamboo-watch.jpg`} alt='order' />
            <div className='flex flex-column justify-content-between'>
                <div>
                    <div className='text-xl font-semibold'>
                        EMS for RH, T and DP in Clean Room Area
                    </div>
                    <div className='text-xs max-w-25rem text-color-secondary'>
                        Lorem ipsum dolor sit amet consectetur. Aliquam et et nibh aliquam hendrerit. Diam amet etiam in consequat amet vitae.
                    </div>
                </div>
                <div className='text-sm font-semibold'>
                    Price: ₹ 17,500 <span className='font-normal text-xs text-color-secondary'>(incl. of all taxes)</span>
                </div>
            </div>
        </div>
    )
}