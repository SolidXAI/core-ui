
import { SolidSelect } from "../../../shad-cn-ui/SolidSelect";
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';

const SolidUuidField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    const showFilterOperator = false;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'Equals', value: "$eqi" },
        { label: 'Not Equals', value: "$nei" },
        { label: 'Is null', value: "$null" },
        { label: 'Is Not null', value: "$notNull" }

    ];
    const numberOfInputs = getNumberOfInputs(rule.matchMode);

    return (
        <div className='flex flex-col items-start gap-2 md:flex-row md:gap-1'>
            <div className="w-full p-0 px-0 md:w-1/2 md:pl-0 md:pr-0">
                <SolidSelect
                    value={rule.matchMode}
                    native={false}
                    onChange={(e: any) => {
                        onChange(rule.id, 'matchMode', e.value)
                    }}
                    options={filterMatchModeOptions}
                    optionLabel='label'
                    optionValue='value'
                    placeholder="Select Operator"
                    className="w-full p-inputtext-sm"
                />
            </div>

            <div className='flex flex-col gap-2 w-full md:w-1/2 px-0 md:pl-0 md:pr-0 p-0'>
                <SolidVarInputsFilterElement
                    values={rule.value}
                    onChange={(e: any) => {
                        onChange(rule.id, 'value', e)
                    }}
                    numberOfInputs={numberOfInputs}
                    inputType={InputTypes.Text}
                    fieldMetadata={fieldMetadata}
                >
                </SolidVarInputsFilterElement>
            </div>
        </div>
    );

};

export default SolidUuidField;
