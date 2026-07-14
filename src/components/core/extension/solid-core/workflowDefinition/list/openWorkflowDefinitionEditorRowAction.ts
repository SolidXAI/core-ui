type WorkflowDefinitionRowActionEvent = {
  params?: {
    moduleName?: string;
  };
  rowData?: {
    id?: number | string;
  };
};

export default function openWorkflowDefinitionEditorRowAction(
  event: WorkflowDefinitionRowActionEvent,
) {
  const moduleName = event?.params?.moduleName ?? "solid-core";
  const recordId = event?.rowData?.id;

  if (recordId === null || recordId === undefined || recordId === "") {
    return;
  }

  window.location.href = `/admin/core/${moduleName}/workflow-definition/editor/${recordId}`;
}

