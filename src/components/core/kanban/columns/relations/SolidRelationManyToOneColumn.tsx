import React from 'react';
import { FilterMatchMode } from 'primereact/api';
import { getSolidKanbanViewNumberOfInputs, SolidKanbanViewColumnParams } from '../../SolidKanbanViewSearchColumn';
import { Dropdown } from 'primereact/dropdown';
import { KanbanInputTypes, SolidKanbanVarInputsFilterElement } from '@/components/core/kanban/SolidVarInputsFilterElement';

const SolidRelationManyToOneColumn = ({ solidKanbanViewMetaData, fieldMetadata, updateEnumValues, index, enumValue }: SolidKanbanViewColumnParams) => {
    // const filterable = column.attrs.filterable;
    const showFilterOperator = false;
    const filterMatchModeOptions = [
        { label: 'In', value: FilterMatchMode.IN },
        { label: 'Not In', value: FilterMatchMode.NOT_IN },
    ];
    const columnDataType = undefined;
    const numberOfInputs = getSolidKanbanViewNumberOfInputs("in");

    // const filterTemplate = (options: ColumnFilterElementTemplateOptions) => {

    //     return (
    //         <SolidVarInputsFilterElement
    //             values={options.value}
    //             onChange={(e: FormEvent<HTMLInputElement>) => options.filterCallback(e, options.index)}
    //             inputType={InputTypes.RelationManyToOne}
    //             solidListViewMetaData={solidListViewMetaData}
    //             fieldMetadata={fieldMetadata}
    //             column={column}
    //         >
    //         </SolidVarInputsFilterElement>
    //     )
    // };

    // const bodyTemplate = (rowData: any) => {
    //     const manyToOneFieldData = rowData[column.attrs.name];

    //     // This is the userkey that will be present within the rowData.
    //     if (manyToOneFieldData) {
    //         // Since this is a many-to-one field, we fetch the user key field of the associated model.
    //         const userKeyField = fieldMetadata.relationModel.userKeyField.name;

    //         const manyToOneColVal = manyToOneFieldData[userKeyField];

    //         // TODO: change this to use an anchor tag so that on click we open that entity form view. 
    //         return <span>{manyToOneColVal}</span>;
    //     }
    //     else {
    //         return <span></span>
    //     }
    // };
    // const header = column.attrs.label ?? fieldMetadata.displayName;

    return (
        <>
            <Dropdown
                value={enumValue.operator}
                onChange={(e: any) => {
                    console.log("e", e);
                    updateEnumValues(index, 'operator', e.value)
                }}
                options={filterMatchModeOptions}
                optionLabel='label'
                optionValue='value'
                placeholder="Select Operator" className="w-full md:w-14rem" />
            <SolidKanbanVarInputsFilterElement
                values={enumValue.value}
                onChange={(e: any) => {
                    console.log("e", e);
                    updateEnumValues(index, 'value', e)
                }}
                numberOfInputs={numberOfInputs}
                inputType={KanbanInputTypes.RelationManyToOne}
                solidListViewMetaData={solidKanbanViewMetaData}
                fieldMetadata={fieldMetadata}
            >
            </SolidKanbanVarInputsFilterElement>
        </>
    );

};

export default SolidRelationManyToOneColumn;