
import { useEffect, useRef } from "react";
import "../../../../components/core/dashboard/chart-renderers/init-chartjs";
import { Bar, Line, Pie } from "react-chartjs-2";
import { ChartJSOrUndefined } from "node_modules/react-chartjs-2/dist/types";

type ChartJsRendererProps = {
    options: any;
    visualizationData: any;
    visualizedAs: 'bar' | 'line' | 'pie';
};
export const ChartJsRenderer = ({ options, visualizationData, visualizedAs }: ChartJsRendererProps) => {

    const chartRef = useRef<ChartJSOrUndefined>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => {
            if (chartRef.current) {
                chartRef.current.resize();  // ✅ tell Chart.js to refit
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Merge in responsive options
    const mergedOptions = {
        ...options,
        responsive: true,
        maintainAspectRatio: false,  // ✅ allows chart to fill container height
    };


    return (
        <>
            <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>

                {visualizedAs === 'bar' && <Bar ref={chartRef as any} options={mergedOptions} data={visualizationData} />}
                {visualizedAs === 'line' && <Line ref={chartRef as any} options={mergedOptions} data={visualizationData} />}
                {visualizedAs === 'pie' && <Pie ref={chartRef as any} options={mergedOptions} data={visualizationData} />}
            </div>
        </>
    );
}