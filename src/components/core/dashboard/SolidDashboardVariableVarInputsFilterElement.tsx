import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { useEffect, useState } from "react";
import { SolidSelectionStaticFilterElement } from "../filter/SolidSelectionStaticFilterElement";
import { SolidDashboardSelectionDynamicFilterElement } from "./variable-filters/SolidDashboardSelectionDynamicFilterElement";

export enum InputTypes {
    Date = 'Date',
    SelectionStatic = 'SelectionStatic',
    SelectionDynamic = 'SelectionDynamic'
}


// Based on numberOfInputs map the input filed and hide add and delete 
export const SolidDashboardVariableVarInputsFilterElement = ({ values, onChange, inputType = InputTypes.Date, numberOfInputs = null, fieldMetadata }: any) => {

    if (!values) {
        values = numberOfInputs && numberOfInputs > 0 ? Array(numberOfInputs).fill('') : [''];
        // values = [''];
    } else {
        if (values[0] == '') {
            values = numberOfInputs && numberOfInputs > 0 ? Array(numberOfInputs).fill('') : [''];
        } else {

            values = values
        }
    }

    // TODO: Ideally values will be an array, so we can spread them here instead of making a nested array.
    const [inputs, setInputs] = useState([...values]);
    useEffect(() => {
        setInputs([...values])
    }, [numberOfInputs])

    const updateInputs = (index: number, value: any) => {
        const updatedSpecification = inputs.map((item, i) =>
            i === index ? value : item
        );
        setInputs(updatedSpecification);
    };

    const addInput = () => {
        setInputs([...inputs, '']);
    };

    const deleteInput = (index: number) => {
        if (inputs.length > 1) {
            const updatedRows = inputs.filter((_, rowIndex) => rowIndex !== index);
            setInputs(updatedRows);

        } else {
        }
    };

    useEffect(() => {
        onChange(inputs)
    }, [inputs])



    return (
        <>
            {inputs && inputs.map((value: any, index: number) => (
                <div className="flex">
                    {inputType === InputTypes.Date &&
                        <Calendar
                            value={value}
                            onChange={(e) => updateInputs(index, e.target.value)}
                            dateFormat="mm/dd/yy"
                            placeholder="mm/dd/yyyy"
                            mask="99/99/9999"
                            className="w-full"
                            inputClassName="w-full p-inputtext-sm"
                        />
                    }
                    {inputType === InputTypes.SelectionDynamic &&
                        <SolidDashboardSelectionDynamicFilterElement
                            value={value}
                            index={index}
                            updateInputs={updateInputs}
                            fieldMetadata={fieldMetadata}
                        ></SolidDashboardSelectionDynamicFilterElement>
                    }
                    {inputType === InputTypes.SelectionStatic &&

                        <SolidSelectionStaticFilterElement
                            value={value}
                            index={index}
                            updateInputs={updateInputs}
                            fieldMetadata={fieldMetadata}
                        ></SolidSelectionStaticFilterElement>
                    }
                    {numberOfInputs === null &&
                        <>
                            {/* Plus Button to add a new row */}
                            {/* < Button
                                    icon="pi pi-plus"
                                    size="small"
                                    className="small-button"
                                    onClick={addInput}
                                    type="button"
                                /> */}

                            {/* Trash Button to delete the row */}
                            {/* <Button
                                    icon="pi pi-trash"
                                    size="small"
                                    className="small-button"
                                    onClick={() => deleteInput(index)}
                                    severity="danger"
                                    type="button"
                                /> */}
                            <Button text severity='secondary' icon="pi pi-plus" size='small' onClick={() => addInput()} className='solid-filter-action-btn' />
                            <Button text severity='secondary' icon="pi pi-trash" size='small' onClick={() => deleteInput(index)} className='solid-filter-action-btn' />
                        </>
                    }
                </div>
            ))}
        </>
    )
}