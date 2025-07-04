"use client";
import { useGetDashboardQuery } from '@/redux/api/dashboardApi';
import qs from 'qs';
import { useEffect, useState } from 'react';
import SolidDashboardBody, { SolidDashboardBodyProps } from './SolidDashboardBody';
import SolidDashboardVariableFilterWrapper from './SolidDashboardVariableFilterWrapper';

const SolidDashboard = () => {
  const { data, isLoading, error } = useGetDashboardQuery(getQueryParams()) //FIXME : error handling should be done properly
  // Define a state called layoutOption and pass it after destructing the widgetOptions and dashboardOptions from layoutOption
  const [layoutOption, setLayoutOption] = useState<SolidDashboardBodyProps>({});

  useEffect(() => {
    // Invoke the dashboard api to fetch the dashboard data
    console.log('Dashboard Data testing:', isLoading, data, error);
    if (!isLoading && data) {
      // Assuming data contains the layout options
      const { records, meta } = data;
      if (records && records.length > 0) {
        const dashboardData = records[0]; // Assuming we want the first dashboard
        setLayoutOption(getDashboardLayoutOptions(dashboardData));
      }
    }
  }, [isLoading, data]);


  return (
    <div>
      <SolidDashboardVariableFilterWrapper />
      <SolidDashboardBody
        dashboardOptions={layoutOption.dashboardOptions}
        widgetOptions={layoutOption.widgetOptions}
      />
    </div>
  );
}

function getQueryParams() {
  const query = {
    filters: {
      module: {
        name: {
          $eq: 'library-management'
        }
      }
    }
  };
  const urlQuery = qs.stringify(query, {
    encodeValuesOnly: true,
  });
  return urlQuery;
}

function getDashboardLayoutOptions(dashboardRecord: any) {
  // Read the layout json from the dashboard data & parse it
  const layoutJsonParsed = dashboardRecord.layoutJson ? JSON.parse(dashboardRecord.layoutJson) : {};

  // This function can be used to fetch or define default dashboard layout options
  return {
    widgetOptions: layoutJsonParsed.widgetOptions || [],
    dashboardOptions: layoutJsonParsed.dashboardOptions || {}
  };
}
export default SolidDashboard;
