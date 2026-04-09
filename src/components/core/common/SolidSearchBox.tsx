import { useState } from "react";
import { SolidAutocomplete } from "../../shad-cn-ui";


export const SolidSearchBox = ({ viewData }: any) => {
    const [value, setValue] = useState<string>('');
    const [items, setItems] = useState<string[]>([]);
    const search = (event: any) => {
        // setItems([...Array(10).keys()].map(item => event.query + '-' + item));
    }
    return (
        <div className="card flex justify-content-center">
            <SolidAutocomplete value={value} suggestions={items} completeMethod={search} onChange={(e) => setValue(e.value)} />
        </div>
    )
}
