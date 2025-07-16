"use client"
import { SqlExpression } from '@/types/solid-core';
import BarChartRenderer from './chart-renderers/BarChartRenderer';
import LineChartRenderer from './chart-renderers/LineChartRenderer';
import PieChartRenderer from './chart-renderers/PieChartRenderer';
import styles from './SolidDashboard.module.css'
import PrimeReactMeterGroupRenderer from './chart-renderers/PrimeReactMeterGroupRenderer';
import PrimeReactDatatableRenderer from './chart-renderers/PrimeReactDatatableRenderer';
import { Message } from 'primereact/message';

type SolidQuestionRendererProps = {
    question: any;
    filters: SqlExpression[];
    isPreview: boolean;
};

export const SolidQuestionRenderer = ({ question, filters = [], isPreview = false }: SolidQuestionRendererProps) => {
    if (!question) {
        return (
            <div className={`${styles.SolidChartCardWrapper} p-4`}>
                <Message text="Preview Unavailable" />
            </div>
        );
    }

    const textAlign = question?.textAlign ?? 'start'
    return (
        <div className={`${styles.SolidChartCardWrapper} p-4`}>
            <div className={`font-medium text-${textAlign} ${styles.SolidChartTitle}`}>{question.name}</div>
            <div className={`mt-2 font-bold text-2xl text-${textAlign} ${styles.SolidChartTitle}`}>{question.name}</div>
            <div className='mt-3'>
                {question.visualisedAs === 'bar' && <BarChartRenderer question={question} filters={filters} isPreview={isPreview} />}
                {question.visualisedAs === 'line' && <LineChartRenderer question={question} filters={filters} isPreview={isPreview} />}
                {question.visualisedAs === 'pie' && <PieChartRenderer question={question} filters={filters} isPreview={isPreview} />}
                {question.visualisedAs === 'prime-meter-group' && <PrimeReactMeterGroupRenderer question={question} filters={filters} isPreview={isPreview} />}
                {question.visualisedAs === 'prime-datatable' && <PrimeReactDatatableRenderer question={question} filters={filters} isPreview={isPreview} />}
            </div>
        </div>
    )
}