type Session = {
  user?: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
  expires?: string;
} | null;

export async function getSession(): Promise<Session> {
  return null;
}
