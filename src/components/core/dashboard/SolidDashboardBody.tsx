
import 'gridstack/dist/gridstack.min.css';
import { GridStackOptions, GridStackWidget } from 'gridstack';
import styles from './SolidDashboard.module.css'
import { SolidQuestionRenderer } from './SolidQuestionRenderer';
import { SqlExpression } from '../../../types/solid-core';
import ReactGridLayout, { useContainerWidth, Layout, LayoutItem } from "react-grid-layout";
import { useEffect, useRef, useState } from 'react';
import PrimeDataTableWrapper from './PrimeDataTableWrapper';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useLazyGetUserDashboardLayoutByDashboardIdQuery } from '../../../redux/api/dashboardLayoutApi';
import showToast from '../../../helpers/showToast';
import { ERROR_MESSAGES } from '../../../constants/error-messages';
import { Toast } from 'primereact/toast';

export interface SolidDashboardBodyProps {
  dashboardOptions?: GridStackOptions;
  widgetOptions?: GridStackWidget[];
  // Replace `any` with a proper `Question` type when available
  dashboardId: string;
  questions: any[];
  filters: SqlExpression[];
  dashboardLayout: GridItem[];
  setDashboardLayout: (dashboardLayout: GridItem[]) => void;
}

export type GridItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

// Layout is Layout[] at runtime in v2 — the type definition is misleading
type LayoutArray = LayoutItem[];


const generateDefaultLayout = (questions: any[]): GridItem[] => {
  return questions.map((q, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      i: String(q.name),
      x: col * 4,   // 0, 4, 8 in a 12-col grid
      y: row * 4,
      w: 4,
      h: 4,
    };
  });
};


const SolidDashboardBody = ({ dashboardId, questions, filters = [], dashboardLayout, setDashboardLayout }: SolidDashboardBodyProps) => {
  const toast = useRef<Toast>(null);

  const sortedQuestions = [...questions]
    .map((q, index) => ({ ...q, defaultIndex: index + 1 }))
    .sort((a, b) => (a.sequenceNumber ?? a.defaultIndex) - (b.sequenceNumber ?? b.defaultIndex));

  const { width, containerRef, mounted } = useContainerWidth();
  const isLayoutReady = useRef(false);

  const [fetchUserLayout, { data: userLayoutData, isSuccess, isLoading }] =
    useLazyGetUserDashboardLayoutByDashboardIdQuery();

  useEffect(() => {
    if (!dashboardId || questions.length === 0) return;
    const loadLayout = async () => {
      try {
        const response = await fetchUserLayout(dashboardId).unwrap();
        const raw = response?.data?.layout;
        const savedLayout = typeof raw === 'string' ? JSON.parse(raw) : raw;

        const layout = savedLayout
          ? sortedQuestions.map((q) => {
            const saved = (savedLayout as GridItem[]).find(s => s.i === String(q.name));
            return saved ?? generateDefaultLayout([q])[0];
          })
          : generateDefaultLayout(sortedQuestions);

        setDashboardLayout(layout);
        setTimeout(() => { isLayoutReady.current = true; }, 100);
      } catch (error: any) {
        if (error.status === 403) {
          showToast(toast, "error", ERROR_MESSAGES.FORBIDDEN_ERROR, ERROR_MESSAGES.FORBIDDEN_ERROR);
        } else {
          showToast(toast, "error", ERROR_MESSAGES.SOMETHING_WRONG, ERROR_MESSAGES.SOMETHING_WRONG);
        }
      }
    };

    loadLayout();
  }, [questions, dashboardId]);


  // useEffect(() => {
  //   if (questions.length === 0) return;
  //   const saved = getSavedLayout();
  //   setDashboardLayout(generateLayout(sortedQuestions, saved));
  //   // Delay the ready flag so onLayoutChange doesn't fire before we're set
  //   setTimeout(() => { isLayoutReady.current = true; }, 100);
  // }, [questions]);


  const handleLayoutChange = (newLayout: Layout) => {
    if (!isLayoutReady.current) return;

    // v2 passes LayoutItem[] at runtime despite the type saying Layout
    const layoutArray = newLayout as unknown as LayoutItem[];

    const updated: GridItem[] = layoutArray.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));

    setDashboardLayout(updated);
    // saving is handled by the parent/caller
  };

  return (
    <>
      <Toast ref={toast} />
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className={`p-4 ${styles.SolidDashboardContentWrapper}`}
        style={{ width: '100%', overflowY: 'auto', minHeight: 0 }}

      >
        {mounted && dashboardLayout.length > 0 && (
          <ReactGridLayout
            width={width}
            layout={dashboardLayout}
            gridConfig={{
              cols: 12,
              rowHeight: 120,
            }}
            dragConfig={{
              handle: ".drag-handle",
            }}
            resizeConfig={{
              enabled: true,
            }}
            onLayoutChange={handleLayoutChange}
          >
            {sortedQuestions.map((question: any) => (
              <div key={String(question.name)} className="drag-handle cursor-move rounded shadow p-2 overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                {/* <div className=" mb-2 font-bold">
                {question.name}
              </div> */}
                {question.visualisedAs === "prime-datatable" ? (
                  <PrimeDataTableWrapper question={question} filters={filters} />
                ) : (
                  <SolidQuestionRenderer question={question} filters={filters} isPreview={false} />
                )}
              </div>
            ))}
          </ReactGridLayout>
        )}
      </div>
    </>
  );
};

export default SolidDashboardBody;