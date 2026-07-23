
import React, { useRef, useState } from "react";
import { Cog, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
// import { RootState } from "../../redux/store";
import { gridView, listView } from "../../redux/features/dataViewSlice";
import { usePathname } from "../../hooks/usePathname";
import { useRouter } from "../../hooks/useRouter";
import { HeaderDynamicTitles } from "../common/HeaderDynamicTitles";
import FilterMenu from "./FilterMenu";
import { SolidIcon, parseSolidIconMeta } from "../shad-cn-ui/SolidIcon";

const ListingHeader = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();


  const visibleFieldsPopup = useSelector(
    (state: any) => state.popup.visibleFieldsPopup
  );

  const items = [
    {
      label: "Settings",
      icon: <Cog size={14} aria-hidden />,
      command: () => {
      },
    },
    {
      label: "Update",
      icon: <RefreshCcw size={14} aria-hidden />,
      command: () => {
      },
    },
    {
      label: "Delete",
      icon: <Trash2 size={14} aria-hidden />,
      command: () => {
      },
    },
  ];
  const [value, setValue] = useState(null);
  const contextMenuOptions = [
    {
      label: (
        <div id="kanban" onClick={() => dispatch(gridView())}>
          <img
            src="/images/icons/icon-kanban.svg"
            style={{ width: "18px", height: "18px" }}
          />
        </div>
      ),
      value: "kanban",
      tooltip: "Kanban",
    },
    {
      label: (
        <div id="list_view" onClick={() => dispatch(listView())}>
          <img
            src="/images/icons/icon-list.svg"
            style={{ width: "18px", height: "18px" }}
          />
        </div>
      ),
      value: "list_view",
      tooltip: "List view",
    },
    {
      label: (
        <div id="calender">
          <img
            src="/images/icons/icon-calender.svg"
            style={{ width: "18px", height: "18px" }}
          />
        </div>
      ),
      value: "calender",
      tooltip: "Calender",
    },
    {
      label: (
        <div id="activity">
          <img
            src="/images/icons/icon-activity.svg"
            style={{ width: "18px", height: "18px" }}
          />
        </div>
      ),
      value: "activity",
      tooltip: "Activity",
    },
    {
      label: (
        <div id="graph">
          <img
            src="/images/icons/icon-graph.svg"
            style={{ width: "18px", height: "18px" }}
          />
        </div>
      ),
      value: "graph",
      tooltip: "Graph",
    },
  ];

  const justifyTemplate = (option: any) => {
    if (React.isValidElement(option.icon)) {
      return option.icon;
    }
    const m = parseSolidIconMeta(option.icon);
    return m ? <SolidIcon name={m.name} spin={m.spin} /> : <i className={option.icon}></i>;
  };


  const save = () => {
    const pathName = window.location.pathname;
    const newPath = pathName.split('/').slice(0, -1).join('/') + '/create';

    router.push(newPath);



    // switch (pathParts[3]) {
    //   case "model":
    //     dispatch(showFieldsPopup());
    //     break;
    //   case "module":
    //     dispatch(showModulePopup());
    //     break;
    // }
  };



  return (
    <>
      <div
        className="flex justify-between items-center px-8 relative lg:static"
        style={{ height: "60px", minHeight: 60, backgroundColor: '#f6f6f9' }}
      >
        <div className="flex items-center">
          {/* <img src="/images/icons/icon-users.svg" />
                <span className="listHead ml-2">Employees</span> */}
          <div className="">
            {/* <SplitButton
              label="Add"
              icon={<Plus size={14} aria-hidden />}
              onClick={save}
              model={items}
              severity="info"
              className="small-splitbutton"
            /> */}
            {pathname.includes('all') &&
              <HeaderDynamicTitles />
            }
          </div>
        </div>
        {/* <GlobalSearch /> */}
        <div className="flex items-center">
          <div>
            {/* <Menu model={items} popup ref={menu} /> */}
            {pathname == "/admin/address-master/states" &&
              <FilterMenu></FilterMenu>

            }
            {/* <Button
              icon={<Cog size={14} aria-hidden />}
              className="transparent-background"
              onClick={toggleMenu}
              aria-haspopup
              aria-controls="popup_menu"
            /> */}
          </div>
        </div>
        <div className="flex items-center">
          {/* <div>
            {contextMenuOptions.map((option) => (
              <Tooltip
                key={option.value}
                target={`#${option.value}`}
                content={option.tooltip}
                className="custom-tooltip"
              />
            ))}
            <SelectButton
              value={value}
              onChange={(e) => setValue(e.value)}
              options={contextMenuOptions}
              className="custom-select-button"
            />
          </div> */}
        </div>
      </div>
      {/* <CreateModule></CreateModule> */}
    </>
  );
};
export default ListingHeader;
