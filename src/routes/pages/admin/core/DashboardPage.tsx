import SolidDashboard from '../../../../components/core/dashboard/SolidDashboard'
import { useParams, useSearchParams } from "react-router-dom";

export function DashboardPage() {
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const dashboardIdParam = params.dashboardId;
    const moduleName = params.moduleName as string;
    const dashboardId = dashboardIdParam !== null ? Number(dashboardIdParam) : undefined;
    const name = searchParams.get('dashboardName') ?? undefined;
    return (
        <div>
            <SolidDashboard dashboardId={dashboardId} moduleName={moduleName} dashboardName={name} />
        </div>
    );
}
