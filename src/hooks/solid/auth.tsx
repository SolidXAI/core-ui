import React from "react";

type Session = {
    user?: {
        accessToken: string,
        refreshToken: string
    };
    error?: string;
    expires?: string;
} | null;

type UseSessionResult = {
    data: Session;
    status: "loading" | "authenticated" | "unauthenticated";
    update: () => Promise<Session>;
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
    return <>{children} </>;
}

export function useSession(): UseSessionResult {
    return {
        data: null,
        status: "unauthenticated",
        update: async () => null,
    };
}

export async function getSession(): Promise<Session> {
    return null;
}

export async function signIn(...args: any) {
    return {
        ok: true,
        error: null,
        status: 200,
        url: null,
    };
}

export async function signOut(...args: any) {
    return;
}
