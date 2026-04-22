import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const LS_KEY = "solidx.studio.mode";
const LS_VIEW_KEY = "solidx.studio.view";

export type StudioView = "backend" | "frontend" | null;

function readFromLS(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === "true";
  } catch {
    return false;
  }
}

function readViewFromLS(): StudioView {
  try {
    const val = localStorage.getItem(LS_VIEW_KEY);
    if (val === "backend" || val === "frontend") return val;
    return null;
  } catch {
    return null;
  }
}

function writeToLS(value: boolean) {
  try {
    if (value) {
      localStorage.setItem(LS_KEY, "true");
    } else {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_VIEW_KEY);
    }
  } catch { /* ignore */ }
}

function writeViewToLS(view: StudioView) {
  try {
    if (view) {
      localStorage.setItem(LS_VIEW_KEY, view);
    } else {
      localStorage.removeItem(LS_VIEW_KEY);
    }
  } catch { /* ignore */ }
}

export interface SolidStudioState {
  isStudioMode: boolean;
  studioView: StudioView;
}

const initialState: SolidStudioState = {
  isStudioMode: readFromLS(),
  studioView: readViewFromLS(),
};

const solidStudioSlice = createSlice({
  name: "solidStudio",
  initialState,
  reducers: {
    enterStudioMode: (state) => {
      state.isStudioMode = true;
      writeToLS(true);
    },
    exitStudioMode: (state) => {
      state.isStudioMode = false;
      state.studioView = null;
      writeToLS(false);
    },
    setStudioView: (state, action: PayloadAction<StudioView>) => {
      state.studioView = action.payload;
      writeViewToLS(action.payload);
    },
  },
});

export const { enterStudioMode, exitStudioMode, setStudioView } = solidStudioSlice.actions;
export default solidStudioSlice.reducer;
