import { Button } from 'primereact/button'
import React from 'react'

export const DropzoneUpload = () => {
    return (
        <div className='text-center mt-2'>
            <Button type='button' label="Click here to Upload" className='no-underline' size='small' text raised={false}/>
        </div>
    )
}