"use client";
import { DashboardResponse, useGetDashboardQuery } from '@/redux/api/dashboardApi';
import moment from 'moment';
import qs from 'qs';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import SolidDashboardBody, { SolidDashboardBodyProps } from './SolidDashboardBody';
import SolidDashboardVariableFilterDialog from './SolidDashboardVariableFilterWrapper';
import { SqlExpression } from '@/types/solid-core';
import styles from './SolidDashboard.module.css';
import { SolidXAIIcon } from '../solid-ai/SolidXAIIcon';
import { SolidXAIModule } from '../solid-ai/SolidXAIModule';
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
  id: number;
  name: string;
  type: SolidDashboardVariableType;
  isMultiple: boolean;
  selectionStaticValues?: string[]; // For static selection variables
  selectionDyanmicSourceType?: SOURCE_TYPE; // For dynamic selection variables
  selectionDynamicProviderName?: string; // For dynamic selection variables
  selectionDynamicSQL?: string; // For dynamic selection variables
  sourceType?: SOURCE_TYPE;
}

// TODO [HP]: We can remove references to this as we now have a SqlExpression 
export interface ISolidDashboardVariableFilterRule extends ISolidDashboardVariableRecord {
  value: any; // The value(s) selected by the user
  matchMode: string;
}

function handleDashboardData(
  data: DashboardResponse,
  setLayoutOption: Dispatch<SetStateAction<SolidDashboardBodyProps>>,
  setDashboardVariableFilterRules: Dispatch<SetStateAction<ISolidDashboardVariableFilterRule[]>>,
  setQuestions: any,
  setFilters: any
) {
  const { records, meta } = data;
  if (records && records.length > 0) {
    // Set the layout options for the dashboard body
    const dashboardData = records[0]; // Assuming we want the first dashboard
    setLayoutOption(getDashboardLayoutOptions(dashboardData));
    setQuestions(dashboardData.questions)

    // TODO [HP]: We can remove references to this as we now have a SqlExpression 
    // Set the filter rules based on the dashboard variables
    const variables = dashboardData.dashboardVariables || [];
    const defaultRules = getDefaultFilterRules(variables);
    setDashboardVariableFilterRules(defaultRules);

    // Read the variables and default values and oprerators and pre-populate the filters array.
    const filters = variables.map((variable: any) => {
      return {
        variableName: variable.variableName,
        operator: variable.defaultOperator,
        value: JSON.parse(variable.defaultValue),
      }
    });
    setFilters(filters);

  }
}

// TODO [HP]: Maybe we don't need this at all...since now we are using SqlExpression directly...
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
          value: [{ label: "Oswald Rodrigues", value: "oswald@logicloop.io" }], //FIXME: Default value for dynamic selection variable
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

function getQueryParams(moduleName: string, dashboardId?: number, dashboardName?: string) {
  const filters: any = {
    module: {
      name: {
        $eq: moduleName
      }
    }
  };

  if (dashboardId !== undefined) {
    filters.id = { $eq: dashboardId };
  } else if (dashboardName !== undefined) {
    filters.name = { $eq: dashboardName };
  }

  const query = {
    filters,
    populate: ['dashboardVariables', 'questions']
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
    dashboardOptions: layoutJsonParsed.dashboardOptions || {},
    questions: [],
    filters: []
  };
}

type SolidDashboardViewProps = {
  moduleName: string;
  dashboardId?: number;
  dashboardName?: string;
};

const SolidDashboard = (params: SolidDashboardViewProps) => {
  const { data, isLoading, error } = useGetDashboardQuery(getQueryParams(params.moduleName, params.dashboardId, params.dashboardName)) // FIXME : error handling should be done properly
  // Define a state called layoutOption and pass it after destructing the widgetOptions and dashboardOptions from layoutOption
  // TODO [HP]: Shouldn't the type of this state variable be something different? Why are we muddling this with layout but calling it body props? 
  // TODO [HP]: Body props should be clearly made up of Gridstack layout options, the questions that make up the body & the filter[] which is an array of SqlExpressions
  // TODO [HP]: This is fully CONFUSED
  const [layoutOption, setLayoutOption] = useState<SolidDashboardBodyProps>({
    filters: [],
    questions: [],
  });

  // TODO [HP]: replace dashboardVariableFilterRules with filters everywhere...
  const [dashboardVariableFilterRules, setDashboardVariableFilterRules] = useState<ISolidDashboardVariableFilterRule[]>([]);
  const [filters, setFilters] = useState<SqlExpression[]>([]);
  const [isOpenSolidXAiPanel, setIsOpenSolidXAiPanel] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  useEffect(() => {
    // Invoke the dashboard api to fetch the dashboard data
    // console.log('Dashboard Data testing:', isLoading, data, error);
    if (!isLoading && data) {
      // Assuming data contains the layout options
      handleDashboardData(data, setLayoutOption, setDashboardVariableFilterRules, setQuestions, setFilters);
    }
  }, [isLoading, data]);
  const toggleSolidXAiPanel = () => setIsOpenSolidXAiPanel(!isOpenSolidXAiPanel);

  return (
    <div className={`h-screen surface-0 relative`}>
      <div className={`h-full flex-grow-1 relative ${styles.SolidDashboardPageContentWrapper} ${isOpenSolidXAiPanel ? styles.SolidDashboardPageContentWrapperShrink : ''}`}>
        {isLoading && <p>Loading dashboard...</p>}
        {error && <p className="text-red-600">Failed to load dashboard.</p>}
        {!isLoading && !error && (
          <>
            <SolidDashboardVariableFilterDialog
              dashboardVariableFilterRules={dashboardVariableFilterRules}
              setDashboardVariableFilterRules={setDashboardVariableFilterRules}
              setFilters={setFilters}
              data={data}
            />

            <SolidDashboardBody questions={questions} filters={filters} />

            {/* <SolidDashboardBody
            dashboardOptions={layoutOption.dashboardOptions ?? {}}
            widgetOptions={layoutOption.widgetOptions ?? []}
          /> */}
          </>
        )}
        {process.env.NEXT_PUBLIC_ENABLE_SOLIDX_AI === 'true' && (
          <button className={styles.SolidXAIFloatingBtn} onClick={toggleSolidXAiPanel}>
            <div className="flex gap-2"> <SolidXAIIcon /> SolidX AI </div>
          </button>
        )}
      </div>
      {process.env.NEXT_PUBLIC_ENABLE_SOLIDX_AI === 'true' && (
        <div className={`${styles.SolidXAIListPanel} ${isOpenSolidXAiPanel ? styles.SolidXAIListPanelOpen : ''}`}>
          <SolidXAIModule showHeader inListView />
        </div>
      )}
    </div>
  );
}

export default SolidDashboard;
