import { useGetDashboardQuestionDataByIdQuery } from '../../../redux/api/dashboardQuestionApi';
import PrimeReactDatatableRenderer from "./chart-renderers/PrimeReactDatatableRenderer";
import { ProgressSpinner } from "primereact/progressspinner";
import styles from './SolidDashboard.module.css'
import qs from 'qs';

const PrimeDataTableWrapper = ({ question, filters }: any) => {
    const queryParams = qs.stringify(
        { isPreview: false, filters },
        { arrayFormat: 'brackets' }
    );

    const { data, isLoading } = useGetDashboardQuestionDataByIdQuery({
        id: question.id,
        qs: queryParams,
    });

    if (isLoading) return <ProgressSpinner />;

    const textAlign = question?.textAlign ?? 'start';

    return (
        <div className={`${styles.SolidChartCardWrapper} p-4`} style={{ maxHeight: '40vh', overflowY: 'auto' }}>
            <div className={`font-medium text-${textAlign}`}>
                {question.name}
            </div>

            <div className={`mt-2 font-bold text-3xl text-${textAlign}`}>
                {data?.data?.kpi}
            </div>

            <PrimeReactDatatableRenderer
                options={JSON.parse(question?.chartOptions)}
                visualizationData={data?.data?.visualizationData}
            />
        </div>
    );
};

export default PrimeDataTableWrapper;