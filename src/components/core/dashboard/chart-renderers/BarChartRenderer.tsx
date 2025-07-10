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

    // const [books, setBooks] = useState<any[]>([]);
    // useEffect(() => {}, []);

    // const options = {
    //     responsive: true,
    //     plugins: {
    //         legend: {
    //             position: 'top' as const,
    //         },
    //         title: {
    //             display: true,
    //             text: 'Chart.js Bar Chart',
    //         },
    //     },
    // };
    const options = JSON.parse(question.barChartLabelOptions);

    // const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

    // const data = {
    //     labels,
    //     datasets: [
    //         {
    //             label: 'Dataset 1',
    //             data: labels.map(() => faker.number.int({ min: 0, max: 1000 })),
    //             backgroundColor: 'rgba(255, 99, 132, 0.5)',
    //         },
    //         {
    //             label: 'Dataset 2',
    //             data: labels.map(() => faker.number.int({ min: 0, max: 1000 })),
    //             backgroundColor: 'rgba(53, 162, 235, 0.5)',
    //         },
    //         {
    //             label: 'Dataset 3',
    //             data: labels.map(() => faker.number.int({ min: 0, max: 1000 })),
    //             backgroundColor: 'rgba(53, 235, 162, 0.5)',
    //         },
    //     ],
    // };

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && <Bar options={options} data={questionData.data} />}
        </>
    );
};

export default BarChartRenderer;