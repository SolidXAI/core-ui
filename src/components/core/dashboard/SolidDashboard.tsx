"use client";
import { DashboardResponse, useGetDashboardQuery } from '@/redux/api/dashboardApi';
import moment from 'moment';
import qs from 'qs';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import SolidDashboardBody, { SolidDashboardBodyProps } from './SolidDashboardBody';
import SolidDashboardVariableFilterDialog from './SolidDashboardVariableFilterWrapper';

export enum SolidDashboardVariableType {
  DATE = 'date',
  SELECTION_STATIC = 'selectionStatic',
  SELECTION_DYNAMIC = 'selectionDynamic',
}

enum SOURCE_TYPE {
  SQL = 'sql',
  PROVIDER = 'provider',
}
export interface ISolidDashboardVariableRecord {
  id : number;
  name: string;
  type: SolidDashboardVariableType;
  isMultiple: boolean;
  selectionStaticValues?: string[]; // For static selection variables
  selectionDyanmicSourceType?: SOURCE_TYPE; // For dynamic selection variables
  selectionDynamicProviderName?: string; // For dynamic selection variables
  selectionDynamicSQL?: string; // For dynamic selection variables
  sourceType?: SOURCE_TYPE;
}

export interface ISolidDashboardVariableFilterRule extends ISolidDashboardVariableRecord {
  value: any; // The value(s) selected by the user
  matchMode: string;
}

function handleDashboardData(data: DashboardResponse, setLayoutOption: Dispatch<SetStateAction<SolidDashboardBodyProps>>, setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>) {
  const { records, meta } = data;
  if (records && records.length > 0) {
    // Set the layout options for the dashboard body
    const dashboardData = records[0]; // Assuming we want the first dashboard
    setLayoutOption(getDashboardLayoutOptions(dashboardData));

    // Set the filter rules based on the dashboard variables
    const variables = dashboardData.dashboardVariables || [];
    const defaultRules = getDefaultFilterRules(variables);
    setDashboardVariableFilterRules(defaultRules);
  }
}

function getDefaultFilterRules(variables: any) {
  const formattedVariables: ISolidDashboardVariableRecord[] = variables.map((variable: any) => ({
    id: variable.id,
    name: variable.variableName,
    type: variable.variableType,
    isMultiple: variable.isMultiple || false,
    selectionStaticValues: variable.selectionStaticValues ? JSON.parse(variable.selectionStaticValues) : [],
    selectionDyanmicSourceType: variable.selectionDyanmicSourceType || SOURCE_TYPE.SQL,
    selectionDynamicProviderName: variable.selectionDynamicProviderName || '',
    selectionDynamicSQL: variable.selectionDynamicSQL || '',
    sourceType: variable.sourceType || SOURCE_TYPE.SQL,
  }));

  // Set the filter rules based on the formatted variables
  const filterRules = formattedVariables.map((variable: ISolidDashboardVariableRecord) => {
    // Based on the variable type, set default values and match modes
    // Date variables will be for the last 1 month by default
    // Selection variables will be '' the first option by default
    switch (variable.type) {
      case SolidDashboardVariableType.DATE:
        return {
          ...variable,
          value: moment().subtract(1, 'months').toDate(), // Value need to be 1 month ago for date variable
          matchMode: '$gte', // Default match mode for date variable
        };
      case SolidDashboardVariableType.SELECTION_STATIC:
        return {
          ...variable,
          value: variable?.selectionStaticValues?.[0] || '', // Default to first static selection value
          matchMode: '$in', // Default match mode for selection static variable
        };
      case SolidDashboardVariableType.SELECTION_DYNAMIC:
        return {
          ...variable,
          value: [{label: "Oswald Rodrigues", value: "oswald@logicloop.io"}], //FIXME: Default value for dynamic selection variable
          matchMode: '$in', // Default match mode for selection dynamic variable
        };
      default:
        return {
          ...variable,
          value: '', // Default value for other types
          matchMode: '$eq',
        };
    }
  });
  return filterRules;
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

const SolidDashboard = () => {
  const { data, isLoading, error } = useGetDashboardQuery(getQueryParams()) //FIXME : error handling should be done properly
  // Define a state called layoutOption and pass it after destructing the widgetOptions and dashboardOptions from layoutOption
  const [layoutOption, setLayoutOption] = useState<SolidDashboardBodyProps>({});
  // const [dashboardVariables, setDashboardVariables] = useState<SolidDashboardVariableRecord[]>([]);
  const [dashboardVariableFilterRules, setDashboardVariableFilterRules] = useState<ISolidDashboardVariableFilterRule[]>([]);

  useEffect(() => {
    // Invoke the dashboard api to fetch the dashboard data
    // console.log('Dashboard Data testing:', isLoading, data, error);
    if (!isLoading && data) {
      // Assuming data contains the layout options
      handleDashboardData(data, setLayoutOption, setDashboardVariableFilterRules);
    }
  }, [isLoading, data]);


  return (
    <div className="h-screen surface-0">
      {isLoading && <p>Loading dashboard...</p>}
      {error && <p className="text-red-600">Failed to load dashboard.</p>}
      {!isLoading && !error && (
        <>
          <SolidDashboardVariableFilterDialog dashboardVariableFilterRules={dashboardVariableFilterRules} setDashboardVariableFilterRules={setDashboardVariableFilterRules} />
          <SolidDashboardBody
            dashboardOptions={layoutOption.dashboardOptions ?? {}}
            widgetOptions={layoutOption.widgetOptions ?? []}
          />
        </>
      )}
    </div>
  );
}

export default SolidDashboard;
