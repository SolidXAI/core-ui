"use client";
import { Bar } from 'react-chartjs-2';
import { SolidChartRendererProps } from "@/types/solid-core";
import { Message } from 'primereact/message';
import { useGetQuestionDataByIdQuery } from '@/redux/api/questionApi';
import { ProgressSpinner } from 'primereact/progressspinner';
import "@/components/core/dashboard/chart-renderers/init-chartjs";

const BarChartRenderer = ({ question }: SolidChartRendererProps) => {
    if (!question) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }
    console.log(`Rendering BarChartRenderer using question id: ${question.id}`);

    // load the question data.
    const { data: questionData, isLoading: questionDataIsLoading, error: questionDataError } = useGetQuestionDataByIdQuery({ id: question.id, qs: '' });

    console.log(`Question data: `); console.log(questionData);
    console.log(`Question data is loading: `); console.log(questionDataIsLoading);
    console.log(`Question data error: `); console.log(questionDataError);
    const options = JSON.parse(question.barChartLabelOptions);

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && <Bar options={options} data={questionData.data} />}
        </>
    );
};

export default BarChartRenderer;