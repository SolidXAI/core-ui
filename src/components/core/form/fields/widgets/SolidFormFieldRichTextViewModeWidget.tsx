import { Editor } from "primereact/editor";

export const SolidFormFieldRichTextViewModeWidget = ({ label, value }: any) => {
    return (
        <div>
            <Editor
                readOnly={true}
                key={label}  // React will re-render the component whenever this value changes
                id={label}
                value={value}
                style={{ height: "320px" }}
                className="solid-custom-editor"
            />
        </div>
    );
};

