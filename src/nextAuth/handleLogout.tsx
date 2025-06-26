import axios, { AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';

export async function handleLogout({ toast }: any) {
    const session = await getSession();
    const token = session?.user?.accessToken;

    try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/iam/logout`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log("logout response", response);

        if (response?.data?.statusCode === 200) {
            await signOut({ callbackUrl: '/auth/login' });
        } else {
            toast?.current?.show({
                severity: 'error',
                summary: 'Logout Failed',
                detail: `${response?.data?.data?.status}`,
                life: 3000,
            });
        }
    } catch (error) {
        const err = error as any;
        const message =
            err.response?.data?.data?.message || err.message || 'Logout failed';

        toast?.current?.show({
            severity: 'error',
            summary: 'Logout Failed',
            detail: message,
            life: 3000,
        });
    }
}