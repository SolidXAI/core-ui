import { SolidViewLayoutManager } from "@/components/core/common/SolidViewLayoutManager";

const hanldeModelSequenceFormViewChange = async (event: any) => {

    console.log("event", event)

    const { modifiedField, modifiedFieldValue, formViewLayout } = event;

    const layout = formViewLayout;
    const layoutManager = new SolidViewLayoutManager(layout);
    if (modifiedField === 'module') {
        // module change
        const modelWhereClause = {
            module: {
                id: { $eq: modifiedFieldValue.id }
            }
        };
        const fieldWhereClauseOnModule = {
            model: {
                module: {
                    id: { $eq: modifiedFieldValue.id }
                }
            }
        };

        layoutManager.updateNodeAttributes('model', { "whereClause": JSON.stringify(modelWhereClause) });
        layoutManager.updateNodeAttributes('field', { "whereClause": JSON.stringify(fieldWhereClauseOnModule) });
        
        return {
            layoutChanged: true,
            dataChanged: true,
            newFormData: {
                model: null,
                field: null
            },
            newLayout: layoutManager.getLayout(),
        }
    }
    if (modifiedField === 'model') {
        // model change
        const fieldWhereClauseOnModel = {
            model: {
                id: { $eq: modifiedFieldValue.id }
            }
        };

        layoutManager.updateNodeAttributes('field', { "whereClause": JSON.stringify(fieldWhereClauseOnModel) });

        return {
            layoutChanged: true,
            dataChanged: true,
            newFormData: {
                field: null
            },
            newLayout: layoutManager.getLayout(),
        }
    }
}
export default hanldeModelSequenceFormViewChange;
