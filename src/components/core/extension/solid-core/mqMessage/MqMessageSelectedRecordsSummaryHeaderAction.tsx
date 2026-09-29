import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { closePopup } from "../../../../../redux/features/popupSlice";
import {
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "../../../../shad-cn-ui";

const STAGES = ["pending", "scheduled", "started", "retry", "retrying", "failed", "succeeded"];

const formatDuration = (milliseconds: number | null) => {
  if (milliseconds === null || !Number.isFinite(milliseconds)) return "—";
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  if (milliseconds < 60_000) return `${(milliseconds / 1000).toFixed(2)} s`;
  return `${(milliseconds / 60_000).toFixed(2)} min`;
};

type Props = { selectedRecords?: any[] };

export default function MqMessageSelectedRecordsSummaryHeaderAction({ selectedRecords = [] }: Props) {
  const dispatch = useDispatch();
  const stageSummaries = useMemo(() => STAGES.map((stage) => {
    const records = selectedRecords.filter((record) => record?.stage === stage);
    const durations = records
      .map((record) => Number(record?.elapsedMillis))
      .filter((duration) => Number.isFinite(duration) && duration >= 0);
    const average = durations.length
      ? durations.reduce((total, duration) => total + duration, 0) / durations.length
      : null;
    return { stage, count: records.length, average, measuredCount: durations.length };
  }), [selectedRecords]);

  const totalMeasured = stageSummaries.reduce((total, summary) => total + summary.measuredCount, 0);
  const totalDuration = stageSummaries.reduce(
    (total, summary) => total + (summary.average ?? 0) * summary.measuredCount,
    0,
  );
  const averageDuration = totalMeasured ? totalDuration / totalMeasured : null;

  return (
    <>
      <SolidDialogHeader>
        <SolidDialogTitle>Selected queue messages</SolidDialogTitle>
        <SolidDialogClose aria-label="Close" onClick={() => dispatch(closePopup())} />
      </SolidDialogHeader>
      <SolidDialogSeparator />
      <SolidDialogBody>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Selected messages</div>
              <div className="mt-1 text-2xl font-semibold">{selectedRecords.length}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Average execution time</div>
              <div className="mt-1 text-2xl font-semibold">{formatDuration(averageDuration)}</div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Count</th>
                  <th className="px-4 py-3 text-right font-medium">Avg. execution time</th>
                </tr>
              </thead>
              <tbody>
                {stageSummaries.map(({ stage, count, average }) => (
                  <tr key={stage} className="border-t">
                    <th scope="row" className="px-4 py-3 font-medium capitalize">{stage}</th>
                    <td className="px-4 py-3 text-right tabular-nums">{count}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatDuration(average)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Average execution time uses selected messages with an elapsed time recorded.
          </p>
        </div>
      </SolidDialogBody>
    </>
  );
}
