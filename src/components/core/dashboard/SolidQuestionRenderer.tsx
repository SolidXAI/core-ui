
import type { ReactNode } from 'react';
import { useGetDashboardQuestionDataByIdQuery } from '../../../redux/api/dashboardQuestionApi';
import { SqlExpression } from '../../../types/solid-core';
import { SolidMessage, SolidSpinner } from '../../shad-cn-ui';
import qs from 'qs';
import { ChartJsRenderer } from './chart-renderers/ChartJsRenderer';
import PrimeReactDatatableRenderer from './chart-renderers/PrimeReactDatatableRenderer';
import styles from './SolidDashboard.module.css';

type SolidQuestionRendererProps = {
    question: any;
    filters: SqlExpression[];
    isPreview: boolean;
};

type DataItem = {
    value: number;
    label?: string | ReactNode;
    color?: string;
}

export const SolidQuestionRenderer = ({ question, filters = [], isPreview = false }: SolidQuestionRendererProps) => {
    if (!question) {
        return (
            <div className={`${styles.SolidChartCardWrapper} p-4`}>
                <SolidMessage text="Preview Unavailable" />
            </div>
        );
    }

    const textAlign = question?.textAlign ?? 'start'
    if (!question) {
        return (
            <SolidMessage text="Preview Unavailable" />
        )
    }
    // console.log(`Rendering BarChartRenderer using question id: ${question.id}`);

    // load the question data.
    const queryParams = qs.stringify(
        {
            isPreview,
            filters,
        },
        // ensures proper handling of arrays
        // { arrayFormat: 'indices' }
    );
    const { data: questionData, isLoading: questionDataIsLoading, error: questionDataError } = useGetDashboardQuestionDataByIdQuery({ id: question.id, qs: queryParams });


    // console.log(`Question data: `); console.log(questionData);
    // console.log(`Question data is loading: `); console.log(questionDataIsLoading);
    // console.log(`Question data error: `); console.log(questionDataError);
    const options = JSON.parse(question?.chartOptions);
    // const kpi = questionData.data.kpi;
    // const visualizationData = questionData.data.visualizationData;
    // const visualizedAs = question.data.visualisedAs;
    return (
        <>
            {questionDataIsLoading && <SolidSpinner />}
            {!questionDataIsLoading &&
                <div className={`${styles.SolidChartCardWrapper} h-full`}>
                    <div className='flex flex-col p-4 pb-3' style={{ borderBottom: "1px solid #e4e3e3" }}>
                        <div className={`font-medium text-${textAlign} ${styles.SolidChartTitle}`}>{question.name}</div>
                        <div className={`mt-2 font-bold text-3xl text-${textAlign} ${styles.SolidChartTitle}`}>{questionData.data.kpi}</div>
                    </div>
                    <div className='mt-3 flex-1 min-h-0 p-4 pt-2'>
                        {['bar', 'line', 'pie'].includes(question.visualisedAs) && <ChartJsRenderer options={options} visualizationData={questionData.data.visualizationData} visualizedAs={question.visualisedAs} />}
                        {question.visualisedAs === 'prime-meter-group' && (() => {
                            const dataset: DataItem[] = questionData.data.visualizationData.dataset;
                            const total = dataset.reduce((sum, it) => sum + it.value, 0) || 1;
                            return (
                                <div className="solid-meter-group">
                                    {dataset.map((item: DataItem, idx: number) => {
                                        const percentage = Math.round((item.value / total) * 100);
                                        return (
                                            <div key={`${item.label}-${idx}`} className="solid-meter-group-row">
                                                <span className="solid-meter-group-label">{item.label}</span>
                                                <div className="solid-meter-group-bar">
                                                    <div
                                                        className="solid-meter-group-bar-fill"
                                                        style={{ width: `${percentage}%`, backgroundColor: item.color || 'var(--solid-surface-accent)' }}
                                                    />
                                                </div>
                                                <span className="solid-meter-group-value">{percentage}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        {question.visualisedAs === 'prime-datatable' && <PrimeReactDatatableRenderer options={options} visualizationData={questionData.data.visualizationData} />}
                    </div>
                </div>
            }
        </>
    )
}
