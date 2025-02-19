import { Button } from 'primereact/button'
import React from 'react'

export const SolidFormStepper = () => {
    return (
        <div className='flex justify-content-end'>
            <Button type='button' severity='secondary' className='solid-step-button btn-step-first'>Step 1</Button>
            <Button type='button' className='solid-step-button btn-step'>Step 2</Button>
            <Button type='button' className='solid-step-button btn-step-last'>Step 3</Button>
        </div>
    )
}