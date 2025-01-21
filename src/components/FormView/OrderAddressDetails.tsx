import React from 'react'

export const OrderAddressDetails = () => {
    const AddressCard = () => {
        return (
            <div>
                <p className='text-sm font-semibold'>
                    Rohit
                </p>
                <div className='text-sm font-semibold'>
                    Address:
                </div>
                <div className="text-sm max-w-15rem">
                    Flat No. 202, Rose Apartments,
                    Sector 12, Kandivali (East), Mumbai,
                    Maharashtra - 400001, India
                </div>
            </div>
        )
    }
    const orderData = [
        {
            key: 'Order Date',
            value: 'Fri, 3 July 2024'
        },
        {
            key: 'Order ID',
            value: 'IN2024/14'
        },
        {
            key: 'Expected Delivery',
            value: 'Fri, 23 Aug 2024'
        },
        {
            key: 'Tracking id',
            value: 'F25656151651'
        },
        {
            key: 'Total Amount',
            value: '₹ 1199.00'
        },
    ]
    return (
        <div className="grid">
            <div className="col-6">
                <div className="text-sm text-color-secondary">Customer</div>
                <AddressCard />
                <p className="text-sm text-color-secondary">Delivery Address</p>
                <AddressCard />
                <p className='text-sm mb-0'>
                    <span className='font-semibold'>Mobile number: </span>+91 95635 02322
                </p>
            </div>
            <div className="col-6">
                <div className='w-5'>
                    {orderData.map((order, index) => (
                        <div className="grid">
                            <div className='col-6 text-sm text-color-secondary'>
                                {order.key}:
                            </div>
                            <div className='col-6 text-sm'>
                                {order.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}