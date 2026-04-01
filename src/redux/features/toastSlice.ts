import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastMessage {
    severity: ToastSeverity;
    summary: string;
    detail?: string;
    life?: number;
}

export interface ToastState {
    message: ToastMessage | null;
}

const initialState: ToastState = {
    message: null,
};

const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        showToast: (state, action: PayloadAction<ToastMessage>) => {
            state.message = action.payload;
        },
        clearToast: (state) => {
            state.message = null;
        },
    },
});

export const { showToast, clearToast } = toastSlice.actions;
export default toastSlice.reducer;
