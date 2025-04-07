
export const SolidFormFieldMediaViewModeWidget = ({ label, value }: any) => {
    console.log("label", label);
    console.log("value", value);

    return (
        <div className="mt-2 flex-column gap-2">
            <p className="m-0 form-field-label font-medium">{label}</p>
            <p className="m-0">{value}</p>
        </div>
    );
};

