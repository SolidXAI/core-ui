import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../types/solid-core";
import { closePopup } from "../../redux/features/popupSlice";
import { getExtensionComponent } from "../../helpers/registry";

const SolidPopupContainer = () => {
  const { isOpen, event } = useSelector((state: RootState) => state.popup);
  const dispatch = useDispatch();

  const handleClose = () => dispatch(closePopup());
  const isClosable = Boolean(event?.closable);

  useEffect(() => {
    if (!isOpen || !isClosable) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isClosable]);

  if (!isOpen) return null;

  const DynamicComponent = getExtensionComponent(event?.action);
  const popupWidth = event?.popupWidth ? event.popupWidth : "50vw";

  return (
    <div
      className="solid-popup-backdrop"
      role="presentation"
      onClick={isClosable ? handleClose : undefined}
    >
      <div
        className="solid-common-dialog solid-popup-surface"
        role="dialog"
        aria-modal="true"
        aria-label="Popup"
        style={{ width: popupWidth }}
        onClick={(event) => event.stopPropagation()}
      >
        {DynamicComponent && <DynamicComponent {...event} />}
      </div>
    </div>
  );
};

export default SolidPopupContainer;
