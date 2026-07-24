import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../types/solid-core";
import { closePopup, PopupButton } from "../../redux/features/popupSlice";
import { getExtensionComponent, getExtensionFunction } from "../../helpers/registry";
import { SolidButton, SolidDialog, SolidDialogBody, SolidDialogClose, SolidDialogFooter, SolidDialogHeader, SolidDialogSeparator, SolidDialogTitle } from "../shad-cn-ui";

const SolidPopupContainer = () => {
  const { isOpen, event } = useSelector((state: RootState) => state.popup);
  const dispatch = useDispatch();

  const handleClose = () => dispatch(closePopup());
  const isClosable = Boolean(event?.closable);

  if (!isOpen) return null;

  const DynamicComponent = getExtensionComponent(event?.action);
  const popupWidth = event?.popupWidth ? event.popupWidth : "50vw";
  const popupBody = event?.body ?? event?.message;

  const handleButtonClick = async (button: PopupButton) => {
    if (typeof button.action === "function") {
      await button.action(event, handleClose);
    } else if (typeof button.action === "string") {
      const actionFn = getExtensionFunction(button.action);
      await actionFn?.({ ...event, button, closePopup: handleClose });
    }

    if (button.closeOnClick !== false) {
      handleClose();
    }
  };

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
      {DynamicComponent ? (
        <DynamicComponent {...event} />
      ) : (
        <>
          {event?.title ? (
            <>
              <SolidDialogHeader>
                <SolidDialogTitle>{event.title}</SolidDialogTitle>
                {isClosable ? <SolidDialogClose /> : null}
              </SolidDialogHeader>
              <SolidDialogSeparator />
            </>
          ) : null}
          {popupBody ? <SolidDialogBody>{popupBody}</SolidDialogBody> : null}
          {event?.buttons?.length ? (
            <SolidDialogFooter>
              {event.buttons.map((button: PopupButton, index: number) => (
                <SolidButton
                  key={`${button.label}-${index}`}
                  type="button"
                  size="sm"
                  variant={button.variant as any}
                  className={button.className}
                  icon={button.icon}
                  onClick={() => handleButtonClick(button)}
                >
                  {button.label}
                </SolidButton>
              ))}
            </SolidDialogFooter>
          ) : null}
        </>
      )}
    </SolidDialog>
  );
};

export default SolidPopupContainer;
