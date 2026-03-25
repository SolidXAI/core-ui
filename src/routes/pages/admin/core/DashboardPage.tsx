import SolidDashboard from '../../../../components/core/dashboard/SolidDashboard'
import { useParams, useSearchParams } from "react-router-dom";

export function DashboardPage() {
    const params = useParams();

    const dashboardName = params.dashboardName;
    const moduleName = params.moduleName as string;
    return (
        <div>
            <SolidDashboard moduleName={moduleName} dashboardName={dashboardName} />
        </div>
    );
}
