'use client';
import 'gridstack/dist/gridstack.min.css';
import { GridStackOptions, GridStackWidget } from 'gridstack';
import styles from './SolidDashboard.module.css'
import { SolidQuestionRenderer } from './SolidQuestionRenderer';

export interface SolidDashboardBodyProps {
  dashboardOptions?: GridStackOptions;
  widgetOptions?: GridStackWidget[];
}

const SolidDashboardBody = ({ questions }: any) => {
  // const gridRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (!gridRef.current) return;

  //   // Initialize Gridstack on the specific ref
  //   const grid = GridStack.init(dashboardOptions || {}, gridRef.current);

  //   // Load widgets if provided
  //   if (widgetOptions && widgetOptions.length > 0) {
  //     grid.load(
  //       widgetOptions.map((widget) => ({
  //         ...widget,
  //         content: `${widget.content ?? 'Widget'}`,
  //       }))
  //     );
  //   }

  //   // Cleanup on unmount
  //   return () => {
  //     grid.destroy(false);
  //   };
  // }, [dashboardOptions, widgetOptions]);

  return (
    <div className={`h-full p-4 overflow-y-auto ${styles.SolidDashboardContentWrapper}`}>
      {/* <div className="grid-stack" ref={gridRef}></div> */}
      <div className='grid'>
        {questions.map((question: any) => {
          return (
            <div className='col-4 p-3'>
              <SolidQuestionRenderer question={question} key={question.id} />
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default SolidDashboardBody;