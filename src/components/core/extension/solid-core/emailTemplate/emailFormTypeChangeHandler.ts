import { SolidViewLayoutManager } from "@/components/core/common/SolidViewLayoutManager";

const hanldeEmailFormTypeChange = (event: any) => {

    const { type, modifiedField, modifiedFieldValue, formData, viewMetadata, fieldsMetadata } = event;
    const layout = viewMetadata.layout;
    // TODO: make an api call to get title & pageCount given the ISBN.
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
