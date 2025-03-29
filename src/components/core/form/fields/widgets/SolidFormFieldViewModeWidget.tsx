
export const SolidFormFieldViewModeWidget = ({ label, value }: any) => {
    console.log("label", label);
    console.log("value", value);

    return (
        <div>
            <p>{label} :{value}</p>
        </div>
    );
};

