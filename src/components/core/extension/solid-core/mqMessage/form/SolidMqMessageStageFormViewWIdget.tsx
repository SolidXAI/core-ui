import { SolidFormWidgetProps } from "../../../../../../types/solid-core";
import { MqMessageStageBadge } from "../ui/MqMessageStageBadge";

export const SolidMqMessageStageFormViewWIdget = ({
    field,
    formData,
    viewMetadata,
    fieldsMetadata,
    formViewData
}: SolidFormWidgetProps) => {
    const stageValue = formViewData?.data?.stage;


    return (
             <div className="mt-2">
            {stageValue &&
                 <MqMessageStageBadge stage={stageValue} compact />
            }
             </div>
    );
};