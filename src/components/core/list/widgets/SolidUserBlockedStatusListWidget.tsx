import { getSettingsMap } from "../../../../helpers/settingsPayload";
import { useGetSolidSettingsQuery } from "../../../../redux/api/solidSettingsApi";
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export const SolidUserBlockedStatusListWidget = ({ rowData }: SolidListFieldWidgetProps) => {
  const { data: solidSettingsData } = useGetSolidSettingsQuery(undefined);
  const settingsMap = getSettingsMap(solidSettingsData);

  const maxFailedLoginAttempts = toNumber(settingsMap?.maxFailedLoginAttempts);
  const failedLoginAttempts = toNumber(rowData?.failedLoginAttempts) ?? 0;
  const isBlocked =
    maxFailedLoginAttempts !== null && maxFailedLoginAttempts > 0 && failedLoginAttempts >= maxFailedLoginAttempts;

  return (
    isBlocked ?
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0.2rem 0.5rem",
          borderRadius: "999px",
          fontSize: "0.75rem",
          fontWeight: 600,
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          // backgroundColor: isBlocked ? "#fee2e2" : "#dcfce7",
          // color: isBlocked ? "#991b1b" : "#166534",
        }}
      >
        Blocked
      </span> :
      <></>
  );
};

