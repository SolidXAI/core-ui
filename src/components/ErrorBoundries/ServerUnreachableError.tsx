"use client"
import Image from "next/image";
import { Button } from "primereact/button";

// components/ServerError.tsx
export const ServerUnreachableError = ({ error }: any) => {
    return (
        <div className="flex flex-column align-items-center justify-content-center" style={{ height: '100vh' }}>
            <h1 className="font-bold">Server Error</h1>
            <p>{error?.code} - {error?.message}</p>
            <Button
                onClick={() => location.reload()}
                size="small"
            >
                Try Again
            </Button>
        </div>
    );
}