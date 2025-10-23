"use client"
import MarkdownViewer from "@/components/common/MarkdownViewer";
import { useApplySolidAiInteractionMutation } from '@/redux/api/aiInteractionApi';
import { useCodeGenerationPostProcessMutation } from "@/redux/api/solidServiceApi";
import { closePopup } from "@/redux/features/popupSlice";
import { AiInteraction } from '@/types/solid-core';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror'; // Correct import
import { Button } from 'primereact/button';
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { SolidCircularLoader } from "../common/SolidLoaders/SolidCircularLoader";
import styles from './SolidXAI.module.css';
import { SolidXAIIcon } from './SolidXAIIcon';
import moment from "moment";

export const SolidXAIResponse = ({ interaction }: { interaction: AiInteraction }) => {
    const renderContent = () => {

        switch (interaction.contentType) {
            case 'json':
                return (
                    <JsonDisplay interaction={interaction} />
                )
            case 'markdown':
                return (
                    <MarkdownDisplay interaction={interaction} />
                )
            case 'plain_text':
            default:
                return <PlainTextDisplay interaction={interaction} />
        }
    }
    const timestamp = moment(interaction.createdAt).format('HH:mm')
    return (
        <div className={`${styles.SolidXAIResponseWrapper}`}>
            {interaction.status !== "pending" &&
                <div className='flex align-items-start gap-3'>
                    <div className="text-center">
                        <Button icon={<SolidXAIIcon />} size="small" raised text rounded onClick={() => window.open(`/admin/core/solid-core/ai-interaction/form/${interaction.id}?viewMode=view`, '_blank')} />
                        <div className=" text-xs text-black-400 mt-3">
                            {timestamp}
                        </div>
                    </div>
                    <div className={`mt-3`} style={{ width: '100%' }}>
                        {renderContent()}
                    </div>

                </div>
            }
        </div>
    )
}

export interface PlainTextDisplayProps {
    interaction: AiInteraction
}

export const PlainTextDisplay: React.FC<PlainTextDisplayProps> = ({ interaction }) => {

    let response = '';
    let parsed: any = {}
    try {
        parsed = JSON.parse(interaction.message)
        response = parsed.response ? parsed.response : '';
    } catch (e) {
        response = 'Invalid JSON'
    }

    return (
        <div className={`p-3 ${styles.SolidXAIResponse}`}>
            {response}
        </div>
    )
}

export interface MarkdownDisplayProps {
    interaction: AiInteraction
}

export const MarkdownDisplay: React.FC<MarkdownDisplayProps> = ({ interaction }) => {
    // const jsonMsg = JSON.parse(interaction.message);
    // const markdown = jsonMsg.data;
    let jsonMsg: any;
    let markdown: string;

    let responseMessage = '';
    let parsed: any = {}
    try {
        parsed = JSON.parse(interaction.message)
        responseMessage = parsed.response ? parsed.response : '';
    } catch (e) {
        responseMessage = 'Invalid JSON'
    }


    try {
        if (typeof responseMessage === "string") {
            try {
                jsonMsg = JSON.parse(responseMessage.trim());
                markdown = jsonMsg?.data ?? "";
            } catch (jsonErr) {
                // Not valid JSON → treat the raw string as markdown
                markdown = responseMessage.trim();
            }
        } else if (typeof responseMessage === "object" && responseMessage !== null) {
            // Already an object
            jsonMsg = responseMessage;
            markdown = jsonMsg?.data ?? "";
        } else {
            // Fallback for other types
            markdown = String(responseMessage ?? "");
        }
    } catch (err: any) {
        // Worst-case fallback: put the error string in markdown
        markdown = `Error handling responseMessage: ${err?.message || String(err)}`;
    }
    // 🔧 Normalize escaped newlines, tabs, and quotes
    if (markdown.includes("\\n")) {
        markdown = markdown
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "")
            .replace(/\\"/g, '"');
    }

    // ✅ markdown is now clean and render-ready

    return (
        <div className={`p-3 ${styles.SolidXAIResponse}`} style={{ width: '100%' }}>
            <MarkdownViewer data={markdown} />
        </div>
    )
}

export interface JsonDisplayProps {
    interaction: AiInteraction
}

// SolidXConcernDisplay
export const JsonDisplay: React.FC<JsonDisplayProps> = ({ interaction }) => {
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

    let formattedJson = '';
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

    return (
        <>
            <Toast ref={toast} />

            {isGenerating ?
                <>
                    {/* <div className="flex flex-column align-items-center justify-content-center">
                        <SolidCircularLoader />
                        <p className="mt-4 font-medium">Waiting for backend...</p>
                    </div> */}
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
                            <div className={`p-3 mb-3 ${styles.SolidXAIResponse}`}>
                                <p>{parsed?.instructions}</p>
                            </div>
                            <div className="border-round-lg overflow-hidden">
                                <CodeMirror
                                    value={formattedCode}
                                    style={{ fontSize: '10px' }}
                                    theme={oneDark}
                                    readOnly={true}
                                    extensions={[javascript(), EditorView.lineWrapping]}
                                />
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
                            <div className="border-round-lg overflow-hidden">
                                <p>{parsed?.instructions}</p>
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