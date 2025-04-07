"use client";
import { useFormik } from "formik";
import { Button } from "primereact/button";
import { useSelector } from "react-redux";
import React, { useRef } from "react";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { Toast } from "primereact/toast";

export const SolidFormUserViewLayout = ({ solidFormViewMetaData, setLayoutDialogVisible }: any) => {
    const toast = useRef<Toast>(null);
    const { user } = useSelector((state: any) => state.auth);
    const entityApi = createSolidEntityApi("userViewMetadata");
    const { useUpsertSolidEntityMutation } = entityApi;
    const [upsertUserView] = useUpsertSolidEntityMutation();

    if (!solidFormViewMetaData?.data?.solidView) return null;

    const solidView = solidFormViewMetaData.data.solidView;

    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const formik = useFormik({
        initialValues: {
            layoutString: JSON.stringify(solidView.layout, null, 2),
        },
        onSubmit: async (values) => {
            const parsedLayout = JSON.parse(values.layoutString);
            console.log("updatedLayout", parsedLayout);

            try {
                if (solidView.id) {
                    const response = await upsertUserView({
                        userId: user?.user?.id,
                        viewMetadataId: solidView.id,
                        layout: JSON.stringify(parsedLayout)
                    }).unwrap();
                    console.log("Response", response);
                    if (response.statusCode === 200) {
                        showToast("success", "Layout", "Form Layout Updated successfully!");
                        setLayoutDialogVisible(false);
                    }
                }
            } catch (error) {
                console.error("Update failed:", error);
            }
        },
    });

    return (
        <>
            <Toast ref={toast} />
            <form onSubmit={formik.handleSubmit}>
                <CodeMirror
                    value={formik.values.layoutString}
                    height="500px"
                    theme={oneDark}
                    style={{ fontSize: '10px' }}
                    extensions={[javascript(), EditorView.lineWrapping]}
                    onChange={(value) => {
                        formik.setFieldValue("layoutString", value);
                    }}
                />
                <div className="pt-3 flex gap-2">
                    <Button type="submit" label="Apply" size="small" />
                    <Button
                        type="button"
                        outlined
                        label="Cancel"
                        size="small"
                        onClick={() => setLayoutDialogVisible(false)}
                    />
                </div>
            </form>
        </>
    );
};
