// @ts-nocheck
import CardItem from "./CardItem";
import { getExtensionComponent } from "../../../helpers/registry";

const findCardNode = (nodes: any[] = []): any => {
  for (const node of nodes) {
    if (!node) continue;
    if (node.type === "card") return node;
    if (Array.isArray(node?.children) && node.children.length > 0) {
      const nestedCard = findCardNode(node.children);
      if (nestedCard) return nestedCard;
    }
  }

  return null;
};

export const CardGrid = ({
  records,
  solidCardViewMetaData,
  editButtonUrl,
  setLightboxUrls,
  setOpenLightbox,
}: any) => {
  const cardNode = findCardNode(solidCardViewMetaData?.solidView?.layout?.children || []);
  const cardWidget = cardNode?.attrs?.cardWidget || cardNode?.cardWidget;
  const DynamicCardWidget = cardWidget ? getExtensionComponent(cardWidget) : null;
  const cardConfigurationIssue = !cardWidget
    ? { type: "missing_widget_reference" }
    : !DynamicCardWidget
      ? { type: "missing_widget", cardWidget }
      : null;

  if (cardConfigurationIssue) {
    return (
      <div className="solid-kanban-config-placeholder-container">
        <div className="solid-kanban-config-placeholder-panel">
          <div className="solid-kanban-config-placeholder-badge">CARD CONFIGURATION</div>
          <div className="solid-kanban-config-placeholder-title">
            {cardConfigurationIssue.type === "missing_widget"
              ? "Card widget could not be resolved"
              : "Card widget is not configured"}
          </div>
          <div className="solid-kanban-config-placeholder-description">
            {cardConfigurationIssue.type === "missing_widget" ? (
              <>
                This card view references <code>{cardConfigurationIssue.cardWidget}</code>, but no matching card widget is registered.
              </>
            ) : (
              <>
                This card view does not define a <code>cardWidget</code> on the card node.
              </>
            )}
          </div>
          <div className="solid-kanban-config-placeholder-hint">
            {cardConfigurationIssue.type === "missing_widget"
              ? "Register the widget in the extension registry or update the card metadata to point at a valid component."
              : "Configure attrs.cardWidget on the card metadata so the grid can render each record."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="solid-card-view-grid">
      {records.map((record: any) => (
        <CardItem
          key={record.id}
          data={record}
          solidCardViewMetaData={solidCardViewMetaData}
          editButtonUrl={editButtonUrl}
          cardNode={cardNode}
          DynamicCardWidget={DynamicCardWidget}
          setLightboxUrls={setLightboxUrls}
          setOpenLightbox={setOpenLightbox}
        />
      ))}
    </div>
  );
};

export default CardGrid;
