
import { SolidSelect } from "../../../shad-cn-ui/SolidSelect";
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { InputTypes, SolidVarInputsFilterElement } from "../SolidVarInputsFilterElement";

const SolidIdField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    const showFilterOperator = false;
    const columnDataType = 'text';
    const filterMatchModeOptions = [
        { label: 'Equals', value: "$eq" },
        { label: 'Not Equals', value: "$ne" },
        { label: 'Less Than', value: "$lt" },
        { label: 'Less Than Or Equal', value: "$lte" },
        { label: 'Greater Than', value: "$gt" },
        { label: 'Greater Than Or Equal', value: "$gte" },
        { label: 'Between', value: "$between" },
        { label: 'Is null', value: "$null" },
        { label: 'Is Not null', value: "$notNull" }
    ];
    const numberOfInputs = getNumberOfInputs(rule.matchMode);


    return (
        <div className='flex items-start gap-4 w-full'>
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
            <div className='flex flex-col gap-2 w-full'>
                <SolidVarInputsFilterElement
                    values={rule.value}
                    onChange={(e: any) => {
                        onChange(rule.id, 'value', e)
                    }}
                    numberOfInputs={numberOfInputs}
                    inputType={InputTypes.Numeric}
                    fieldMetadata={fieldMetadata}
                >
                </SolidVarInputsFilterElement>
            </div>
        </div>
    );

};

export default SolidIdField;
