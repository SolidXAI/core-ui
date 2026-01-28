import { useEffect, useState } from "react";
import { loadSession } from "../adapters/auth/storage";
import { getSession } from "../adapters/auth/getSession";
import type { Session } from "../adapters/auth/types";

type UseSessionResult = {
  data: Session;
  status: "loading" | "authenticated" | "unauthenticated";
  update: () => Promise<Session>;
};

export function useSession(): UseSessionResult {
  const [data, setData] = useState<Session>(() => loadSession());
  const [status, setStatus] = useState<UseSessionResult["status"]>(
    data?.user?.accessToken ? "authenticated" : "unauthenticated"
  );

  const update = async () => {
    setStatus("loading");
    const session = await getSession();
    setData(session);
    setStatus(session?.user?.accessToken ? "authenticated" : "unauthenticated");
    return session;
  };

  useEffect(() => {
    update();
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== "solidx.session") return;
      const session = loadSession();
      setData(session);
      setStatus(session?.user?.accessToken ? "authenticated" : "unauthenticated");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { data, status, update };
}
