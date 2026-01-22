"use client";

import { SolidFormWidgetProps } from "@solid-ui/types";
import { Message } from 'primereact/message';
import { SolidQuestionRenderer } from "@solid-ui/components/core/dashboard/SolidQuestionRenderer";

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
            <div className="mt-3 p-2">
                <SolidQuestionRenderer question={formViewData?.data} isPreview={true} filters={[]} />
            </div>
    );
};

export default ChartFormPreviewWidget;