"use client";
import { DashboardResponse, useGetDashboardQuery } from '@/redux/api/dashboardApi';
import qs from 'qs';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import SolidDashboardBody, { SolidDashboardBodyProps } from './SolidDashboardBody';
import SolidDashboardVariableFilterWrapper from './SolidDashboardVariableFilterWrapper';

export enum SolidDashboardVariableType {
  DATE = 'date',
  SELECTION_STATIC = 'selection-static',
  SELECTION_DYNAMIC = 'selection-dynamic',
}

enum SOURCE_TYPE {
  SQL = 'sql',
  PROVIDER = 'provider',
}
export interface SolidDashboardVariableRecord {
  name: string;
  type: SolidDashboardVariableType;
  isMultiple: boolean;
}

const SolidDashboard = () => {
  const { data, isLoading, error } = useGetDashboardQuery(getQueryParams()) //FIXME : error handling should be done properly
  // Define a state called layoutOption and pass it after destructing the widgetOptions and dashboardOptions from layoutOption
  const [layoutOption, setLayoutOption] = useState<SolidDashboardBodyProps>({});
  const [dashboardVariables, setDashboardVariables] = useState<SolidDashboardVariableRecord[]>([]);

  useEffect(() => {
    // Invoke the dashboard api to fetch the dashboard data
    console.log('Dashboard Data testing:', isLoading, data, error);
    if (!isLoading && data) {
      // Assuming data contains the layout options
      handleDashboardData(data, setLayoutOption, setDashboardVariables);
    }
  }, [isLoading, data]);


  return (
    <div className="p-4">
      {isLoading && <p>Loading dashboard...</p>}
      {error && <p className="text-red-600">Failed to load dashboard.</p>}
      {!isLoading && !error && (
        <>
          <SolidDashboardVariableFilterWrapper dashboardVariables={dashboardVariables} />
          <SolidDashboardBody
            dashboardOptions={layoutOption.dashboardOptions ?? {}}
            widgetOptions={layoutOption.widgetOptions ?? []}
          />
        </>
      )}
    </div>
  );
}

function handleDashboardData(data: DashboardResponse, setLayoutOption: Dispatch<SetStateAction<SolidDashboardBodyProps>>, setDashboardVariables: Dispatch<SetStateAction<SolidDashboardVariableRecord[]>>) {
  const { records, meta } = data;
  if (records && records.length > 0) {
    const dashboardData = records[0]; // Assuming we want the first dashboard
    setLayoutOption(getDashboardLayoutOptions(dashboardData));
    // Extract dashboard variables from the dashboard data
    const variables = dashboardData.dashboardVariables || [];
    const formattedVariables = variables.map((variable: any) => ({
      name: variable.variableName,
      type: variable.variableType,
      isMultiple: variable.isMultiple || false,
    }));
    setDashboardVariables(formattedVariables);
  }
}

function getQueryParams() {
  const query = {
    filters: {
      module: {
        name: {
          $eq: 'library-management'
        }
      }
    },
    populate: ['dashboardVariables']
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
