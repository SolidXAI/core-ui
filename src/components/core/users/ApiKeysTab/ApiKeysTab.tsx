import { useState } from "react";
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
}: {
  keys: ApiKeyRecord[];
  onToggleActive: (key: ApiKeyRecord) => void;
  isTogglingId: string | null;
}) {
  if (keys.length === 0) {
    return (
      <div
        className="flex flex-column align-items-center justify-content-center gap-3 py-6"
        style={{ color: "var(--solid-text-secondary, #888)" }}
      >
        <KeyRound size={32} strokeWidth={1.5} />
        <div className="text-center">
          <p className="m-0" style={{ fontSize: 14, fontWeight: 500 }}>
            No API keys
          </p>
          <p className="m-0 mt-1" style={{ fontSize: 12 }}>
            Generate a key to enable programmatic access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
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
            <th className="solid-api-keys-th" style={{ textAlign: "right" }}>Active</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const expiryStatus = getExpiryStatus(key.expiresAt);
            const isExpired = expiryStatus === "expired";

            return (
              <tr key={key.id} className={isExpired ? "solid-api-keys-row--expired" : undefined}>
                <td className="solid-api-keys-td">
                  <span style={{ fontWeight: 500 }}>{key.name}</span>
                </td>

                <td className="solid-api-keys-td">
                  <code
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      background: "var(--solid-surface-secondary, #f5f5f5)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {key.maskedKey}
                  </code>
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

                <td
                  className="solid-api-keys-td"
                  style={{
                    color:
                      expiryStatus === "expired"
                        ? "var(--solid-danger-color, #ef4444)"
                        : expiryStatus === "expiring-soon"
                        ? "var(--solid-warn-color, #f59e0b)"
                        : undefined,
                  }}
                >
                  {expiryStatus === "never" ? (
                    <span style={{ color: "var(--solid-text-secondary, #888)" }}>Never</span>
                  ) : (
                    formatDate(key.expiresAt)
                  )}
                </td>

                <td className="solid-api-keys-td" style={{ color: "var(--solid-text-secondary, #888)" }}>
                  {formatDate(key.lastUsedAt)}
                </td>

                <td className="solid-api-keys-td" style={{ textAlign: "right" }}>
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
  );
}

interface ApiKeysTabProps {
  userId: string;
  canCreate?: boolean;
}

export function ApiKeysTab({ userId, canCreate = false }: ApiKeysTabProps) {
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useGetUserApiKeysQuery(userId);
  const [updateApiKey] = useUpdateApiKeyMutation();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [revealKey, setRevealKey] = useState<{ apiKey: string; keyName: string } | null>(null);

  const keys: ApiKeyRecord[] = data?.data?.apiKeys ?? [];

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
        <div className="flex align-items-center justify-content-between mb-4">
          <div>
            <p className="m-0" style={{ fontWeight: 600, fontSize: 14 }}>
              API Keys
            </p>
            <p className="m-0 mt-1" style={{ fontSize: 12, color: "var(--solid-text-secondary, #888)" }}>
              Keys grant programmatic access. Store them securely — they are shown only once.
            </p>
          </div>
          {canCreate && (
            <SolidButton size="small" type="button" onClick={() => setShowGenerate(true)}>
              <Plus size={14} />
              Generate Key
            </SolidButton>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-content-center py-5">
            <SolidSpinner />
          </div>
        ) : isError && keys.length === 0 ? (
          <div
            className="flex flex-column align-items-center justify-content-center gap-2 py-5"
            style={{ color: "var(--solid-text-secondary, #888)", fontSize: 13 }}
          >
            <p className="m-0">Something went wrong while loading API keys.</p>
            <p className="m-0">Please refresh the page and try again.</p>
          </div>
        ) : (
          <ApiKeysTable keys={keys} onToggleActive={handleToggle} isTogglingId={togglingId} />
        )}
      </div>

      <GenerateApiKeyModal
        open={showGenerate}
        userId={Number(userId)}
        onClose={() => setShowGenerate(false)}
        onCreated={(apiKey, keyName) => {
          setShowGenerate(false);
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
