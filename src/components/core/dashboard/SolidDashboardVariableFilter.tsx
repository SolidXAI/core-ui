import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { SolidDashboardVariableFilterProps } from "./SolidDashboardVariableFilterWrapper";
const SolidDashboardVariableFilterRule: React.FC<SolidDashboardVariableFilterProps> = ({dashboardVariables}) => {
    return (
        <div className='flex align-items-center gap-3'>
            <div className='formgrid grid w-full'>
                <div className='col-4'>
                    <Dropdown
                        onChange={ () => {
                            console.log("Field Name Changed");
                        }}
                        options={dashboardVariables}
                        optionLabel='name'
                        optionValue='value'
                        placeholder="Select Dashboard Variable"
                        className='w-full p-inputtext-sm'
                    />
                </div>
                <div className='col-8'>
                    <div className='formgrid grid w-full'>
                        {
                            <div className='col-12'>
                                {JSON.stringify(dashboardVariables)}
                            </div>
                        }
                    </div>
                </div>
            </div>
            <div className='formgrid grid'>
                <div className='col-4 px-0 flex align-items-center'>
                    <Button text severity='secondary' icon="pi pi-plus" size='small' onClick={() => {console.log("Add a variable filter rule")}} className='solid-filter-action-btn' />
                </div>
                <div className='col-4 px-0 flex align-items-center'>
                    <Button text severity='secondary' icon="pi pi-trash" size='small' onClick={() => {console.log("Delete a variable filter rule")}} className='solid-filter-action-btn' />
                </div>
            </div>
        </div>
    )
}

export const SolidDashboardVariableFilter: React.FC<SolidDashboardVariableFilterProps> = ({dashboardVariables}) => {
    return (
        <div className=''>
            <SolidDashboardVariableFilterRule dashboardVariables={dashboardVariables} />
            <div className='flex gap-3 mt-3'>
                <Button label="Apply" size="small" onClick={() => { console.log("Dashboard variable filter applied") }} type="submit" />
                <Button type='button' label='Cancel' outlined size='small' onClick={() => { console.log("Dashboard variable filter cancelled") }} />
            </div>
        </div>
    );
}
export default SolidDashboardVariableFilter;