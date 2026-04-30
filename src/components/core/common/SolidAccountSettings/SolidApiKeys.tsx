import { useSession } from "../../../../hooks/useSession";
import { ApiKeysTab } from "../../users/ApiKeysTab";
import styles from "./SolidAccountSettings.module.css";

export function SolidApiKeys() {
  const { data: session } = useSession() as any;
  const userId = session?.user?.id;
  const canCreate = session?.user?.isAllowedToGenerateApiKeys ?? false;

  if (!userId) return null;

  return (
    <div className={styles.accountScroll} style={{ paddingBottom: 16 }}>
      <ApiKeysTab userId={String(userId)} canCreate={canCreate} />
    </div>
  );
}
