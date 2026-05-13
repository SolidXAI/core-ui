import { jwtDecode } from "jwt-decode";
import { saveSession } from "./storage";
import { eventBus, AppEvents } from "../../helpers/eventBus";
import { Session } from "./types";

type AuthResult = {
    ok: boolean;
    error: string | null;
    status: number;
    url: string | null;
};

export function handleAuthSuccess(accessToken:string , refreshToken: string , user: any ,status:any): AuthResult{

    // const accessToken = response?.data?.data?.accessToken;
    // const refreshToken = response?.data?.data?.refreshToken;
    // const user = response?.data?.data?.user || {};

    if (!accessToken || !refreshToken) {
        return { ok: false, error: "Missing tokens in response", status:status || 500, url: null };
    }

    const decoded = jwtDecode<{ exp?: number }>(accessToken);
    const accessTokenExpires = decoded.exp ? decoded.exp * 1000 : undefined;

    const session: Session = {
        user: {
            ...user,
            accessToken,
            refreshToken,
            accessTokenExpires,
        },
        error: null,
        refreshed: false,
    };

    saveSession(session);
    eventBus.emit(AppEvents.SessionUpdated, session);

    return {
        ok: true,
        error: null,
        status: status,
        url: null,
    };

}