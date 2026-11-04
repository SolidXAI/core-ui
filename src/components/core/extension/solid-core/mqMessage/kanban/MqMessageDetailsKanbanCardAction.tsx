import { useDispatch } from "react-redux";
import type { SolidKanbanCardActionProps } from "../../../../../../types/list-row-action";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import {
  SolidButton,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from "../../../../../shad-cn-ui";

const display = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function MqMessageDetailsKanbanCardAction({
  rowData,
  closePopup: popupClose,
}: SolidKanbanCardActionProps) {
  const dispatch = useDispatch();
  const close = () => popupClose?.() ?? dispatch(closePopup());

  return (
    <>
      <SolidDialogHeader>
        <SolidDialogTitle>Queue message details</SolidDialogTitle>
        <SolidDialogClose aria-label="Close" />
      </SolidDialogHeader>
      <SolidDialogSeparator />
      <SolidDialogBody>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt>Message ID</dt><dd className="min-w-0 break-all">{display(rowData?.messageId)}</dd>
          <dt>Broker</dt><dd>{display(rowData?.messageBroker)}</dd>
          <dt>Type</dt><dd>{display(rowData?.messageType)}</dd>
          <dt>Stage</dt><dd>{display(rowData?.stage)}</dd>
          <dt>Retries</dt><dd>{display(rowData?.retryCount)}</dd>
          <dt>Started</dt><dd>{display(rowData?.startedAt)}</dd>
          <dt>Finished</dt><dd>{display(rowData?.finishedAt)}</dd>
          <dt>Error</dt><dd className="min-w-0 whitespace-pre-wrap break-words">{display(rowData?.error)}</dd>
        </dl>
      </SolidDialogBody>
      <SolidDialogFooter>
        <SolidButton type="button" variant="outline" onClick={close}>Close</SolidButton>
      </SolidDialogFooter>
    </>
  );
}
