
import { useState } from "react";
import { SolidDialog } from "../../shad-cn-ui";
import { SolidIcon } from "../../shad-cn-ui/SolidIcon";


export const SolidListViewOptions = ({ }: any) => {

    const [visible, setVisible] = useState<boolean>(false);

    const [componentsToRender, setComponentsToRender] = useState(["Header", "NonExistentComponent"]);

    return (
        <div className="card flex justify-content-center">
            <SolidIcon name="si-cog" onClick={() => setVisible(true)} style={{ cursor: 'pointer' }} />

            <SolidDialog header="Header" visible={visible} onHide={() => setVisible(false)} contentClassName="w-full" className="solid-dialog-lg">
                <p className="m-0">
                    ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <div>

                </div>

            </SolidDialog>
        </div>
    )

}
