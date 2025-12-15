import { useApplySolidAiInteractionMutation } from '@/redux/api/aiInteractionApi';
import { useCodeGenerationPostProcessMutation } from "@/redux/api/solidServiceApi";
import { closePopup } from "@/redux/features/popupSlice";
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror'; // Correct import
import { Button } from 'primereact/button';
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { SolidCircularLoader } from "../common/SolidLoaders/SolidCircularLoader";
import { AiInteraction } from '@/types/solid-core';
import styles from './SolidXAI.module.css';
import { ERROR_MESSAGES } from '@/constants/error-messages';


export interface SolidXAiJsonDisplayProps {
    interaction: AiInteraction
}



// --- Subcomponents
const SolidXSchemaDisplay = ({ schema }: { schema: any }) => (
    <div>
        <CodeMirror
            value={JSON.stringify(schema, null, 2)}
            style={{ fontSize: "10px" }}
            theme={oneDark}
            readOnly={true}
            extensions={[javascript(), EditorView.lineWrapping]}
        />
    </div>
);

const SolidXSchemaPatchDisplay = ({
    schemaPatch,
}: {
    schemaPatch: any;
}) => (
    <div>
        <CodeMirror
            value={JSON.stringify(schemaPatch, null, 2)}
            style={{ fontSize: "10px" }}
            theme={oneDark}
            readOnly={true}
            extensions={[javascript(), EditorView.lineWrapping]}
        />
    </div>
);

const SolidXPlanDisplay = ({ plan }: any) => {
    return (
        <div>
            {/* Plan Steps */}
            <div className="space-y-3">
                {plan.map((step: any, idx: any) => (
                    <div key={idx} className="p-3 border rounded-lg shadow-sm bg-white">
                        <p className="text-lg mb-1 font-semibold">
                            Step {idx + 1}: {step.type}
                        </p>
                        {step.rationale && <p className="text-gray-500 mb-2">{step.rationale}</p>}

                        {step.content && (
                            <div className="border rounded p-2 bg-gray-100">
                                <CodeMirror
                                    value={step.content}
                                    style={{ fontSize: "10px" }}
                                    theme={oneDark}
                                    readOnly
                                    extensions={[javascript(), EditorView.lineWrapping]}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


// SolidXConcernDisplay
export const SolidXAiJsonDisplay: React.FC<SolidXAiJsonDisplayProps> = ({ interaction }) => {
    console.log("Rendering JSON display for interaction:", interaction);

    let aiResponseTitle = '';
    if (interaction.metadata) {
        const metadata: any = interaction.metadata;
        const relevantConcerns = metadata.relevantConcerns
        let relevantConcern = "";
        if (relevantConcerns.length > 0) {
            relevantConcern = relevantConcerns[0]
        }
        switch (relevantConcern) {
            case 'create_module':
                aiResponseTitle = 'Module metadata available, you can review and apply, or if you want to modify click on the "Edit" button.';
                break;

            case 'create_model_with_fields':
                aiResponseTitle = 'Model Created';
                break;

            case 'add_field':
                aiResponseTitle = 'Field Added';
                break;

            case 'create_dashboard':
                aiResponseTitle = 'Dashboard Created';
                break;

            case 'create_dashboard_widget':
                aiResponseTitle = 'Chart Created';
                break;

            case 'create_model_layout':
                aiResponseTitle = 'Layout Created';
                break;

            default:
                break;
        }
    }

    const dispatch = useDispatch();
    const toast = useRef<Toast>(null);
    const [editAndApplyDialog, setEditAndApplyDialog] = useState(false);
    const [editedFormattedJson, setEditedFormattedJson] = useState<string>('{}');

    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            ...(severity === "error"
            ? { sticky: true }            // stays until user closes
            : { life: 3000 }),
        });
    };

    const [applyInteraction, {
        isLoading: isApplyInteractionLoading,
        isSuccess: isApplyInteractionSuccess,
        isError: isApplyInteractionError,
        error: applyInteractionError,
        data: applyInteractionData
    }] = useApplySolidAiInteractionMutation();

    const handlePreview = () => {
        console.log(ERROR_MESSAGES.PREVIEW_INTERACTION, interaction.id)
        setEditAndApplyDialog(true)
    }

    const handleApply = async () => {
        try {
            const response = await applyInteraction({ id: interaction.id }).unwrap()
            setIsGenerating(true);
            console.log(ERROR_MESSAGES.APPLY_SUCCESS, response)
        } catch (err: any) {
            showToast("error", ERROR_MESSAGES.APPLY_FAILED, ERROR_MESSAGES.FAILED_APPLY_INTERACTION(err?.data?.error));
            console.error(ERROR_MESSAGES.FAILED_APPLY_INTERACTION(''), err)
        }
    }

    const handleEditedApply = async () => {
        try {
            const response = await applyInteraction({ id: interaction.id }).unwrap()
            setIsGenerating(true);
            console.log(ERROR_MESSAGES.APPLY_SUCCESS, response)
        } catch (err) {
            console.error(ERROR_MESSAGES.FAILED_APPLY_INTERACTION(''), err)
        }
    }

    // TODO: START REFACTORING - reusable code alert
    // TODO: This method can be refactored out into a separate file... 
    // TODO: The if condition below isGenerating in the JSX part can also be refactored out... 

    const [triggerCodeGenerationPostProcess, {
        data: codeGenerationPostProcessData,
        isLoading: isCodeGenerationPostProcessLoading,
        isSuccess: isCodeGenerationPostProcessSuccess,
        isError: isCodeGenerationPostProcessError
    }] = useCodeGenerationPostProcessMutation();

    // Utitlity to track if solid-api is up
    const [isPinging, setIsPinging] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const pingBackendWithRetry = async (retries = 30, delay = 500): Promise<boolean> => {
        for (let i = 0; i < retries; i++) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/ping`);
                console.log("ping response", res);

                if (res.ok)
                    return true;
            } catch (e) {
                // ignore and retry
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        return false;
    };

    useEffect(() => {
        // Async interaction success handler
        const interactionSuccessHandler = async () => {
            if (!isApplyInteractionSuccess) return;

            // Async function to ping backend and then run post-process
            const runPostProcessIfBackendAlive = async (postProcessFlags: { "runModuleMetadataSeeder": boolean, "runSolidIngestion": boolean }) => {
                setIsPinging(true);

                const isAlive = await pingBackendWithRetry(30, 500);

                setIsPinging(false);

                if (isAlive) {
                    await triggerCodeGenerationPostProcess(postProcessFlags);
                } else {
                    dispatch(closePopup());
                    console.log("Backend is not alive, cannot run seeder");
                    // showToast("error", "Backend Unavailable", "Seeder not triggered. Could not reach backend.");
                }
            };

            // Determine flags based on interaction response
            const interactionResponseFlags: { seedingRequired: boolean, serverRebooting: boolean } = applyInteractionData?.data
            const postProcessFlags: { "runModuleMetadataSeeder": boolean, "runSolidIngestion": boolean } = {
                "runModuleMetadataSeeder": interactionResponseFlags?.seedingRequired || false,
                "runSolidIngestion": false
            };

            // If server reboot is not required, run post-process immediately
            if (!interactionResponseFlags?.serverRebooting) {
                // console.log("Running post-process immediately", postProcessFlags);
                await triggerCodeGenerationPostProcess(postProcessFlags)
            } else {
                setTimeout(() => {
                    // console.log("Running post-process after delay", postProcessFlags);
                    runPostProcessIfBackendAlive(postProcessFlags);
                }, 5000);
            }
        };
        interactionSuccessHandler();
    }, [isApplyInteractionSuccess]);

    useEffect(() => {
        if (isCodeGenerationPostProcessSuccess) {
            console.log("isSeederSuccess", isCodeGenerationPostProcessSuccess);
            // showToast("success", "Code Generated Successfully", "Code Generated Successfully");
            setIsGenerating(false);
            dispatch(closePopup());
            window.location.reload();
        }
        if (isCodeGenerationPostProcessError) {
            console.log("isSeederError", isCodeGenerationPostProcessError);
            // showToast("error", "Seeder Error", "Could not run seeder. Please try again.");
            setIsGenerating(false);
        }
    }, [isCodeGenerationPostProcessSuccess, isCodeGenerationPostProcessError]);
    // TODO: END REFACTORING - reusable code alert

    let formattedGeneratedStatus = '';
    let parsed: any = {}
    try {
        parsed = JSON.parse(interaction.message)
        formattedGeneratedStatus = parsed.generation_status;

    } catch (e) {

    }

    const renderDataComponent = () => {
        if (!parsed?.data) return <p>No data found</p>;

        const safeRender = (data: any, Component: any, label: string) => {
            try {
                // Validate JSON serializability
                JSON.stringify(data);
                return <Component {...{ [label]: data }} />;
            } catch (e) {
                return (
                    <div className="p-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded">
                        Invalid JSON structure in {label}
                    </div>
                );
            }
        };

        if (parsed?.data?.schemaPatch)
            return safeRender(parsed.data.schemaPatch, SolidXSchemaPatchDisplay, 'schemaPatch');
        if (parsed?.data?.plan)
            return <SolidXPlanDisplay plan={parsed.data.plan} />;
        if (parsed?.data?.schema)
            return safeRender(parsed.data.schema, SolidXSchemaDisplay, 'schema');

        return <p>Unrecognized data structure</p>;
    };


    const renderDataForCodeMirror = () => {
        if (!parsed?.data) return '';

        const safeStringify = (data: any): string => {
            try {
                return JSON.stringify(data, null, 2);
            } catch (e) {
                return 'Invalid JSON';
            }
        };

        if (parsed?.data?.schemaPatch)
            return safeStringify(parsed.data.schemaPatch);
        if (parsed?.data?.plan)
            return safeStringify(parsed.data.plan);
        if (parsed?.data?.schema)
            return safeStringify(parsed.data.schema);

        return 'Unrecognized data structure';
    };



    return (
        <>
            <Toast ref={toast} className="custom-toast" />

            {isGenerating ?
                <>
                    <Dialog header={false} closable={false} draggable={false} visible={true} onHide={() => { }} style={{ width: '20vw' }}>
                        <div className="flex flex-column align-items-center justify-content-center py-5">
                            <SolidCircularLoader />
                            <p className="mt-4 font-medium">Generating...</p>
                        </div>
                    </Dialog>
                </>
                :
                <>
                    {formattedGeneratedStatus === "success" &&
                        <div>
                            { }
                            <div className={`p-3 mb-3 ${styles.SolidXAIResponse}`}>
                                <p>{parsed?.instructions}</p>
                            </div>
                            <div className="border-round-lg overflow-hidden">
                                <div className="border-round-lg overflow-hidden">{renderDataComponent()}</div>
                            </div>
                            {interaction?.is_applied ?
                                <div className="mt-3 font-medium solid-primary-black-text">
                                    ✅ Applied Successfully
                                </div>
                                :
                                <div className="flex gap-2 mt-3">
                                    <Button size="small" onClick={handleApply} disabled={isApplyInteractionLoading}>Apply</Button>
                                    <Button size="small" outlined onClick={handlePreview}>Edit</Button>
                                </div>
                            }
                        </div>
                    }
                    {formattedGeneratedStatus === "error" &&
                        <div>
                            {/* <div className={`p-3 mb-3 ${styles.SolidXAIResponse}`}>
                                {aiResponseTitle}
                            </div> */}
                            <div className={`border-round-lg overflow-hidden ${styles.SolidXAiResponseError} border border-red-200 shadow-sm`}>
                                <div className="mb-3 flex align-items-center gap-2 text-red-600">
                                    <i className="pi pi-exclamation-triangle text-red-500 text-base"></i>
                                    <p className="font-semibold">{parsed?.instructions}</p>
                                </div>
                                {parsed?.errors?.map((e: any, i: number) => (
                                <p key={i}>
                                    {typeof e === "string" ? e : JSON.stringify(e)}
                                </p>
                                ))}
                            </div>
                        </div>
                    }
                </>
            }
            {editAndApplyDialog && <Dialog header="Edit And Apply" visible={editAndApplyDialog} style={{ width: '50vw' }} onHide={() => { if (!editAndApplyDialog) return; setEditAndApplyDialog(false); }}>
                <CodeMirror
                    value={renderDataForCodeMirror()}
                    style={{ fontSize: '10px' }}
                    theme={oneDark}
                    extensions={[javascript(), EditorView.lineWrapping]}
                    onChange={(e: any) => {
                        setEditedFormattedJson(e);
                    }}
                />
                <Button className="mt-3" label="Apply" size="small" onClick={handleEditedApply} />
            </Dialog>}
        </>
    )
}