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
            {/* Provider Info */}
            {/* <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                <p className="text-sm font-medium mb-1">Provider:</p>
                <div className="text-xs text-gray-700 space-y-1">
                    <p>Name: {provider.name}</p>
                    <p>Type: {provider.type}</p>
                    <p>Trigger Model: {provider.triggerModelSingularName}</p>
                    <p>Target Model: {provider.targetModelSingularName}</p>
                    {provider.triggerOperations && (
                        <p>Trigger Ops: {provider.triggerOperations.join(", ")}</p>
                    )}
                    {provider.targetFieldName && <p>Target Field: {provider.targetFieldName}</p>}

                    {provider.contextSchema && (
                        <div className="mt-2 border rounded p-2 bg-gray-100">
                            <p className="text-xs font-medium mb-1">Context Schema:</p>
                            <CodeMirror
                                value={JSON.stringify(provider.contextSchema, null, 2)}
                                style={{ fontSize: "10px" }}
                                theme={oneDark}
                                readOnly
                                extensions={[javascript(), EditorView.lineWrapping]}
                            />
                        </div>
                    )}
                </div>
            </div> */}

            {/* Plan Steps */}
            <div className="space-y-3">
                {plan.map((step: any, idx: any) => (
                    <div key={idx} className="p-3 border rounded-lg shadow-sm bg-white">
                        <p className="text-lg mb-1 font-semibold">
                            Step {idx + 1}: {step.type}
                        </p>

                        {/* {step.path && <p className="text-gray-600 mb-1">Path: {step.path}</p>} */}
                        {/* {step.modulePath && <p className="text-gray-600 mb-1">Module Path: {step.modulePath}</p>} */}
                        {/* {step.providerClassName && <p className="text-gray-600 mb-1">Provider Class: {step.providerClassName}</p>} */}
                        {/* {step.importFrom && <p className="text-gray-600 mb-1">Import From: {step.importFrom}</p>} */}
                        {/* {step.registerIn && <p className="text-gray-600 mb-1">Register In: {step.registerIn.join(", ")}</p>} */}
                        {/* {step.uniqueGuard !== undefined && <p className="text-gray-600 mb-1">Unique Guard: {step.uniqueGuard ? "true" : "false"}</p>} */}
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
            life: 3000,
        });
    };

    const [applyInteraction, {
        isLoading: isApplyInteractionLoading,
        isSuccess: isApplyInteractionSuceess,
        isError: isApplyInteractionError,
        error: applyInteractionError,
        data: applyInteractionData
    }] = useApplySolidAiInteractionMutation();

    const handlePreview = () => {
        console.log('Preview clicked for interaction:', interaction.id)
        setEditAndApplyDialog(true)
    }

    const handleApply = async () => {
        try {
            const response = await applyInteraction({ id: interaction.id }).unwrap()
            setIsGenerating(true);
            console.log('Apply successful:', response)
        } catch (err: any) {
            showToast("error", "Apply Failed", `Failed to apply interaction - ${err?.data?.error}`);
            console.error('Failed to apply interaction:', err)
        }
    }

    const handleEditedApply = async () => {
        try {
            const response = await applyInteraction({ id: interaction.id }).unwrap()
            setIsGenerating(true);
            console.log('Apply successful:', response)
        } catch (err) {
            console.error('Failed to apply interaction:', err)
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
        const runSeederIfBackendAlive = async () => {
            if (isApplyInteractionSuceess) {
                console.log("isApplyInteractionSuceess", isApplyInteractionSuceess);
                setIsPinging(true);

                const isAlive = await pingBackendWithRetry(30, 500);

                setIsPinging(false);

                if (isAlive) {
                    await triggerCodeGenerationPostProcess();
                } else {
                    dispatch(closePopup());
                    console.log("Backend is not alive, cannot run seeder");
                    // showToast("error", "Backend Unavailable", "Seeder not triggered. Could not reach backend.");
                }
            }
        };
        setTimeout(() => {
            // TODO: Do we want to check if the "apply" mutation response contains a flag indicating that the last aiReponse application will lead to a server reboot?
            // TODO: Do we want to check if the "apply" mutation response contains a flag indicating that the last aiReponse application will need "seed" to be run?
            runSeederIfBackendAlive();
        }, 5000);
    }, [isApplyInteractionSuceess]);

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

    let formattedCode = '';
    let formattedGeneratedStatus = '';
    let parsed: any = {}
    try {
        parsed = JSON.parse(interaction.message)
        formattedCode = parsed.response ? JSON.stringify(parsed.response, null, 2) : '';
        formattedGeneratedStatus = parsed.generation_status;

    } catch (e) {
        formattedCode = 'Invalid JSON'
    }

    const renderDataComponent = () => {
        if (!parsed.data) return <p>No data found</p>;
        if (parsed?.data?.schemaPatch) return <SolidXSchemaPatchDisplay schemaPatch={parsed.data.schemaPatch} />;
        if (parsed?.data?.plan) return <SolidXPlanDisplay plan={parsed.data.plan} />;
        if (parsed?.data?.schema) return <SolidXSchemaDisplay schema={parsed.data.schema} />;
        return <p>Unrecognized data structure</p>;
    };

    return (
        <>
            <Toast ref={toast} className="custom-toast"  />

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
                            {interaction?.isApplied ?
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
                                {parsed?.errors.map((e: any) => <p>{e}</p>)}
                            </div>
                        </div>
                    }
                </>
            }
            {editAndApplyDialog && <Dialog header="Edit And Apply" visible={editAndApplyDialog} style={{ width: '50vw' }} onHide={() => { if (!editAndApplyDialog) return; setEditAndApplyDialog(false); }}>
                <CodeMirror
                    value={formattedCode}
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