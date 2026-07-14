type WorkflowDefinitionHeaderActionEvent = {
  params?: {
    moduleName?: string;
  };
};

export default function openWorkflowDefinitionEditorHeaderAction(
  event: WorkflowDefinitionHeaderActionEvent,
) {
  const moduleName = event?.params?.moduleName ?? "solid-core";
  window.location.href = `/admin/core/${moduleName}/workflow-definition/editor/new`;
}

