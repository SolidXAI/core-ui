"use client";
import { SolidChartRendererProps } from "@/types/solid-core";
import { Message } from 'primereact/message';
import { MeterGroup } from 'primereact/metergroup';
import { useGetQuestionDataByIdQuery } from '@/redux/api/questionApi';
import "@/components/core/dashboard/chart-renderers/init-chartjs";
import qs from 'qs';
import { ProgressSpinner } from "primereact/progressspinner";

const PrimeReactMeterGroupRenderer = ({ question, filters = [], isPreview = false }: SolidChartRendererProps) => {
    if (!question) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }
    console.log(`Rendering PrimeReactMeterGroupRenderer using question id: ${question.id}`);

    // load the question data.
    const queryParams = qs.stringify(
        {
            isPreview,
            filters,
        },
        // ensures proper handling of arrays
        { arrayFormat: 'brackets' }
    );
    const { data: questionData, isLoading: questionDataIsLoading, error: questionDataError } = useGetQuestionDataByIdQuery({ id: question.id, qs: queryParams });

    console.log(`Question data: `); console.log(questionData);
    console.log(`Question data is loading: `); console.log(questionDataIsLoading);
    console.log(`Question data error: `); console.log(questionDataError);
    // const options = JSON.parse(question.barChartLabelOptions);
    // const values = [
    //     { label: 'Apps', color: '#34d399', value: 16 },
    //     { label: 'Messages', color: '#fbbf24', value: 8 },
    //     { label: 'Media', color: '#60a5fa', value: 24 },
    //     { label: 'System', color: '#c084fc', value: 10 }
    // ];

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && <div className="card flex justify-content-center"><MeterGroup values={questionData.data} /></div>}
        </>
    )

};

export default PrimeReactMeterGroupRenderer;