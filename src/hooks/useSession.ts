type Session = {
  user?: {
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
  expires?: string;
} | null;

type UseSessionResult = {
  data: Session;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<Session>;
};

export function useSession(): UseSessionResult {
  return {
    data: null,
    status: "unauthenticated",
    update: async () => null,
  };
}
