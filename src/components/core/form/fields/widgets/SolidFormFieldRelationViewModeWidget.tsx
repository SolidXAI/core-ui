import { Chip } from "primereact/chip";
import { Chips } from "primereact/chips";
import { useEffect, useState } from "react";

export const SolidFormFieldRelationViewModeWidget = ({ label, value }: any) => {
    const [fieldValue, setFieldValue] = useState<any>([]);
    useEffect(() => {
        if (Array.isArray(value)) {

            if (value.length > 0) {
                const data = value.map((v: any) => v.label);
                setFieldValue(data);
            }
        }
        if (value && !Array.isArray(value) && typeof value === "object") {
            setFieldValue([value.label]);
        }
    }, [value]);


    return (
        <div>
            <p>{label}: </p>
            <div className="card flex flex-wrap gap-2">
                {fieldValue.map((v: any) => (
                    <Chip key={v} label={v}/>
                ))}
            </div>
        </div>
    );
};

