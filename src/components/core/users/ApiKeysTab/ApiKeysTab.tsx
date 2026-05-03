import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { KeyRound, Plus } from "lucide-react";
import "./ApiKeysTab.css";
import { SolidButton, SolidSpinner, SolidSwitch, SolidTag } from "../../../shad-cn-ui";
import { showToast } from "../../../../redux/features/toastSlice";
import {
  useGetUserApiKeysQuery,
  useUpdateApiKeyMutation,
  type ApiKeyRecord,
} from "../../../../redux/api/apiKeyApi";
import { GenerateApiKeyModal } from "./GenerateApiKeyModal";
import { RevealApiKeyModal } from "./RevealApiKeyModal";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getExpiryStatus(expiresAt: string | null): "expired" | "expiring-soon" | "ok" | "never" {
  if (!expiresAt) return "never";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff < 0) return "expired";
  if (diff < 7 * 24 * 60 * 60 * 1000) return "expiring-soon";
  return "ok";
}

function ApiKeysTable({
  keys,
  onToggleActive,
  isTogglingId,
  onGenerateFirstKey,
  canCreate,
}: {
  keys: ApiKeyRecord[];
  onToggleActive: (key: ApiKeyRecord) => void;
  isTogglingId: string | null;
  onGenerateFirstKey: () => void;
  canCreate: boolean;
}) {
  if (keys.length === 0) {
    return (
      <div className="solid-api-keys-empty">
        <div className="solid-api-keys-empty-icon">
          <KeyRound size={30} strokeWidth={1.6} />
        </div>
        <div className="text-center">
          <p className="solid-api-keys-empty-title m-0">No API keys yet</p>
          <p className="solid-api-keys-empty-copy m-0">
            {canCreate
              ? "Generate a key to enable secure programmatic access for this user."
              : "API key generation is disabled for this user account."}
          </p>
        </div>
        {canCreate ? (
          <SolidButton type="button" onClick={onGenerateFirstKey}>
            <Plus size={14} />
            Generate First Key
          </SolidButton>
        ) : null}
      </div>
    );
  }

  return (
    <div className="solid-api-keys-table-shell">
      <div className="solid-api-keys-table-wrap">
        <table className="solid-api-keys-table">
        <colgroup>
          <col style={{ width: "18%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="solid-api-keys-th">Name</th>
            <th className="solid-api-keys-th">Key</th>
            <th className="solid-api-keys-th">Status</th>
            <th className="solid-api-keys-th">Expires</th>
            <th className="solid-api-keys-th">Last Used</th>
            <th className="solid-api-keys-th solid-api-keys-th--right">Active</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const expiryStatus = getExpiryStatus(key.expiresAt);
            const isExpired = expiryStatus === "expired";

            return (
              <tr key={key.id} className={isExpired ? "solid-api-keys-row--expired" : undefined}>
                <td className="solid-api-keys-td">
                  <span className="solid-api-keys-name">{key.name}</span>
                </td>

                <td className="solid-api-keys-td">
                  <code className="solid-api-keys-code">{key.maskedKey}</code>
                </td>

                <td className="solid-api-keys-td">
                  {isExpired ? (
                    <SolidTag tone="danger">Expired</SolidTag>
                  ) : !key.isActive ? (
                    <SolidTag tone="warn">Inactive</SolidTag>
                  ) : expiryStatus === "expiring-soon" ? (
                    <SolidTag tone="warn">Expiring soon</SolidTag>
                  ) : (
                    <SolidTag tone="success">Active</SolidTag>
                  )}
                </td>

                <td className={`solid-api-keys-td ${expiryStatus === "expired" ? "solid-api-keys-date--expired" : ""} ${expiryStatus === "expiring-soon" ? "solid-api-keys-date--warning" : ""}`}>
                  {expiryStatus === "never" ? (
                    <span className="solid-api-keys-muted">Never</span>
                  ) : (
                    formatDate(key.expiresAt)
                  )}
                </td>

                <td className="solid-api-keys-td solid-api-keys-muted">
                  {formatDate(key.lastUsedAt)}
                </td>

                <td className="solid-api-keys-td solid-api-keys-td--right">
                  {isTogglingId === key.id ? (
                    <SolidSpinner />
                  ) : (
                    <SolidSwitch
                      checked={key.isActive}
                      disabled={isExpired}
                      onChange={() => onToggleActive(key)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}

interface ApiKeysTabProps {
  userId: string;
  canCreate?: boolean;
}

export function ApiKeysTab({ userId, canCreate = false }: ApiKeysTabProps) {
  const dispatch = useDispatch();
  const { data, isLoading, isError, refetch } = useGetUserApiKeysQuery(userId);
  const [updateApiKey] = useUpdateApiKeyMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [revealKey, setRevealKey] = useState<{ apiKey: string; keyName: string } | null>(null);
  const [optimisticKeys, setOptimisticKeys] = useState<ApiKeyRecord[]>([]);

  const keys = useMemo(() => {
    const serverKeys = data?.data?.apiKeys ?? [];
    const merged = [...optimisticKeys.filter((key) => !serverKeys.some((serverKey) => serverKey.id === key.id)), ...serverKeys];
    return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data?.data?.apiKeys, optimisticKeys]);

  const handleToggle = async (key: ApiKeyRecord) => {
    setTogglingId(key.id);
    try {
      await updateApiKey({ id: key.id, isActive: !key.isActive }).unwrap();
      dispatch(
        showToast({
          severity: "success",
          summary: "Updated",
          detail: `API key "${key.name}" ${!key.isActive ? "activated" : "deactivated"}.`,
        })
      );
    } catch (err: any) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Error",
          detail: err?.data?.message || "Failed to update API key.",
        })
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <div className="solid-api-keys-tab">
        <div className="solid-api-keys-hero">
          <div className="solid-api-keys-copy">
            <p className="solid-api-keys-title m-0">API Keys</p>
            <p className="solid-api-keys-subtitle m-0">
              Keys grant programmatic access. Store them securely — they are shown only once.
            </p>
          </div>
          <div className="solid-api-keys-actions">
            <span className="solid-api-keys-count">{keys.length} key{keys.length === 1 ? "" : "s"}</span>
            {canCreate ? (
              <SolidButton size="small" type="button" onClick={() => setShowGenerate(true)}>
                <Plus size={14} />
                Generate Key
              </SolidButton>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="solid-api-keys-state">
            <SolidSpinner />
          </div>
        ) : isError && keys.length === 0 ? (
          <div className="solid-api-keys-error">
            <p className="m-0">Something went wrong while loading API keys.</p>
            <p className="m-0">Please refresh the page and try again.</p>
          </div>
        ) : (
          <ApiKeysTable
            keys={keys}
            onToggleActive={handleToggle}
            isTogglingId={togglingId}
            onGenerateFirstKey={() => setShowGenerate(true)}
            canCreate={canCreate}
          />
        )}
      </div>

      <GenerateApiKeyModal
        open={showGenerate}
        userId={Number(userId)}
        onClose={() => setShowGenerate(false)}
        onCreated={(apiKey, keyName, record) => {
          setShowGenerate(false);
          setOptimisticKeys((previous) => [record, ...previous.filter((existing) => existing.id !== record.id)]);
          void refetch();
          setRevealKey({ apiKey, keyName });
        }}
      />

      {revealKey && (
        <RevealApiKeyModal
          open={true}
          apiKey={revealKey.apiKey}
          keyName={revealKey.keyName}
          onClose={() => setRevealKey(null)}
        />
      )}
    </>
  );
}
