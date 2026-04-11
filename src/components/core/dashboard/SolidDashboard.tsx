import { DashboardResponse, useGetDashboardQuery } from '../../../redux/api/dashboardApi';
import { SqlExpression } from '../../../types/solid-core';
import { SolidButton, SolidIcon, SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from '../../shad-cn-ui';
import qs from 'qs';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import styles from './SolidDashboard.module.css';
import SolidDashboardBody, { GridItem } from './SolidDashboardBody';
import { DashboardFilter } from './DashboardFilter';
// import { SolidAiMainWrapper } from '../solid-ai/SolidAiMainWrapper'; // moved to SolidX Studio panel
import { SolidDashboardFilterRequired } from './SolidDashboardFilterRequired';
import { SolidDashboardLoading } from './SolidDashboardLoading';
import { SolidDashboardRenderError } from './SolidDashboardRenderError';
import { useDispatch, useSelector } from "react-redux";
import { showNavbar, toggleNavbar } from "../../../redux/features/navbarSlice";
import SolidDashboardNotAvailable from './SolidDashboardNotAvailable';
import { showToast } from '../../../redux/features/toastSlice';
import { ERROR_MESSAGES } from '../../../constants/error-messages';
import { useUpsertUserDashboardLayoutMutation } from '../../../redux/api/dashboardLayoutApi';

export enum DashboardVariableType {
  DATE = 'date',
  SELECTION_STATIC = 'selectionStatic',
  SELECTION_DYNAMIC = 'selectionDynamic',
}

enum SOURCE_TYPE {
  SQL = 'sql',
  PROVIDER = 'provider',
}

export interface DashboardVariableRecord {
  id: number;
  variableName: string;
  variableType: DashboardVariableType;
  selectionStaticValues?: string;
  selectionDynamicSourceType?: SOURCE_TYPE;
  selectionDynamicProviderName?: string;
  selectionDynamicSQL?: string;
  isMultiSelect?: boolean;
  defaultValue?: string;
  defaultOperator?: string;
}

function handleDashboardData(
  data: DashboardResponse,
  setDashboardVariables: Dispatch<SetStateAction<DashboardVariableRecord[]>>,
  setQuestions: Dispatch<SetStateAction<any[]>>,
) {
  const { records, meta } = data;
  if (records && records.length > 0) {
    // Set the layout options for the dashboard body
    const dashboardData = records[0]; // Assuming we want the first dashboard

    // Set the dashboard variables
    setDashboardVariables(dashboardData.dashboardVariables || []);

    // Set the dashboard questions
    setQuestions(dashboardData.questions)

  }
}

function getQueryParams(moduleName: string, dashboardName?: string) {
  const filters: any = {
    module: {
      name: {
        $eq: moduleName
      }
    }
  };

  if (dashboardName !== undefined) {
    filters.name = { $eqi: dashboardName };
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

// Render the dashboard body only if:
// 1. There are dashboard questions
// AND
// (
// 1. There are dashboard variables and all dashboard variable filter rules have been applied i.e (all dashboard variables have been selected)
//. OR
// 2. There are no dashboard variables
// )
// 
function isRenderDashboardBody(questions: any[], dashboardVariables: DashboardVariableRecord[], filters: SqlExpression[]) {
  if (questions.length === 0) {
    return false;
  }

  if (dashboardVariables.length === 0) {
    return true;
  }

  // Check if all dashboard variables have corresponding filters applied
  const allVariablesFiltered = dashboardVariables.every(variable =>
    filters.some(filter => filter.variableName === variable.variableName)
  );

  return allVariablesFiltered;
}

type SolidDashboardViewProps = {
  moduleName: string;
  dashboardName?: string;
};

const SolidDashboard = (params: SolidDashboardViewProps) => {
  const { data, isLoading, error } = useGetDashboardQuery(getQueryParams(params.moduleName, params.dashboardName)) // FIXME : error handling should be done properly
  // Define a state called layoutOption and pass it after destructing the widgetOptions and dashboardOptions from layoutOption
  // TODO [HP]: Shouldn't the type of this state variable be something different? Why are we muddling this with layout but calling it body props? 
  // TODO [HP]: Body props should be clearly made up of Gridstack layout options, the questions that make up the body & the filter[] which is an array of SqlExpressions
  // TODO [HP]: This is fully CONFUSED
  // const [layoutOption, setLayoutOption] = useState<SolidDashboardBodyProps>({
  //   filters: [],
  //   questions: [],
  // });

  // TODO [HP]: replace dashboardVariableFilterRules with filters everywhere...
  // const [dashboardVariableFilterRules, setDashboardVariableFilterRules] = useState<ISolidDashboardVariableFilterRule[]>([]);
  const dispatch = useDispatch();

  const visibleNavbar = useSelector((state: any) => state.navbarState?.visibleNavbar);
  const [filters, setFilters] = useState<SqlExpression[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [dashboardVariables, setDashboardVariables] = useState<DashboardVariableRecord[]>([]);
  const [isDashboardFilterVisible, setIsDashboardFilterVisible] = useState(false);

  const [upsertDashboardLayout] = useUpsertUserDashboardLayoutMutation();

  const [dashboardLayout, setDashboardLayout] = useState<GridItem[]>([]);

  const updateUserDashboardLayout = async () => {
    try {
      const response = await upsertDashboardLayout({
        dashboardId: data?.records[0].id,
        layout: JSON.stringify(dashboardLayout),
      }).unwrap();
      if (response.statusCode === 200) {
        dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.LAYOUT, detail: ERROR_MESSAGES.DASHBOARD_LAYOUT_UPDATE_SUCCESSFULLY }));
      }
    } catch (error) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.LAYOUT, detail: ERROR_MESSAGES.DASHBOARD_LAYOUT_UPDATE_FAILED }));
    }
  }

  useEffect(() => {
    // Invoke the dashboard api to fetch the dashboard data
    // console.log('Dashboard Data testing:', isLoading, data, error);
    if (!isLoading && data) {
      // Assuming data contains the layout options
      handleDashboardData(data, setDashboardVariables, setQuestions);
    }
  }, [isLoading, data]);

  const toggleBothSidebars = () => {
    if (visibleNavbar) {
      dispatch(toggleNavbar());   // close both
    } else {
      dispatch(showNavbar());     // open both
    }
  };



  return (
    <div className={`h-screen surface-0 flex`}>

      <div className={`h-full flex-grow-1 ${styles.SolidDashboardPageContentWrapper}`}>
        {isLoading && <SolidDashboardLoading />}
        {error && <SolidDashboardRenderError />}
        {!isLoading && !error && data && data.records.length === 0 && (
          <SolidDashboardNotAvailable />
        )}
        {!isLoading && !error && data && data.records.length > 0 && (
          <>
            <div className="page-header" style={{ borderBottom: '1px solid var(--primary-light-color)' }}>
              <div className='flex align-items-center gap-2'>
                <div className="apps-icon block md:hidden cursor-pointer" onClick={toggleBothSidebars}>
                  <SolidIcon name="si-th-large" aria-hidden />
                </div>
                <p className={`view-title solid-text-wrapper flex align-items-center gap-1 ${styles.SolidDashboardTitle}`}>
                  {data?.records[0]?.displayName ? data?.records[0]?.displayName : data?.records[0]?.name}
                  {data?.records[0]?.description && (
                    <SolidTooltip>
                      <SolidTooltipTrigger asChild>
                        <SolidIcon name="si-info-circle" className="solid-field-tooltip-icon" aria-hidden />
                      </SolidTooltipTrigger>
                      <SolidTooltipContent side="right">{data?.records[0]?.description}</SolidTooltipContent>
                    </SolidTooltip>
                  )}
                </p>
              </div>
              {dashboardVariables && dashboardVariables.length > 0 && (
                <>
                  <div className='flex gap-2'>
                    <SolidButton
                      type="button"
                      icon={filters.length > 0 ? "si si-filter-fill" : "si si-filter"}
                      className="lg:hidden solid-icon-button"
                      size='sm'
                      variant='secondary'
                      onClick={() => setIsDashboardFilterVisible(true)}
                    />

                    <SolidButton
                      type="button"
                      icon={filters.length > 0 ? "si si-filter-fill" : "si si-filter"}
                      label={"Filter"}
                      className="hidden lg:inline-flex"
                      size='sm'
                      variant='secondary'
                      onClick={() => setIsDashboardFilterVisible(true)}
                    />
                    {filters.length > 0 && (
                      <SolidButton
                        type="button"
                        size="sm"
                        icon="si si-filter-slash"
                        severity="secondary"
                        className="solid-icon-button "
                        outlined
                        onClick={() => { setFilters([]); setIsDashboardFilterVisible(false); }}
                      />
                    )}
                    <SolidButton
                      type="button"
                      size="sm"
                      icon="si si-save"
                      severity="secondary"
                      className="solid-icon-button "
                      outlined
                      onClick={() => updateUserDashboardLayout()} />
                  </div>
                  <DashboardFilter
                    dashboardVariables={dashboardVariables}
                    initialFilters={filters}
                    onApply={setFilters}
                    visible={isDashboardFilterVisible}
                    onHide={() => setIsDashboardFilterVisible(false)}
                  />
                </>
              )}
            </div>
            {!isRenderDashboardBody(questions, dashboardVariables, filters) && <SolidDashboardFilterRequired />}
            {isRenderDashboardBody(questions, dashboardVariables, filters) && <SolidDashboardBody dashboardId={data?.records[0]?.id} questions={questions} filters={filters} dashboardLayout={dashboardLayout} setDashboardLayout={setDashboardLayout} />}
          </>
        )}
      </div>
    </div>
  );
}

export default SolidDashboard;
