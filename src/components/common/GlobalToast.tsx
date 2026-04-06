import { Toast } from 'primereact/toast';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearToast } from '../../redux/features/toastSlice';

export const GlobalToast = () => {
    const toastRef = useRef<Toast>(null);
    const dispatch = useDispatch();
    const message = useSelector((state: any) => state.toast.message);

    useEffect(() => {
        if (message && toastRef.current) {
            toastRef.current.show({
                severity: message.severity,
                summary: message.summary,
                detail: message.detail,
                sticky: message.sticky,
                life: message.sticky ? undefined : (message.life ?? 3000),
            });
            dispatch(clearToast());
        }
    }, [message]);

    return <Toast ref={toastRef} />;
};
