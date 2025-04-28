"use client"
// components/PopupContainer.tsx
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/types/solid-core';
import { closePopup } from '@/redux/features/popupSlice';

const SolidPopupContainer = () => {
    const { isOpen, content } = useSelector((state: RootState) => state.popup);
    const dispatch = useDispatch();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-4 min-w-[300px] relative max-w-full max-h-full overflow-auto">
                <button
                    onClick={() => dispatch(closePopup())}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
                >
                    &times;
                </button>
                {content}
            </div>
        </div>
    );
};

export default SolidPopupContainer;
