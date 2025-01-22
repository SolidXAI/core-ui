"use client";
import { Button } from "primereact/button"
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext"
import { useEffect, useState } from "react";
import { SolidKanbanManyToOneFilterElement } from "./SolidManyToOneFilterElement";
import { SolidKanbanSelectionStaticFilterElement } from "./SolidSelectionStaticFilterElement";
import { SolidKanbanSelectionDynamicFilterElement } from "./SolidSelectionDynamicFilterElement";

export enum KanbanInputTypes {
    Date = 'Date',
    DateTime = 'DateTime',
    Time = 'Time',
    Numeric = 'Numeric',
    Text = 'Text',
    SelectionStatic = 'SelectionStatic',
    RelationManyToOne = 'RelationManyToOne',
    SelectionDynamic = 'SelectionDynamic'
}


// Based on numberOfInputs map the input filed and hide add and delete 
export const SolidKanbanVarInputsFilterElement = ({ values, onChange, inputType = KanbanInputTypes.Text, numberOfInputs = null, solidListViewMetaData, fieldMetadata }: any) => {

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
        <div className="grid formgrid">
            <div className="col-12">
                <div className="flex flex-column gap-2">
                    {inputs && inputs.map((value: any, index: number) => (

                        <div key={index} className="flex align-items-center gap-2">

                            {inputType === KanbanInputTypes.Text &&
                                <InputText
                                    value={value}
                                    onChange={(e) => updateInputs(index, e.target.value)}
                                    placeholder=""
                                    className="p-inputtext-sm small-input w-full"
                                />
                            }
                            {inputType === KanbanInputTypes.Numeric &&
                                <InputNumber
                                    value={value}
                                    onChange={(e) => updateInputs(index, e.value)}
                                    placeholder=""
                                    className="p-inputtext-sm small-input w-full"
                                />
                            }
                            {inputType === KanbanInputTypes.Date &&
                                <Calendar
                                    value={value}
                                    onChange={(e) => updateInputs(index, e.target.value)}
                                    dateFormat="mm/dd/yy"
                                    placeholder="mm/dd/yyyy"
                                    mask="99/99/9999"
                                />
                            }
                            {inputType === KanbanInputTypes.DateTime &&
                                <Calendar
                                    value={value}
                                    onChange={(e) => updateInputs(index, e.target.value)}
                                    dateFormat="mm/dd/yy"
                                    placeholder="mm/dd/yyyy hh:mm"
                                    mask="99/99/9999 99:99"
                                    showTime
                                    hourFormat="24"
                                />
                            }
                            {inputType === KanbanInputTypes.Time &&
                                <Calendar
                                    value={value}
                                    onChange={(e) => updateInputs(index, e.target.value)}
                                    placeholder="hh:mm"
                                    mask="99:99"
                                    timeOnly
                                    hourFormat="24"
                                />
                            }
                            {inputType === KanbanInputTypes.RelationManyToOne &&
                                <SolidKanbanManyToOneFilterElement
                                    value={value}
                                    index={index}
                                    updateInputs={updateInputs}
                                    fieldMetadata={fieldMetadata}
                                ></SolidKanbanManyToOneFilterElement>
                            }
                            {inputType === KanbanInputTypes.SelectionDynamic &&
                                <SolidKanbanSelectionDynamicFilterElement
                                    value={value}
                                    index={index}
                                    updateInputs={updateInputs}
                                    fieldMetadata={fieldMetadata}
                                ></SolidKanbanSelectionDynamicFilterElement>
                            }
                            {inputType === KanbanInputTypes.SelectionStatic &&

                                <SolidKanbanSelectionStaticFilterElement
                                    value={value}
                                    index={index}
                                    updateInputs={updateInputs}
                                    fieldMetadata={fieldMetadata}
                                ></SolidKanbanSelectionStaticFilterElement>
                            }

                            {numberOfInputs === null &&
                                <>
                                    {/* Plus Button to add a new row */}
                                    < Button
                                        icon="pi pi-plus"
                                        size="small"
                                        className="small-button"
                                        onClick={addInput}
                                        type="button"
                                    />

                                    {/* Trash Button to delete the row */}
                                    <Button
                                        icon="pi pi-trash"
                                        size="small"
                                        className="small-button"
                                        onClick={() => deleteInput(index)}
                                        outlined
                                        severity="danger"
                                        type="button"
                                    />
                                </>
                            }
                        </div>

                    ))}

                </div>

            </div>
        </div>
    )
}