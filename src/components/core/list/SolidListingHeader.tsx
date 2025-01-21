import React, { } from "react";
import { usePathname } from 'next/navigation';
import FilterMenu from "@/components/layout/FilterMenu";
import { plural } from "pluralize";


const SolidListingHeader = () => {
  const path = usePathname();
  const getHeading = path.split('/').slice(-2, -1)[0].replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  const pathSegments = path.split('/');


  return (
    <>
      {pathSegments[pathSegments.length - 1] === "list" &&

        <div
          className="flex justify-content-between align-items-center px-5 relative lg:static"
          style={{ height: "60px", minHeight: 60, backgroundColor: '#f6f6f9' }}
        >
          <div className="flex align-items-center">
            <div className="">
              <div className='text-xl font-bold'>
                All {plural(getHeading)}
              </div>
            </div>
          </div>
          {/* <GlobalSearch /> */}
          <div className="flex align-items-center">
            <div>
              {/* <FilterMenu></FilterMenu> */}
            </div>
          </div>
          <div className="flex align-items-center">
          </div>
        </div>
      }
    </>

  );
};
export default SolidListingHeader;
