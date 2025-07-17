"use client";
import { Bar } from 'react-chartjs-2';
import { SolidChartRendererProps } from "@/types/solid-core";
import { Message } from 'primereact/message';
import { useGetDashboardQuestionDataByIdQuery } from '@/redux/api/dashboardQuestionApi';
import { ProgressSpinner } from 'primereact/progressspinner';
import "@/components/core/dashboard/chart-renderers/init-chartjs";
import qs from 'qs';

const BarChartRenderer = ({ question, filters = [], isPreview = false }: SolidChartRendererProps) => {
    if (!question) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }
    console.log(`Rendering BarChartRenderer using question id: ${question.id}`);

    // load the question data.
    const queryParams = qs.stringify(
        {
            isPreview,
            filters,
        },
        // ensures proper handling of arrays
        { arrayFormat: 'brackets' }
    );
    const { data: questionData, isLoading: questionDataIsLoading, error: questionDataError } = useGetDashboardQuestionDataByIdQuery({ id: question.id, qs: queryParams });

    console.log(`Question data: `); console.log(questionData);
    console.log(`Question data is loading: `); console.log(questionDataIsLoading);
    console.log(`Question data error: `); console.log(questionDataError);
    const options = JSON.parse(question.chartOptions);

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && <Bar options={options} data={questionData.data.visualizationData} />}
        </>
    );
};

export default BarChartRenderer;