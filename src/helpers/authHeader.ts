import { cookies } from "next/headers";

export const getAuthCookieName = () =>
  process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export const getAuthHeader = () => {
  const nextCookies = cookies();
  const cookieName = getAuthCookieName();

  const nextAuthSessionToken = nextCookies.get(cookieName);

  return {
    headers: {
      Cookie: `${nextAuthSessionToken?.name}=${nextAuthSessionToken?.value}`,
    },
  };
};
