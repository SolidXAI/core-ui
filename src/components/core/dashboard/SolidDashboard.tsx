"use client";
import SolidDashboardBody from './SolidDashboardBody';

const SolidDashboard = () => {

  return (
    <div>
      {/* <SolidDashboardHeader /> */}
      <SolidDashboardBody
        widgetOptions={[
          { x: 0, y: 0, w: 4, h: 2, content: 'Item 1' },
          { x: 4, y: 0, w: 4, h: 2, content: 'Item 2' },
          { x: 8, y: 0, w: 4, h: 2, content: 'Item 3' },
        ]}
      />
    </div>
  );
}
export default SolidDashboard;