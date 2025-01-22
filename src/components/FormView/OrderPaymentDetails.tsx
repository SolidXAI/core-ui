"use client";

export const OrderPaymentDetails = () => {
    return (
        <div className='p-3 border-round-lg bg-cyan-50'>
            <div className='grid'>
                <div className='md:col-6 sm:col-12'>
                    <div className='text-sm text-500 md:w-6 w-full'>Payment Date : <span className='text-color'> Fri, 23 Aug 2024</span></div>
                    <div className='text-sm text-500 md:w-6 w-full mt-2'>Transaction ID : <span className='text-color'> IN2024/14</span></div>
                </div>
                <div className='md:col-6 sm:col-12'>
                    <div className='text-sm text-500 md:w-6 w-full'>Payment Mode : <span className='text-color'> Fri, 23 Aug 2024</span></div>
                    <div className='text-sm text-500 md:w-6 w-full mt-2'>Amount : <span className='text-color'>₹ 1199.00</span></div>
                </div>
            </div>
        </div>
    )
}