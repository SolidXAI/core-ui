"use client"
import BarChartRenderer from './chart-renderers/BarChartRenderer';
import LineChartRenderer from './chart-renderers/LineChartRenderer';
import PieChartRenderer from './chart-renderers/PieChartRenderer';
import styles from './SolidDashboard.module.css'

export const SolidQuestionRenderer = ({ question }: any) => {
    const textAlign = question?.textAlign ?? 'start'
    return (
        <div className={`${styles.SolidChartCardWrapper} p-4`}>
            <div className={`font-medium text-${textAlign} ${styles.SolidChartTitle}`}>{question.name}</div>
            <div className={`mt-2 font-bold text-2xl text-${textAlign} ${styles.SolidChartTitle}`}>{question.name}</div>
            <div className='mt-3'>
                {question.visualisedAs === 'bar' && <BarChartRenderer question={question} />}
                {question.visualisedAs === 'line' && <LineChartRenderer question={question} />}
                {question.visualisedAs === 'pie' && <PieChartRenderer question={question} />}
            </div>
        </div>
    )
}