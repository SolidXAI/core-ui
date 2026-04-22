
import { SolidSpinner } from "../../../shad-cn-ui";

type PrimeReactDatatableRendererProps = {
    options: any;
    visualizationData: any;
}

const PrimeReactDatatableRenderer = ({ options, visualizationData }: PrimeReactDatatableRendererProps) => {
    // {
    //   "size": "small",
    //   "showGridlines": true,
    //   "stripedRows": true,
    //   "pagination": {
    //     "rows": 10,
    //     "rowsPerPageOptions": [5, 10, 25, 50]
    //   }
    // }    

    if (!visualizationData) {
        return <SolidSpinner />;
    }

    const columns = visualizationData.columns;
    const data = visualizationData.rows;

    return (
        <div className="solid-simple-table">
            <table>
                <thead>
                    <tr>
                        {columns.map((col: any) => (
                            <th key={col.field}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row: any, rowIndex: number) => (
                        <tr key={rowIndex}>
                            {columns.map((col: any) => (
                                <td key={`${rowIndex}-${col.field}`}>{row[col.field]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PrimeReactDatatableRenderer;
