import { SolidViewLayoutManager } from "@/components/core/common/SolidViewLayoutManager";

const hanldeEmailFormTypeChange = (event: any) => {

    const { modifiedField, modifiedFieldValue, viewMetadata, } = event;
    const layout = viewMetadata.layout;
    if (modifiedField === 'type') {
        const layoutManager = new SolidViewLayoutManager(layout);
        const renderMode = modifiedFieldValue.value === 'text' ? 'longText' : 'richText';
        layoutManager.updateNodeAttributes('body', { "renderMode": renderMode});
        return {
            layoutChanged: true,
            dataChanged: false,
            newLayout: layoutManager.getLayout(), 
        }
    }
}
export default hanldeEmailFormTypeChange;
