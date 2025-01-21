import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import React from 'react'

export const FooterForm = () => {
    return (
        <div className='grid'>
            <div className='lg:col-4 sm:col-12'>
                <InputText placeholder='Your name' className='bg-transparent footer-input-border text-white h-4rem' />
            </div>
            <div className='lg:col-8 sm:col-12'>
                <div className='footer-input-border border-white border-1 relative'>
                    <InputText placeholder='Your email address' className='bg-transparent footer-input-border border-none text-white h-4rem w-full' />
                    <Button label='Subscribe' rounded className='absolute right-0 top-50 mr-2 bg-white text-color border-none' style={{transform:'translateY(-50%)'}}/>
                </div>
            </div>
        </div>
    )
}