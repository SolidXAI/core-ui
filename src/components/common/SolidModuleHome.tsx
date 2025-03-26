"use client"
import { Card } from "primereact/card"
type SolidModuleParams = {
    moduleName: string;
}
export const SolidModuleHome = (params: SolidModuleParams) => {
    const formatName = (moduleName: string) => {
        return moduleName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
            .join(' ');
    };
    return (
        <div className="page-parent-wrapper p-5">
            <Card title={formatName(params.moduleName)}>
                <p className="m-0">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur error repudiandae
                    numquam deserunt quisquam repellat libero asperiores earum nam nobis, culpa ratione quam perferendis esse, cupiditate neque quas!
                </p>
            </Card>
        </div>
    )
}