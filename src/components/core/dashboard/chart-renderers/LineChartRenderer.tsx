"use client";
import { SolidChartRendererProps } from "@/types/solid-core";
import { Message } from 'primereact/message';
import { useGetQuestionDataByIdQuery } from '@/redux/api/questionApi';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Line } from 'react-chartjs-2';
import "@/components/core/dashboard/chart-renderers/init-chartjs";
import qs from 'qs';

const LineChartRenderer = ({ question, filters=[], isPreview=false }: SolidChartRendererProps) => {
    if (!question) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }
    console.log(`Rendering LineChartRenderer using question id: ${question.id}`);

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

    const options = JSON.parse(question.barChartLabelOptions);

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && <Line options={options} data={questionData.data} />}
        </>
    );
};

export default LineChartRenderer;