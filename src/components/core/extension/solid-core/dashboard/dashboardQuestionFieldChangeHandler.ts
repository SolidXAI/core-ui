import { SolidUiEvent } from "../../../../../types";
import { SolidViewLayoutManager } from "../../../../../components/core/common/SolidViewLayoutManager";

const dashboardQuestionFieldChangeHandler = async (event: SolidUiEvent) => {
    const { modifiedField, modifiedFieldValue, formViewLayout } = event;

    const layout = formViewLayout;

    const layoutManager = new SolidViewLayoutManager(layout);
    if (modifiedField === 'sourceType') {
        if (modifiedFieldValue.value === 'sql') {
            layoutManager.updateNodeAttributes('labelSql', { visible: true });
            layoutManager.updateNodeAttributes('kpiSql', { visible: true });
            layoutManager.updateNodeAttributes('providerName', { visible: false });
        }
        if (modifiedFieldValue.value === 'provider') {
            layoutManager.updateNodeAttributes('labelSql', { visible: false });
            layoutManager.updateNodeAttributes('kpiSql', { visible: false });
            layoutManager.updateNodeAttributes('providerName', { visible: true });
        }
    }
    return {
        layoutChanged: true,
        dataChanged: false,
        newLayout: layoutManager.getLayout(),
    }
}


export default dashboardQuestionFieldChangeHandler;
