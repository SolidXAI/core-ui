"use client";
import "@/components/core/dashboard/chart-renderers/init-chartjs";
import { useGetDashboardQuestionDataByIdQuery } from '@/redux/api/dashboardQuestionApi';
import { SolidChartRendererProps } from "@/types/solid-core";
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Pie } from 'react-chartjs-2';
import qs from 'qs';

const PieChartRenderer = ({ question, filters = [], isPreview = false }: SolidChartRendererProps) => {
    if (!question) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }
    console.log(`Rendering PieChartRenderer using question id: ${question.id}`);

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

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && <Pie data={questionData.dat.visualizationData} />}
        </>
    );
};

export default PieChartRenderer;