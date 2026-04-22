import {
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogHeader,
} from "../../../../../../shad-cn-ui/SolidDialog";
import { camelCase } from "lodash";
import SolidFormView from "../../../../../../../components/core/form/SolidFormView";

export const InlineRelationEntityDialog = ({ visible, setVisible, fieldContext, onCreate }: any) => {
  const fieldLayoutInfo = fieldContext.field;

  const params = {
    moduleName: fieldContext.fieldMetadata.relationModelModuleName,
    id: "new",
    embeded: true,
    customLayout: fieldLayoutInfo?.attrs?.inlineCreateLayout,
    customCreateHandler: (values: any) => {
      setVisible(false);
      onCreate(values);
    },
    inlineCreateAutoSave: fieldLayoutInfo?.attrs?.inlineCreateAutoSave,
    handlePopupClose: () => setVisible(false),
    modelName: camelCase(fieldContext.fieldMetadata.relationCoModelSingularName)
  };

  const dialogWidth = fieldLayoutInfo?.attrs?.inlineCreateLayout?.attrs?.width ?? "60vw";
  const dialogHeight = fieldLayoutInfo?.attrs?.inlineCreateLayout?.attrs?.height ?? "auto";

  return (
    <SolidDialog
      open={visible}
      onOpenChange={setVisible}
      className="solid-dialog"
      style={{ width: dialogWidth, height: dialogHeight }}
    >
      <SolidDialogHeader>
        <SolidDialogClose aria-label="Close dialog" />
      </SolidDialogHeader>
      <SolidDialogBody>
        <SolidFormView {...params} />
      </SolidDialogBody>
    </SolidDialog>
  );
};
