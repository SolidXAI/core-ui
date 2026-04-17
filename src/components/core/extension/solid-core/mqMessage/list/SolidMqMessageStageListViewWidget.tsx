import { SolidListFieldWidgetProps } from "../../../../../../types/solid-core";
import { MqMessageStageBadge } from "../ui/MqMessageStageBadge";

export const SolidMqMessageStageListViewWidget = ({
    rowData,
    fieldMetadata,
}: SolidListFieldWidgetProps) => {
    const value = fieldMetadata?.name ? rowData?.[fieldMetadata.name] : "";

    return (
        <div className="mt-2">
            <MqMessageStageBadge stage={value} compact />
        </div>
    );
};
