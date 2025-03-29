import { Password } from "primereact/password";

export const SolidFormFieldPasswordViewModeWidget = ({ label, value }: any) => {
    return (
        <div>

            <label className="form-field-label">
                {label}
            </label>
            <Password
                id={label}
                name={label}
                value={value}
                readOnly={true}
                disabled={true}
                toggleMask
            />

        </div>
    );
};

