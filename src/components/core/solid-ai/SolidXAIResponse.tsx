"use client"
import { useSeederMutation } from "@/redux/api/solidServiceApi";
import { Button } from 'primereact/button'
import styles from './SolidXAI.module.css'
import { SolidXAIIcon } from './SolidXAIIcon'
import { AiInteraction } from '@/types/solid-core'
import { useApplySolidAiInteractionMutation } from '@/redux/api/aiInteractionApi'
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { closePopup } from "@/redux/features/popupSlice";
import { Toast } from "primereact/toast";
import { SolidCircularLoader } from "../common/SolidLoaders/SolidCircularLoader";
import { Dialog } from "primereact/dialog";
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror'; // Correct import

export const SolidXAIResponse = ({ interaction }: { interaction: AiInteraction }) => {
    const renderContent = () => {

        switch (interaction.contentType) {
            case 'json':
                return (
                    <JsonDisplay interaction={interaction} />
                )
            case 'plain_text':
            default:
                return <PlainTextDisplay interaction={interaction} />
        }
    }

    return (
        <div className={`${styles.SolidXAIResponseWrapper}`}>
            <div className='flex align-items-start gap-3'>
                <div>
                    <Button icon={<SolidXAIIcon />} size="small" raised text rounded />
                </div>
                <div className={`mt-3`}>
                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

export interface PlainTextDisplayProps {
    interaction: AiInteraction
}

export const PlainTextDisplay: React.FC<PlainTextDisplayProps> = ({ interaction }) => {
    return (
        <div className={`p-3 ${styles.SolidXAIResponse}`}>
            {interaction.message}
        </div>
    )
}

export interface JsonDisplayProps {
    interaction: AiInteraction
}

export const JsonDisplay: React.FC<JsonDisplayProps> = ({ interaction }) => {
    console.log("Rendering JSON display for interaction:", interaction);

    let aiResponseTitle = '';
    if (interaction.metadata) {
        const metadata = JSON.parse(interaction.metadata);
        const toolsInvoked = metadata['tools_invoked'][0];

        switch (toolsInvoked) {
            case 'solid_create_module':
                aiResponseTitle = 'Module Created';
                break;

            case 'solid_create_model_with_fields':
                aiResponseTitle = 'Model Created';
                break;

            case 'solid_add_field':
                aiResponseTitle = 'Field Added';
                break;

            case 'solid_create_dashboard':
                aiResponseTitle = 'Dashboard Created';
                break;

            case 'solid_create_dashboard_widget':
                aiResponseTitle = 'Chart Created';
                break;

            case 'solid_create_model_layout':
                aiResponseTitle = 'Layout Created';
                break;

            default:
                break;
        }
    }

    const dispatch = useDispatch();
    const [editAndApplyDialog, setEditAndApplyDialog] = useState(false);
    const [editedFormattedJson, setEditedFormattedJson] = useState<string>('{}');

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
        } catch (err) {
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

    // const toast = useRef<Toast>(null);
    // const showToast = (severity: "success" | "error", summary: string, detail: string) => {
    //     toast.current?.show({
    //         severity,
    //         summary,
    //         detail,
    //         life: 3000,
    //     });
    // };

    const [triggerSeeder, {
        data,
        isLoading,
        isSuccess: isSeederSuccess,
        isError: isSeederError
    }] = useSeederMutation();

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
                    await triggerSeeder("ModuleMetadataSeederService");
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
        if (isSeederSuccess) {
            console.log("isSeederSuccess", data);
            // showToast("success", "Code Generated Successfully", "Code Generated Successfully");
            setIsGenerating(false);
            dispatch(closePopup());
            window.location.reload();
        }
        if (isSeederError) {
            console.log("isSeederError", isSeederError);
            // showToast("error", "Seeder Error", "Could not run seeder. Please try again.");
            setIsGenerating(false);
        }
    }, [isSeederSuccess])
    // TODO: END REFACTORING - reusable code alert

    let formattedJson = ''
    try {
        const parsed = JSON.parse(interaction.message)
        formattedJson = JSON.stringify(parsed, null, 2)
    } catch (e) {
        formattedJson = 'Invalid JSON'
    }

    return (
        <>
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
                    <div>
                        <div className={`p-3 ${styles.SolidXAIResponse}`}>
                            {aiResponseTitle}
                        </div>
                        {/* <div className="border-round-lg overflow-hidden">
                            <CodeMirror
                                value={formattedJson}
                                style={{ fontSize: '10px' }}
                                theme={oneDark}
                                extensions={[javascript(), EditorView.lineWrapping]}
                            />
                        </div> */}
                        <div className="flex gap-2 mt-3">
                            <Button size="small" onClick={handleApply} disabled={isApplyInteractionLoading}>Apply</Button>
                            <Button size="small" outlined onClick={handlePreview}>Preview</Button>
                        </div>
                    </div>
                </>
            }
            {editAndApplyDialog && <Dialog header="Edit And Apply" visible={editAndApplyDialog} style={{ width: '50vw' }} onHide={() => { if (!editAndApplyDialog) return; setEditAndApplyDialog(false); }}>
                <CodeMirror
                    value={formattedJson}
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