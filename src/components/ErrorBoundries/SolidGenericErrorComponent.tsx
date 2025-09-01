"use client"
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';

export const SolidGenericErrorComponent = ({ error, height }: any) => {
    const router = useRouter();

    const status = error?.status;

    const getErrorInfo = (status: number) => {
        switch (status) {
            case 400:
                return { title: '400 - Bad Request', message: 'The server could not understand the request.' };
            case 404:
                return { title: '404 - Not Found', message: 'The requested resource could not be found.' };
            case 500:
                return { title: '500 - Internal Server Error', message: 'Something went wrong on the server.' };
            default:
                return { title: `${status} - Error`, message: 'An unexpected error occurred.' };
        }
    };

    const { title, message } = getErrorInfo(status);

    return (
        <div className='flex flex-column align-items-center justify-content-center' style={{ height: height ? height : '100%' }}>
            <h3 className="font-bold">{title}</h3>
            <p>
                {message}
            </p>
            <div>
                <Button label='Back to Home' size='small' onClick={() => router.back()} />
            </div>
        </div>
    )
}