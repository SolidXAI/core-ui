import { getSingularAndPlural } from "../../../../../helpers/helpers";
import { SolidUiEvent } from "../../../../../types";

const dashboardFormViewChangeHandler = (event: SolidUiEvent) => {

    const { modifiedField, modifiedFieldValue, formData } = event;
    const { toKebabCase } = getSingularAndPlural(modifiedFieldValue);

    if (modifiedField === 'displayName') {
        return {
            layoutChanged: false,
            dataChanged: true,
            newFormData: {
                name: toKebabCase
            },
        }
    }
}
export default dashboardFormViewChangeHandler;
