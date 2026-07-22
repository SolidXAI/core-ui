type WorkflowDefinitionRowActionEvent = {
  rowData?: {
    id?: number | string;
  };
};

export default function openWorkflowDefinitionEditorRowAction(
  event: WorkflowDefinitionRowActionEvent,
) {
  const recordId = event?.rowData?.id;

  if (recordId === null || recordId === undefined || recordId === "") {
    return;
  }

  window.location.href = `/admin/core/solid-core/workflow-definition/editor/${recordId}`;
}
