"use client";

import { SolidFormWidgetProps } from "@/types";
import BarChartRenderer from "@/components/core/dashboard/chart-renderers/BarChartRenderer";
import LineChartRenderer from "@/components/core/dashboard/chart-renderers/LineChartRenderer";
import { Message } from 'primereact/message';
import PieChartRenderer from "@/components/core/dashboard/chart-renderers/PieChartRenderer";
import { SolidQuestionRenderer } from "@/components/core/dashboard/SolidQuestionRenderer";

const ChartFormPreviewWidget = ({ formData, field, fieldsMetadata, viewMetadata, formViewData }: SolidFormWidgetProps) => {
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

    if (!formData || !formData.visualisedAs) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }

    const visualisedAs = formData.visualisedAs.value;

    return (
        <>
            <div className="flex justify-center">
                <SolidQuestionRenderer question={formViewData?.data} />
            </div>
        </>
    );
};

export default ChartFormPreviewWidget;