"use client";
import "@/components/core/dashboard/chart-renderers/init-chartjs";
import { useGetQuestionDataByIdQuery } from '@/redux/api/questionApi';
import { SolidChartRendererProps } from "@/types/solid-core";
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Pie } from 'react-chartjs-2';

const PieChartRenderer = ({ question }: SolidChartRendererProps) => {
    if (!question) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }
    console.log(`Rendering PieChartRenderer using question id: ${question.id}`);

    // load the question data.
    const { data: questionData, isLoading: questionDataIsLoading, error: questionDataError } = useGetQuestionDataByIdQuery({ id: question.id, qs: '' });

    console.log(`Question data: `); console.log(questionData);
    console.log(`Question data is loading: `); console.log(questionDataIsLoading);
    console.log(`Question data error: `); console.log(questionDataError);

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && <Pie data={questionData.data} />}
        </>
    );
};

export default PieChartRenderer;