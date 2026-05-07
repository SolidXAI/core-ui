import { SolidViewLayoutManager } from "../../../../../components/core/common/SolidViewLayoutManager";
import { SolidUiEvent } from "../../../../../types";

export const scheduleFrequencyOnFieldChangeHandler = async (event: SolidUiEvent) => {
    const { modifiedField, modifiedFieldValue, formViewLayout } = event;

    const layoutManager = new SolidViewLayoutManager(formViewLayout);
    const value = modifiedFieldValue?.value?.toLowerCase();

    if (modifiedField === 'frequency') {

        // Reset all
        layoutManager.updateNodeAttributes('dayOfMonth', { visible: false });
        layoutManager.updateNodeAttributes('dayOfWeek', { visible: false, multiSelect: true });
        layoutManager.updateNodeAttributes('cronExpression', { visible: false });
        switch (value) {

            case 'custom':
                layoutManager.updateNodeAttributes('cronExpression', { visible: true });
                break;

            case 'daily':
                // No extra fields needed
                break;

            case 'weekly':
                layoutManager.updateNodeAttributes('dayOfWeek', { visible: true, multiSelect: false });
                break;

            case 'monthly':
                layoutManager.updateNodeAttributes('dayOfMonth', { visible: true });
                break;

            case 'hourly':
            case 'every minute':
                break;
        }
    }

    return {
        layoutChanged: true,
        dataChanged: false,
        newLayout: layoutManager.getLayout(),
    };
};