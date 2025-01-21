// store/themeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const popupSlice = createSlice({
    name: 'theme',
    initialState: {
        visibleModulePopup: false,
        visibleFieldsPopup: false,
    },
    reducers: {
        showModulePopup: (state) => {
            state.visibleModulePopup = true;
        },
        hideModulePopup: (state) => {
            state.visibleModulePopup = false;
        },
        showFieldsPopup: (state) => {
            state.visibleFieldsPopup = true;
        },
        hideFieldsPopup: (state) => {
            state.visibleFieldsPopup = false;
        },
    },
});

export const { showModulePopup, hideModulePopup, showFieldsPopup, hideFieldsPopup } = popupSlice.actions;
export default popupSlice.reducer;
