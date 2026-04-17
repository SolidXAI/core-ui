import { SolidViewLayoutManager } from "../../../../../../components/core/common/SolidViewLayoutManager";
import { LayoutNode } from "../../../../../../types/solid-core";

const mqMessageOnFormLoadHandler = async (event: any) => {
    const { formViewLayout } = event;
    const layoutManager = new SolidViewLayoutManager(formViewLayout);

    const customWidgetLayoutCode: LayoutNode = {
        type: "custom",
        attrs: {
            name: "stagefield",
            widget: "SolidMqMessageStageFormViewWIdget",
            visible :true
        },
    };

    if (!layoutManager.hasNode(customWidgetLayoutCode.attrs.name)) {
        layoutManager.insertNodeBefore("messageType", customWidgetLayoutCode);
    }

    return {
        layoutChanged: true,
        dataChanged: false,
        newLayout: layoutManager.getLayout(),
    }
}
export default mqMessageOnFormLoadHandler;
