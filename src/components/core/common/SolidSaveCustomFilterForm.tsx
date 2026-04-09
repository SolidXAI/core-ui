import { useState } from "react";
import { SolidButton } from "../../shad-cn-ui/SolidButton";
import { SolidInput } from "../../shad-cn-ui/SolidInput";

interface SolidSaveCustomFilterFormProps {
    currentSavedFilterData: any,
    handleSaveFilter: ({ }) => void;
    closeDialog: any
}

export const SolidSaveCustomFilterForm: React.FC<SolidSaveCustomFilterFormProps> = ({ currentSavedFilterData, handleSaveFilter, closeDialog }) => {
    const [formValues, setFormValues] = useState({ name: currentSavedFilterData ? currentSavedFilterData.name : "", isPrivate: currentSavedFilterData ? currentSavedFilterData.isPrivate : false });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = {
            id: currentSavedFilterData ? currentSavedFilterData.id : null,
            name: formValues.name,
            isPrivate: formValues.isPrivate === true ? true : "",
        }
        handleSaveFilter(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="solid-save-filter-form">
            <div className="solid-save-filter-field">
                <label htmlFor="name" className="solid-save-filter-label">Name</label>
                <SolidInput
                    id="name"
                    name="name"
                    placeholder="Filter Title"
                    value={formValues.name}
                    onChange={handleChange}
                    readOnly={currentSavedFilterData}
                    className="solid-save-filter-input"
                />
            </div>
            <label htmlFor="isPrivate" className="solid-save-filter-checkbox-row">
                <input
                    id="isPrivate"
                    name="isPrivate"
                    type="checkbox"
                    className="solid-save-filter-checkbox"
                    checked={formValues.isPrivate}
                    onChange={handleChange}
                />
                <span className="solid-save-filter-checkbox-copy">
                    <span className="solid-save-filter-label">Private Filter</span>
                    <span className="solid-save-filter-hint">Only you will be able to access this saved filter.</span>
                </span>
            </label>
            <div className="solid-save-filter-actions">
                <SolidButton
                    type="submit"
                    size="sm"
                >
                    {currentSavedFilterData ? "Update" : "Save"}
                </SolidButton>
                <SolidButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => closeDialog()}
                >
                    Cancel
                </SolidButton>
            </div>
        </form>
    );
};
