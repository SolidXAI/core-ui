"use client"
// components/PopupContainer.tsx
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/types/solid-core';
import { closePopup } from '@/redux/features/popupSlice';
import { Dialog } from 'primereact/dialog';
import { get } from 'lodash';
import { getExtensionComponent } from '@/helpers/registry';


const SolidPopupContainer = () => {
    const { isOpen, event } = useSelector((state: RootState) => state.popup);
    const dispatch = useDispatch();

    if (!isOpen) return null;

    const DynamicComponent = getExtensionComponent(event?.action);

    return (
        <Dialog
            visible={isOpen}
            onHide={() => dispatch(closePopup())}
            style={{ width: '50vw' }}
            modal
        >
            {DynamicComponent && <DynamicComponent {...event} />}
        </Dialog>
    );
};

export default SolidPopupContainer;
