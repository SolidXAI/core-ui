"use client"
import { useState } from "react";

export const SolidFormFieldPasswordViewModeWidget = ({ label, value }: any) => {
    const [isText, setIsText] = useState(false)
    return (
        <div className="flex align-items-center gap-4 mt-2">
            <p className="mb-0">
                <span className="form-field-label">{label}</span> : {isText ? value : "••••••••"}
            </p>
            <i
                className={`pi ${isText ? 'pi-eye' : 'pi-eye-slash'}`}
                onClick={() => setIsText(!isText)}
                style={{ cursor: 'pointer' }}
            />
        </div>
    );
};

