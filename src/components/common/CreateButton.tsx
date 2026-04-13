

import { usePathname } from "../../hooks/usePathname";
import { useRouter } from "../../hooks/useRouter";
import { SolidButton } from "../shad-cn-ui";

export const CreateButton = () => {
    const router = useRouter();
    const pathName = usePathname();

    const createPAth = pathName.split('/').slice(0, -1).join('/') + '/create';

    return (
        <div>
            <SolidButton
                type="button"
                label="Add"
                size='small'
                onClick={() => router.push(createPAth)}
                className='small-button'
            />
        </div>
    )
}
