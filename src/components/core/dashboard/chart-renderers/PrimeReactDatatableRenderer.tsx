"use client";
import { SolidChartRendererProps } from "@/types/solid-core";
import { Message } from 'primereact/message';
import { MeterGroup } from 'primereact/metergroup';
import { useGetDashboardQuestionDataByIdQuery } from '@/redux/api/dashboardQuestionApi';
import "@/components/core/dashboard/chart-renderers/init-chartjs";
import qs from 'qs';
import { ProgressSpinner } from "primereact/progressspinner";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";

const PrimeReactDatatableRenderer = ({ question, filters = [], isPreview = false }: SolidChartRendererProps) => {
    if (!question) {
        return (
            <>
                <Message text="Preview Unavailable" />
            </>
        )
    }
    console.log(`Rendering PrimeReactDatatableRenderer using question id: ${question.id}`);

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
    // {
    //   "size": "small",
    //   "showGridlines": true,
    //   "stripedRows": true,
    //   "pagination": {
    //     "rows": 10,
    //     "rowsPerPageOptions": [5, 10, 25, 50]
    //   }
    // }    

    const size = options.size || 'small';
    const showGridlines = options.showGridLines || false;
    const stripedRows = options.stripedRows || false;
    const paginator = options.pagination || false;
    const rows = options.pagination?.rows || 10;
    const rowsPerPageOptions = options.pagination?.rowsPerPageOptions || [5, 10, 25, 50];

    if (!questionData) {
        return (
            <>
                <ProgressSpinner />
            </>
        );
    }

    const columns = questionData.data.visualizationData.columns;
    const data = questionData.data.visualizationData.rows;

    return (
        <>
            {questionDataIsLoading && <ProgressSpinner />}
            {!questionDataIsLoading && (
                <DataTable value={data} tableStyle={{ minWidth: '50rem' }} size={size} showGridlines={showGridlines} stripedRows={stripedRows} paginator={paginator} rows={rows} rowsPerPageOptions={rowsPerPageOptions} >
                    {
                        columns.map((col: any, i: number) => (
                            <Column key={col.field} field={col.field} header={col.header} />
                        ))
                    }
                </DataTable>)

            }
        </>
    )
};

export default PrimeReactDatatableRenderer;