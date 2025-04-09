
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror'; // Correct import


export const SolidFormFieldJsonViewModeWidget = ({ label, value }: any) => {
    return (
        <div className="mt-2 flex-column gap-2">
            <p className="m-0"><span className="form-field-label font-medium">{label}</span></p>
            <CodeMirror
                id={label}
                value={value}
                height={'300px'}
                style={{ fontSize: '10px' }}
                theme={oneDark}
                readOnly={true}
                extensions={[javascript(), EditorView.lineWrapping]}
            />
        </div>
    );
};

