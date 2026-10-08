import { useState } from "react";
import { useDispatch } from "react-redux";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { getKanbanView, getRegisteredKanbanViewIds } from "../../../../../../components/core/kanban/kanbanViewRegistry";
import {
  SolidButton,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidInput,
} from "../../../../../shad-cn-ui";

type HeaderActionContext = {
  params?: { moduleName?: string; modelName?: string };
  closePopup?: () => void;
};

const STAGES = ["pending", "scheduled", "started", "retry", "retrying", "failed", "succeeded"];

export default function MqMessageKanbanQuickFilterHeaderAction({
  params,
  closePopup: popupClose,
}: HeaderActionContext) {
  const dispatch = useDispatch();
  const [stages, setStages] = useState<string[]>([]);
  const [messageBroker, setMessageBroker] = useState("");
  const [messageType, setMessageType] = useState("");

  const close = () => {
    if (popupClose) popupClose();
    else dispatch(closePopup());
  };

  const getActiveKanbanView = () => {
    const prefix = `page:${params?.moduleName ?? "solid-core"}:${params?.modelName ?? "mqMessage"}:`;
    const viewId = getRegisteredKanbanViewIds().find((id) => id.startsWith(prefix));
    return viewId ? getKanbanView(viewId) : undefined;
  };

  const applyFilters = () => {
    const predicate: Record<string, unknown> = {};
    if (stages.length === 1) predicate.stage = { $eq: stages[0] };
    else if (stages.length > 1) predicate.stage = { $in: stages };
    if (messageBroker.trim()) predicate.messageBroker = { $eq: messageBroker.trim() };
    if (messageType.trim()) predicate.messageType = { $eq: messageType.trim() };

    const view = getActiveKanbanView();
    if (!view) return;
    view.applyFilter({ custom_filter_predicate: predicate, replaceFilters: true });
    close();
  };

  const clearFilters = () => {
    getActiveKanbanView()?.applyFilter({ custom_filter_predicate: {}, replaceFilters: true });
    close();
  };

  const toggleStage = (stage: string) => {
    setStages((current) => current.includes(stage)
      ? current.filter((value) => value !== stage)
      : [...current, stage]);
  };

  return (
    <>
      <SolidDialogHeader>
        <SolidDialogTitle>Quick filter queue messages</SolidDialogTitle>
        <SolidDialogClose aria-label="Close" />
      </SolidDialogHeader>
      <SolidDialogSeparator />
      <SolidDialogBody>
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Stage</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STAGES.map((stage) => (
                <label key={stage} className="flex items-center gap-2 text-sm capitalize">
                  <input
                    type="checkbox"
                    checked={stages.includes(stage)}
                    onChange={() => toggleStage(stage)}
                  />
                  {stage}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Message broker</span>
            <SolidInput value={messageBroker} onChange={(event) => setMessageBroker(event.target.value)} placeholder="Exact broker name" />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Message type</span>
            <SolidInput value={messageType} onChange={(event) => setMessageType(event.target.value)} placeholder="Exact message type" />
          </label>
          <p className="text-xs text-muted-foreground">Selected filters are combined. Leave a field empty to ignore it.</p>
        </div>
      </SolidDialogBody>
      <SolidDialogFooter>
        <SolidButton type="button" variant="ghost" onClick={clearFilters}>
          Clear filters
        </SolidButton>
        <SolidButton type="button" variant="outline" onClick={close}>Cancel</SolidButton>
        <SolidButton type="button" onClick={applyFilters}>Apply filters</SolidButton>
      </SolidDialogFooter>
    </>
  );
}
