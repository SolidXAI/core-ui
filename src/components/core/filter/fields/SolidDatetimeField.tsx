
import React, { useEffect, useState } from 'react';
import { dateFilterMatchModeOptions } from './SolidDateField';
import { getNumberOfInputs, SolidFilterFieldsParams } from '../SolidFilterFields';
import { SolidSelect } from "../../../shad-cn-ui/SolidSelect";
import { InputTypes, SolidVarInputsFilterElement } from '../SolidVarInputsFilterElement';

const SolidDatetimeField = ({ fieldMetadata, onChange, index, rule }: SolidFilterFieldsParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const columnDataType = 'date';

    const [numberOfInputs, setNumberOfInputs] = useState<any>(null);
    // TODO: the body template to be controlled based on the format that one is expecting the date to be displayed in.
    // const header = column.attrs.label ?? fieldMetadata.displayName;
    useEffect(() => {
        setNumberOfInputs(getNumberOfInputs(rule.matchMode))
    }, [rule])
    // const numberOfInputs = getNumberOfInputs(rule.matchMode);

    return (
        <div className='flex flex-col items-start gap-2 md:flex-row md:gap-1'>
            <div className="w-full p-0 px-0 md:w-1/2 md:pl-0 md:pr-0">
                <SolidSelect
                    value={rule.matchMode}
                    native={false}
                    onChange={(e: any) => {
                        onChange(rule.id, 'matchMode', e.value)
                    }}
                    options={dateFilterMatchModeOptions}
                    optionLabel='label'
                    optionValue='value'
                    placeholder="Select Operator"
                    className="p-inputtext-sm w-full "
                />
            </div>

            <div className='flex flex-col gap-2 w-full md:w-1/2 px-0 md:pl-0 md:pr-0 p-0'>
                <SolidVarInputsFilterElement
                    values={rule.value}
                    onChange={(e: any) => {
                        onChange(rule.id, 'value', e)
                    }}
                    numberOfInputs={numberOfInputs}
                    inputType={InputTypes.DateTime}
                    fieldMetadata={fieldMetadata}
                >
                </SolidVarInputsFilterElement>
            </div>
        </div>
    );

};

export default SolidDatetimeField;
