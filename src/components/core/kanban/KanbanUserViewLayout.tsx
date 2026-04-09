import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import { createSolidEntityApi } from "../../../redux/api/solidEntityApi";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { showToast } from "../../../redux/features/toastSlice";
import { SolidButton, SolidCodeEditor } from "../../shad-cn-ui";

export const KanbanUserViewLayout = ({ solidKanbanViewMetaData, setLayoutDialogVisible }: any) => {
    const dispatch = useDispatch();
    const entityApi = createSolidEntityApi("userViewMetadata");
    const { useUpsertSolidEntityMutation } = entityApi;
    const [upsertUserView] = useUpsertSolidEntityMutation();

    if (!solidKanbanViewMetaData?.data?.solidView) return null;

    const solidView = solidKanbanViewMetaData.data.solidView;

    const formik = useFormik({
        initialValues: {
            layoutString: JSON.stringify(solidView.layout, null, 2),
        },
        onSubmit: async (values) => {
            const parsedLayout = JSON.parse(values.layoutString);
            try {
                if (solidView.id) {
                    const response = await upsertUserView({
                        viewMetadataId: solidView.id,
                        layout: JSON.stringify(parsedLayout),
                    }).unwrap();
                    if (response.statusCode === 200) {
                        dispatch(showToast({ severity: "success", summary: ERROR_MESSAGES.LAYOUT, detail: ERROR_MESSAGES.FORM_LAYOUT_UPDATE }));
                        setLayoutDialogVisible(false);
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error(ERROR_MESSAGES.UPDATE_FAILED, error);
            }
        },
    });

    return (
        <>
            <form onSubmit={formik.handleSubmit}>
                <SolidCodeEditor
                    value={formik.values.layoutString}
                    height="500px"
                    fontSize="10px"
                    language="json"
                    onChange={(value) => {
                        formik.setFieldValue("layoutString", value ?? "");
                    }}
                />
                <div className="pt-3 flex gap-2">
                    <SolidButton type="submit" size="sm">
                        Apply
                    </SolidButton>
                    <SolidButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setLayoutDialogVisible(false)}
                    >
                        Cancel
                    </SolidButton>
                </div>
            </form>
        </>
    );
};
