import { getExtensionComponent } from "@/helpers/registry";

export const SolidFormFieldViewModeWidget = ({ label, value, layout }: any) => {

    let widgetName = layout?.attrs?.widget;
    if (widgetName) {
        let DynamicWidget = getExtensionComponent(widgetName);
        const widgetProps = {
            value: value
        }
        return (
            <>
                {DynamicWidget && <DynamicWidget {...widgetProps} />}
            </>
        )
    } else {
        return (
            <div className="mt-2 flex-column gap-2">
                <p className="m-0 form-field-label font-medium">{label}</p>
                <p className="m-0">{value}</p>
            </div>
        );
    }
};

