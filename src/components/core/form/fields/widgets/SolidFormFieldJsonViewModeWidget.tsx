
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror'; // Correct import


export const SolidFormFieldJsonViewModeWidget = ({ label, value }: any) => {
    return (
        <div>
            <p>{label}</p>
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

