"use client";
// import { useAppSelector } from "@/redux/hooks";
import { signOut } from "next-auth/react";
import { OverlayPanel } from "primereact/overlaypanel";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";

const UserProfileMenu = () => {
  // const { user } = useAppSelector((state) => state.auth);
  const [checked, setChecked] = useState(false);
  const dispatch = useDispatch();
  const op = useRef(null);
  const logoutHandler = () => {
    signOut();
  };


  return (
    <div className="userProfile">
      <div className="card flex justify-content-center">
        <img
          style={{ cursor: "pointer",width:'30px' }}
          src={`/images/profile.png`}
          alt="Solid"
          //@ts-ignore
          onClick={(e:any) => op?.current?.toggle(e)}
        />
        <OverlayPanel ref={op} className="user-profile-panel">
          {/* <div className="user-profile-menu">
            <div className="row align-items-center">
              <div className="col-4"></div>
              <div className="col-8">
                <p>User Name</p>
                <p>Email</p>
              </div>
            </div>
            <div className="row align-items-center">
              <div className="col-4">
                <img
                  style={{ cursor: "pointer" }}
                  src={`/images/dark-mode.png`}
                  alt="Solid"
                />
              </div>
              <div className="col-8">
                <p>Dark Mode</p>
              </div>
            </div>
            <a onClick={() => signOut()}>Logout</a>
          </div> */}
          <div
            className="w-full md:w-15rem p-menu p-component"
            data-pc-name="menu"
            data-pc-section="root"
          >
            <ul
              className="p-menu-list p-reset"
              id="pr_id_11_list"
              role="menu"
              data-pc-section="menu"
            >
              <li
                className="p-menuitem"
                role="menuitem"
                data-pc-section="menuitem"
                data-p-focused="false"
                data-p-disabled="false"
              >
                <button className="p-menuitem-link w-full p-link flex align-items-center  p-2 pl-4 text-color hover:surface-200 border-noround">
                  <div
                    className="mr-2 p-avatar p-component p-avatar-image p-avatar-circle"
                    data-pc-name="avatar"
                    data-pc-section="root"
                  >
                    <img
                      alt="avatar"
                      src={`/images/profile.png`}
                      data-pc-section="image"
                      style={{maxWidth:'30px'}}
                    ></img>
                  </div>
                  <div className="flex flex-column align">
                    <span className="font-bold">User Name</span>
                    {/* <span className="text-sm">{user?.username}</span> */}
                  </div>
                </button>
              </li>

              {/* <li
                id="pr_id_11_separator_1"
                className="p-menu-separator"
                role="separator"
                data-pc-section="separator"
              ></li>
              <li
                id="pr_id_11_5"
                className="p-menuitem"
                role="menuitem"
                data-pc-section="menuitem"
                data-p-focused="false"
                data-p-disabled="false"
              >
                <div className="p-menuitem-link w-full p-link flex align-items-center justify-content-between p-2 pl-4 text-color hover:surface-200 border-noround">
                  <div>
                    <span className="pi pi-moon"></span>
                    <span className="font-bold mx-2">Dark Mode</span>
                  </div>
                  <div className="flex flex-column align">
                    <InputSwitch
                      checked={checked}
                      onChange={(e) => {
                        setChecked(e.value);
                        dispatch(toggleTheme());
                      }}
                    />
                  </div>
                </div>
              </li>

              <li
                className="p-menu-separator"
                role="separator"
                data-pc-section="separator"
              ></li>
              <li
                role="none"
                className="p-submenu-header"
                data-pc-section="submenuheader"
              >
                Teams
              </li>

              <li
                id="pr_id_11_5"
                className="p-menuitem"
                role="menuitem"
                data-pc-section="menuitem"
                data-p-focused="false"
                data-p-disabled="false"
              >
                <div className="p-menuitem-link w-full p-link flex align-items-center justify-content-between p-2 pl-4 text-color hover:surface-200 border-noround">
                  <div>
                    <span className="pi pi-moon"></span>
                    <span className="mx-2">Design</span>
                  </div>
                </div>
              </li>
              <li
                role="none"
                className="p-submenu-header"
                data-pc-section="submenuheader"
              >
                Settings
              </li>
              <li
                id="pr_id_11_5"
                className="p-menuitem"
                role="menuitem"
                data-pc-section="menuitem"
                data-p-focused="false"
                data-p-disabled="false"
              >
                <div className="p-menuitem-link w-full p-link flex align-items-center justify-content-between p-2 pl-4 text-color hover:surface-200 border-noround">
                  <div>
                    <span className="pi pi-cog"></span>
                    <span className="mx-2">General Settings</span>
                  </div>
                </div>
              </li>
              <li
                id="pr_id_11_5"
                className="p-menuitem"
                role="menuitem"
                data-pc-section="menuitem"
                data-p-focused="false"
                data-p-disabled="false"
              >
                <div className="p-menuitem-link w-full p-link flex align-items-center justify-content-between p-2 pl-4 text-color hover:surface-200 border-noround">
                  <div>
                    <span className="pi pi-question-circle"></span>
                    <span className="mx-2">Support</span>
                  </div>
                </div>
              </li> */}

              <li
                className="p-menu-separator"
                role="separator"
                data-pc-section="separator"
              ></li>
              <li
                id="pr_id_11_sub_3_2"
                className="p-menuitem"
                role="menuitem"
                aria-label="Logout"
                data-p-focused="false"
                data-p-disabled="false"
                data-pc-section="menuitem"
              >
                <div className="p-menuitem-content">
                  <a className="flex align-items-center p-menuitem-link" onClick={e=> logoutHandler()}>
                    <span className="pi pi-sign-out"></span>
                    <span className="mx-2">Logout</span>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </OverlayPanel>
      </div>
    </div>
  );
};

export default UserProfileMenu;
