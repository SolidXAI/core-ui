"use client"
import { useState } from "react";

export const SolidFormFieldPasswordViewModeWidget = ({ label, value }: any) => {
    const [isText, setIsText] = useState(false)
    return (
        <div className="mt-2 flex-column gap-2">
            <p className="m-0 form-field-label font-medium">{label}</p>
            <div className="flex align-items-center gap-4">
                <p className="m-0">
                    {isText ? value : "••••••••"}
                </p>
                <i
                    className={`pi ${isText ? 'pi-eye' : 'pi-eye-slash'}`}
                    onClick={() => setIsText(!isText)}
                    style={{ cursor: 'pointer' }}
                />
            </div>

        </div>
    );
};

