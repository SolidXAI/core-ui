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
        <form onSubmit={handleSubmit}>
            <div className="flex flex-column gap-2">
                <label htmlFor="name">Name:</label>
                <SolidInput
                    id="name"
                    name="name"
                    placeholder="Filter Title"
                    value={formValues.name}
                    onChange={handleChange}
                    readOnly={currentSavedFilterData}
                />
            </div>
            <div className="mt-3 flex align-items-center ">
                <input
                    id="isPrivate"
                    name="isPrivate"
                    type="checkbox"
                    checked={formValues.isPrivate}
                    onChange={handleChange}
                />
                <label htmlFor="isPrivate" className="ml-2">Is Private</label>
            </div>
            <div className="mt-3 flex align-items-center gap-2">
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
