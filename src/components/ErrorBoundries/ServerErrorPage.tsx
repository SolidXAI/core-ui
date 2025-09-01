"use client"
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

export const ServerErrorPage = () => {
    const params = useParams();
    const router = useRouter();
    // console.log("ServerErrorPage", params?.error);

    return (
        <div style={{ height: '100vh' }} className='flex flex-column align-items-center justify-content-center'>
            <h1 className="font-bold">Maintenance is in Progress</h1>
            <p>
                The application is currently undergoing maintenance. Please check back later!
            </p>
            <div>
                <Button label='Back to Home' size='small' onClick={() => router.back()} />
            </div>
        </div>
    )
}