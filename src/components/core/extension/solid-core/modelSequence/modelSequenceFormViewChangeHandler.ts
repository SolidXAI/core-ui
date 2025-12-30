import { SolidViewLayoutManager } from "@/components/core/common/SolidViewLayoutManager";

const hanldeModelSequenceFormViewChange = async (event: any) => {

    console.log("event",event)

    const { modifiedField, modifiedFieldValue, formViewLayout } = event;

    const layout = formViewLayout;
    const layoutManager = new SolidViewLayoutManager(layout);
    if (modifiedField === 'module') {
        const modelWhereClause = {
            models: {
                model: { $eq: modifiedFieldValue.module }
            }
        };
        const fieldWhereClause = {
            models: {
                fields: {
                    field: { $eq: modifiedFieldValue.module }
                }
            }
        };
        
        layoutManager.updateNodeAttributes('model', { "whereClause": JSON.stringify(modelWhereClause) });
        layoutManager.updateNodeAttributes('field', { "whereClause": JSON.stringify(fieldWhereClause) });
        return {
            layoutChanged: true,
            dataChanged: false,
            newLayout: layoutManager.getLayout(),
        }
    }  
}
export default hanldeModelSequenceFormViewChange;
