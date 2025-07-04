'use client';
import 'gridstack/dist/gridstack.min.css';
import './solid-dashboard.css';
import { GridStack, GridStackOptions, GridStackWidget } from 'gridstack';
import { useEffect, useRef } from 'react';

export interface SolidDashboardBodyProps {
  dashboardOptions?: GridStackOptions;
  widgetOptions?: GridStackWidget[];
}

const SolidDashboardBody: React.FC<SolidDashboardBodyProps> = ({ dashboardOptions, widgetOptions }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    // Initialize Gridstack on the specific ref
    const grid = GridStack.init(dashboardOptions || {}, gridRef.current);

    // Load widgets if provided
    if (widgetOptions && widgetOptions.length > 0) {
      grid.load(
        widgetOptions.map((widget) => ({
          ...widget,
          content: `${widget.content ?? 'Widget'}`,
        }))
      );
    }

    // Cleanup on unmount
    return () => {
      grid.destroy(false);
    };
  }, [dashboardOptions, widgetOptions]);

  return (
    <div className="App">
      <div className="grid-stack" ref={gridRef}></div>
    </div>
  );
};

export default SolidDashboardBody;