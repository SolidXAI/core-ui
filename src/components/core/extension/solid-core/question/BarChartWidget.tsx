"use client";

import { SolidFormWidgetProps } from "@/types";
import BarChartRenderer from "@/components/core/dashboard/chart-renderers/BarChartRenderer";

const BarChartWidget = ({ formData, field, fieldsMetadata, viewMetadata, formViewData }: SolidFormWidgetProps) => {
    console.log(`formData: `);
    console.log(formData);
    console.log(`field: `);
    console.log(field);
    console.log(`fieldsMetadata: `);
    console.log(fieldsMetadata);
    console.log(`viewMetadata: `);
    console.log(viewMetadata);
    console.log(`formViewData: `);
    console.log(formViewData);

    return (
        <>
            <div className="flex justify-center">
                <BarChartRenderer question={formViewData?.data}/>
            </div>
        </>
    );
};

export default BarChartWidget;