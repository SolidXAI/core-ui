
import { SolidUiEvent } from "../../../../../types";
import { SolidViewLayoutManager } from "../../../../../components/core/common/SolidViewLayoutManager";

const dashboardQuestionOnFormLoadHandler = async (event: SolidUiEvent) => {
    const { formData, formViewLayout } = event;

    const layout = formViewLayout;
    const layoutManager = new SolidViewLayoutManager(layout);

    if (formData.sourceType === 'sql') {
        layoutManager.updateNodeAttributes('labelSql', { visible: true });
        layoutManager.updateNodeAttributes('kpiSql', { visible: true });
        layoutManager.updateNodeAttributes('providerName', { visible: false });
    }
    if (formData.sourceType === 'provider') {
        layoutManager.updateNodeAttributes('labelSql', { visible: false });
        layoutManager.updateNodeAttributes('kpiSql', { visible: false });
        layoutManager.updateNodeAttributes('providerName', { visible: true });
    }
    return {
        layoutChanged: true,
        dataChanged: false,
        newLayout: layoutManager.getLayout(),
    }

}

export default dashboardQuestionOnFormLoadHandler;
