import { SolidListFieldWidgetProps } from "../../../../../../types/solid-core";
import { useState } from "react";
import { solidGet } from "../../../../../../http/solidHttp";
import { SolidButton } from "../../../../../shad-cn-ui";
import { useDispatch } from "react-redux";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { X } from "lucide-react";

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_COLORS = [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6"
];

const getColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

// =========================
// Pivot Transform
// =========================
const transformToPivot = (groupMeta: any[]) => {
    const pivot: Record<string, Record<string, number>> = {};
    const stageSet = new Set<string>();

    groupMeta.forEach((item: any) => {
        const groupValue = item.groupValue || "";
        const count = item.id_count || 0;

        const parts = groupValue.split("_");
        const stage = parts.pop();
        const broker = parts.join("_");

        if (!broker || !stage) return;

        stageSet.add(stage);
        if (!pivot[broker]) pivot[broker] = {};
        pivot[broker][stage] = count;
    });

    const stages = Array.from(stageSet);

    Object.keys(pivot).forEach((broker) => {
        stages.forEach((stage) => {
            if (pivot[broker][stage] === undefined) {
                pivot[broker][stage] = 0;
            }
        });
    });

    return { pivot, stages };
};

type PivotData = ReturnType<typeof transformToPivot>;

// =========================
// Chart Component
// =========================
const PivotChart = ({ data }: { data: PivotData }) => {
    const { pivot, stages } = data;

    const queues = Object.keys(pivot).sort((a, b) => {
        const sum = (q: string) =>
            stages.reduce((acc, s) => acc + (pivot[q]?.[s] || 0), 0);
        return sum(b) - sum(a);
    });

    const chartData = {
        labels: queues,
        datasets: stages.map((stage, index) => ({
            label: stage,
            data: queues.map((q) => pivot[q]?.[stage] || 0),
            backgroundColor: getColor(index)
        }))
    };

    const options: any = {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true }
        }
    };

    return <Bar data={chartData} options={options} />;
};

// =========================
// Widget
// =========================
export const SolidMqMessagesSummarizeListHeaderAction = ({
    solidListViewMetaData
}: SolidListFieldWidgetProps) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [pivotData, setPivotData] = useState<PivotData | null>(null);

    const handleContinue = async () => {
        setLoading(true);

        const selectedRows = solidListViewMetaData?.selectedRows || [];

        const filters = selectedRows
            .map(
                (row: any, index: number) =>
                    `filters[$and][0][$or][${index}][id][$eq]=${row.id}`
            )
            .join("&");

        const qs = [
            "offset=0",
            "limit=100",
            "groupBy[0]=messageBroker",
            "groupBy[1]=stage",
            "aggregates[0]=id:count",
            filters || null
        ]
            .filter(Boolean)
            .join("&");

        const res = await solidGet(`/mq-message?${qs}`);
        setPivotData(transformToPivot(res?.data?.data?.groupMeta ?? []));
        setLoading(false);
    };

    return (
        <div>
            <div className="solid-filter-dialog-head">
                <div>
                    <h3 className="solid-filter-dialog-title">MQ Message Summary</h3>
                </div>
                <button
                    className="solid-radix-dialog-close"
                    aria-label="Close"
                    onClick={() => dispatch(closePopup())}
                >
                    <X size={16} />
                </button>
            </div>

            <div className="solid-filter-dialog-sep" />

            <div className="solid-filter-dialog-body">
                <div style={{ textAlign: "center",marginBottom:"10px",marginTop:"10px" }}>

                    <p style={{ textAlign: "center", fontSize: "13px", marginBottom: "0" }}>
                        You can summarize based on selected records or the full dataset.
                        <br />
                        Click <strong>Continue</strong> to load the summary.
                    </p>
                    <SolidButton
                        size="small"
                        loading={loading}
                        onClick={handleContinue}
                    >
                        Continue
                    </SolidButton>

                </div>
                {pivotData && (
                    <div style={{ marginTop: "20px" }}>
                        <PivotChart data={pivotData} />
                    </div>
                )}
            </div>


        </div>
    );
};
