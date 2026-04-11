import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../types/solid-core";
import { clearToast, ToastMessage } from "../../redux/features/toastSlice";
import { SolidToast } from "../shad-cn-ui";

type QueueToast = ToastMessage & {
  id: number;
};

let toastId = 0;

export const SolidToastProvider = () => {
  const dispatch = useDispatch();
  const message = useSelector((state: RootState) => state.toast.message);
  const [queue, setQueue] = useState<QueueToast[]>([]);

  useEffect(() => {
    if (!message) return;

    toastId += 1;
    setQueue((current) => [...current, { id: toastId, ...message }]);
    dispatch(clearToast());
  }, [dispatch, message]);

  const handleClose = (id: number) => {
    setQueue((current) => current.filter((toast) => toast.id !== id));
  };

  if (!queue.length) return null;

  return (
    <div className="solid-toast-viewport" aria-live="polite" aria-atomic="true">
      {queue.map((toast) => (
        <SolidToast key={toast.id} {...toast} onClose={handleClose} />
      ))}
    </div>
  );
};
