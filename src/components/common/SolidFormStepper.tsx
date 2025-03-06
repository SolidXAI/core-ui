"use client"
import { Button } from 'primereact/button'
import { OverlayPanel } from 'primereact/overlaypanel';
import React, { useRef } from 'react'

export const SolidFormStepper = () => {
    const formStepperOverlay = useRef(null);

    return (
        <div className='flex justify-content-end'>
            <Button type='button' severity='secondary' className='solid-step-button btn-step-first'>Step 1</Button>
            <Button type='button' className='solid-step-button btn-step'>Step 2</Button>
            <Button type='button' className='solid-step-button btn-step-last relative'>
                Step 3
                <div className='absolute' style={{ right: 8 }}>
                    <Button
                        type='button'
                        icon="pi pi-angle-down"
                        text
                        size='small'
                        style={{ height: 24, width: '1.5rem' }}
                        onClick={(e) =>
                            // @ts-ignore 
                            formStepperOverlay.current.toggle(e)
                        }
                    />
                    <OverlayPanel ref={formStepperOverlay} className="solid-custom-overlay solid-form-stepper-overlay">
                        <div className='flex flex-column gap-1 p-1'>
                            <Button
                                type='button'
                                label='Step 01'
                                size='small'
                                text
                            />
                            <Button
                                type='button'
                                label='Step 02'
                                size='small'
                                text
                            />
                            <Button
                                type='button'
                                label='Step 03'
                                size='small'
                                text
                            />
                            <Button
                                type='button'
                                label='Step 04'
                                size='small'
                                text
                            />
                            <Button
                                type='button'
                                label='Step 05'
                                size='small'
                                text
                            />
                        </div>
                    </OverlayPanel>
                </div>
            </Button>
        </div>
    )
}