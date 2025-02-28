"use client";
// import { useAppSelector } from "@/redux/hooks";
import { signOut } from "next-auth/react";
import { PrimeReactContext } from "primereact/api";
import { OverlayPanel } from "primereact/overlaypanel";
import { useContext, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LayoutContext } from "./context/layoutcontext";
import { LayoutConfig } from "@/types";
import { toggleTheme } from "@/redux/features/themeSlice";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";

const UserProfileMenu = () => {
  const router = useRouter();

  // const { user } = useAppSelector((state) => state.auth);
  const { changeTheme } = useContext(PrimeReactContext);
  const { layoutConfig, setLayoutConfig } = useContext(LayoutContext);
  const { theme } = useSelector((state: any) => state.theme); // Get current theme from Redux
  const { user } = useSelector((state: any) => state.auth);
  const [checked, setChecked] = useState(theme === "dark");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const dispatch = useDispatch();
  const op = useRef(null);
  const logoutHandler = () => {
    signOut();
  };
  const _changeTheme = (theme: string, colorScheme: string) => {
    changeTheme?.(layoutConfig.theme, theme, 'theme-css', () => {
      setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, theme, colorScheme }));
    });
  };

  const handleThemeToggle = (e: any) => {
    const isDarkMode = e.value;
    setChecked(isDarkMode);
    dispatch(toggleTheme()); // Dispatch Redux action
    _changeTheme(isDarkMode ? "solid-dark-purple" : "solid-light-purple", isDarkMode ? "dark" : "light");
  };
  return (
    <div className="userProfile">
      <div
        className="">
        <div
          className="flex align-items-end"
          //@ts-ignore
          onClick={(e: any) => op?.current?.toggle(e)}
        >
          <img
            src={`/images/Profile/Avatar.png`}
            alt="Solid"
            className="profile-icon"
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 5.83301L3.5 9.33301H10.5L7 5.83301Z" fill="black" />
          </svg>
        </div>
        <OverlayPanel ref={op} className="user-profile-panel">
          <div className="flex align-items-center p-3 gap-2 user-profile-title">
            <img
              alt="avatar"
              src={`/images/Profile/Avatar.png`}
              className="w-2rem"
            ></img>
            <div className="flex flex-column align">
              <span className="font-bold">{user?.user?.username}</span>
              <span className="mt-1">{user?.user?.email}</span>
            </div>
          </div>

          {/*  */}
          <div className="p-3 flex align-items-center justify-content-between primary-border-bottom">
            <div className="flex align-items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 18C6.5 18 4.375 17.125 2.625 15.375C0.875 13.625 0 11.5 0 9C0 6.5 0.875 4.375 2.625 2.625C4.375 0.875 6.5 0 9 0C9.23333 0 9.4625 0.00833333 9.6875 0.025C9.9125 0.0416667 10.1333 0.0666667 10.35 0.1C9.66667 0.583333 9.12083 1.2125 8.7125 1.9875C8.30417 2.7625 8.1 3.6 8.1 4.5C8.1 6 8.625 7.275 9.675 8.325C10.725 9.375 12 9.9 13.5 9.9C14.4167 9.9 15.2583 9.69583 16.025 9.2875C16.7917 8.87917 17.4167 8.33333 17.9 7.65C17.9333 7.86667 17.9583 8.0875 17.975 8.3125C17.9917 8.5375 18 8.76667 18 9C18 11.5 17.125 13.625 15.375 15.375C13.625 17.125 11.5 18 9 18ZM9 16C10.4667 16 11.7833 15.5958 12.95 14.7875C14.1167 13.9792 14.9667 12.925 15.5 11.625C15.1667 11.7083 14.8333 11.775 14.5 11.825C14.1667 11.875 13.8333 11.9 13.5 11.9C11.45 11.9 9.70417 11.1792 8.2625 9.7375C6.82083 8.29583 6.1 6.55 6.1 4.5C6.1 4.16667 6.125 3.83333 6.175 3.5C6.225 3.16667 6.29167 2.83333 6.375 2.5C5.075 3.03333 4.02083 3.88333 3.2125 5.05C2.40417 6.21667 2 7.53333 2 9C2 10.9333 2.68333 12.5833 4.05 13.95C5.41667 15.3167 7.06667 16 9 16Z" fill="#1D6CBC" />
              </svg>
              <p className="m-0 font-bold">Dark Mode</p>
            </div>
            <InputSwitch checked={checked} onChange={handleThemeToggle} />
          </div>
          <div className="user-profile-body p-3">
            <Button
              text
              severity="secondary"
              className="flex align-items-center gap-2"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3.75 15.75C3.3375 15.75 2.98438 15.6031 2.69063 15.3094C2.39687 15.0156 2.25 14.6625 2.25 14.25V3.75C2.25 3.3375 2.39687 2.98438 2.69063 2.69063C2.98438 2.39687 3.3375 2.25 3.75 2.25H9V3.75H3.75V14.25H9V15.75H3.75ZM12 12.75L10.9688 11.6625L12.8813 9.75H6.75V8.25H12.8813L10.9688 6.3375L12 5.25L15.75 9L12 12.75Z" fill="#F04A4A" />
                </svg>
              }
              onClick={() => setConfirmLogout(true)}
              label="Logout"
            />
          </div>
        </OverlayPanel>
      </div>
      <Dialog header="Logout" headerClassName="py-2" contentClassName="px-0 pb-0" visible={confirmLogout} style={{ width: '20vw' }} onHide={() => { if (!confirmLogout) return; setConfirmLogout(false); }}>
        <Divider className="m-0" />
        <div className="p-4">
          <p className="m-0 solid-primary-title" style={{ fontSize: 16 }}>
            Are you sure you want to log out?
          </p>
          <div className="flex align-items-center gap-2 mt-3">
            <Button label="Logout" size="small" onClick={e => logoutHandler()} />
            <Button label="Cancel" size="small" onClick={() => setConfirmLogout(false)} outlined />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default UserProfileMenu;
