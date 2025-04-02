
export const SolidFormFieldMediaViewModeWidget = ({ label, value }: any) => {
    console.log("label", label);
    console.log("value", value);

    return (
        <div>
            <p className="mt-2 mb-0"><span className="form-field-label">{label}</span> :{value}</p>
        </div>
    );
};

