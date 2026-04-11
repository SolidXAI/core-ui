import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../types/solid-core";
import { closePopup } from "../../redux/features/popupSlice";
import { getExtensionComponent } from "../../helpers/registry";
import { SolidDialog } from "../shad-cn-ui";

const SolidPopupContainer = () => {
  const { isOpen, event } = useSelector((state: RootState) => state.popup);
  const dispatch = useDispatch();

  const handleClose = () => dispatch(closePopup());
  const isClosable = Boolean(event?.closable);

  if (!isOpen) return null;

  const DynamicComponent = getExtensionComponent(event?.action);
  const popupWidth = event?.popupWidth ? event.popupWidth : "50vw";

  return (
    <SolidDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isClosable) handleClose();
      }}
      dismissible={isClosable}
      showHeader={false}
      className="solid-popup-dialog solid-common-dialog"
      overlayClassName="solid-popup-backdrop"
      style={{ width: popupWidth }}
    >
      {DynamicComponent && <DynamicComponent {...event} />}
    </SolidDialog>
  );
};

export default SolidPopupContainer;
