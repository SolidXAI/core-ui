"use client";
import { use, useEffect, useState } from 'react';
import SolidDashboardBody, { SolidDashboardBodyProps } from './SolidDashboardBody';
import { useGetDashboardQuery } from '@/redux/api/dashboardApi';
import qs from 'qs';

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
        // Read the layout json from the dashboard data & parse it
        const layoutJsonParsed = dashboardData.layoutJson ? JSON.parse(dashboardData.layoutJson) : {};

        setLayoutOption({
          widgetOptions: layoutJsonParsed.widgetOptions || [],
          dashboardOptions: layoutJsonParsed.dashboardOptions || {}
        });
      }
    }
  }, [isLoading, data]);


  return (
    <div>
      {/* <SolidDashboardHeader /> */}
      {/* <SolidDashboardBody
        widgetOptions={[
          { x: 0, y: 0, w: 4, h: 2, content: 'Item 1' },
          { x: 4, y: 0, w: 4, h: 2, content: 'Item 2' },
          { x: 8, y: 0, w: 4, h: 2, content: 'Item 3' },
        ]}
      /> */}
      <SolidDashboardBody
        dashboardOptions={layoutOption.dashboardOptions}
        widgetOptions={layoutOption.widgetOptions}
      />
    </div>
  );
}
export default SolidDashboard;

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
