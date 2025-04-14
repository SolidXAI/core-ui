"use client"
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react'
export const GoogleAuthChecking = () => {
    const searchParams = useSearchParams();
    const accessCode = searchParams.get("accessCode");

    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const toast = useRef<Toast>(null);
    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };
    useEffect(() => {
        const handleOAuthAuthentication = async () => {
            try {
                const response = await signIn("credentials", {
                    redirect: false,
                    accessCode: accessCode
                    // accessToken: accessToken?.accessToken,
                    // refreshToken: accessToken?.refreshToken
                });

                if (response?.error) {
                    showToast("error", "Login Error", response.error);
                    setError("Authentication failed.")
                } else {
                    showToast("success", "Login Success", "Redirecting to dashboard...");
                    router.push(`${process.env.NEXT_PUBLIC_LOGIN_REDIRECT_URL}`);
                }
            } catch (err: any) {
                showToast("error", "Login Error", err?.data?.message || "Authentication failed.");
            }
        };

        handleOAuthAuthentication();
    }, [router]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <h2 className="text-red-500 text-xl font-semibold">{error}</h2>
            </div>
        );
    }
    return (
        <div>
            <Toast ref={toast} />
            <ProgressSpinner />
        </div>
    )
}