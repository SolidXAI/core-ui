"use client"
import { Button } from 'primereact/button'
import { OverlayPanel } from 'primereact/overlaypanel';
import React, { useEffect, useRef, useState } from 'react'
import { createSolidEntityApi } from '@/redux/api/solidEntityApi';
import { useFormik } from 'formik';
import { Toast } from 'primereact/toast';

interface Props {
    solidFormViewMetaData?: any;
    modelName?: any,
    initialEntityData?: any;
    id?: any
}

export const SolidFormStepper = (props: Props) => {
    const { solidFormViewMetaData, modelName, initialEntityData, id } = props;
    const toast = useRef<Toast>(null);
    const formStepperOverlay = useRef(null);

    const solidFormViewWorkflowData = solidFormViewMetaData?.data?.solidFormViewWorkflowData;
    const solidWorkflowField = solidFormViewMetaData?.data?.solidView?.layout?.attrs?.workflowField;
    const solidWorkflowFieldEnabled = solidFormViewMetaData?.data?.solidView?.layout?.attrs?.workflowFieldUpdateEnabled;
    const defaultWorkflowFieldValue = solidFormViewMetaData?.data?.solidFieldsMetadata?.[solidWorkflowField]?.defaultValue
    const defaultWorkflowFieldDisplayName = solidFormViewMetaData?.data?.solidFieldsMetadata?.[solidWorkflowField]?.displayName
    const activeStep = solidFormViewMetaData?.data?.solidFormViewWorkflowData[0].value
    const [solidWorkflowFieldKey, setSolidWorkflowFieldKey] = useState<string>("");
    const [solidWorkflowFieldValue, setSolidWorkflowFieldValue] = useState<string>("");

    useEffect(() => {
        if (!solidWorkflowField) return;

        setSolidWorkflowFieldKey(solidWorkflowField);

        setSolidWorkflowFieldValue(() => {
            if (initialEntityData?.[solidWorkflowField] !== undefined) {
                return initialEntityData[solidWorkflowField];
            } else if (defaultWorkflowFieldValue !== undefined) {
                return defaultWorkflowFieldValue;
            } else {
                return activeStep;
            }
        });
    }, [solidWorkflowField, initialEntityData, defaultWorkflowFieldValue, activeStep]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            id: +id,
            [solidWorkflowFieldKey]: solidWorkflowFieldValue || "",
        },
        onSubmit: (values) => {
            handleStepChange(values);
        }
    });

    const entityApi = createSolidEntityApi(modelName);
    const {
        usePatchUpdateSolidEntityMutation,
    } = entityApi;

    const [
        updateStepper,
        { isSuccess: isStepperUpdateSuccessfull, isError: isStepperUpdateError, error: stepperUpdateError },
    ] = usePatchUpdateSolidEntityMutation();


    const showToast = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({
            severity,
            summary,
            detail,
            life: 3000,
        });
    };

    const handleStepChange = async (values: any) => {
        try {
            const result = await updateStepper({ id: values.id, data: { [solidWorkflowFieldKey]: values[solidWorkflowFieldKey] } }).unwrap();
            if (result?.statusCode === 200) {
                showToast("success", `${defaultWorkflowFieldDisplayName} Update`, `${defaultWorkflowFieldDisplayName} updated successfully!`);
                if (result?.data?.[solidWorkflowFieldKey]) {
                    setSolidWorkflowFieldValue(result.data[solidWorkflowFieldKey]);
                }
            }
        } catch (error) {
            console.error('Error updating stepper:', error);
            showToast("error", "Update Failed", "Failed to update the form.");
        }
    }

    const handleButtonClick = (stepValue: any) => {
        formik.setFieldValue(solidWorkflowFieldKey, stepValue);
        formik.handleSubmit();
    }

    const activeIndex = solidFormViewWorkflowData.findIndex((step: any) => step.value === solidWorkflowFieldValue);
    const visibleSteps = solidFormViewWorkflowData.length > 5 ? solidFormViewWorkflowData.slice(0, 5) : solidFormViewWorkflowData;

    return (
        <>
            <Toast ref={toast} />
            <div className='flex solid-dynamic-stepper' style={solidWorkflowFieldEnabled === false ? { pointerEvents: 'none' } : {}}>
                {visibleSteps.map((step: any, index: number) => {
                    const isActive = index === activeIndex;
                    const isBeforeActive = index < activeIndex;
                    const isAfterActive = index > activeIndex;
                    const isFirstVisible = index === 0;
                    const isLastVisible = index === visibleSteps.length - 1;
                    const isNextAfterActive = index === activeIndex + 1;
                    const isTwoStepsOnly = visibleSteps.length === 2;

                    return (
                        <Button
                            key={index}
                            type="button"
                            className={`solid-step-button relative ${isTwoStepsOnly ? 'two-step-button' : ''} ${isActive ? 'p-button-primary' : ''} ${isBeforeActive ? 'p-button-secondary' : ''}`}
                            text={!isActive && !isBeforeActive}
                            onClick={() => handleButtonClick(step.value)}
                        >
                            {step.label}
                            <>
                                {isNextAfterActive && solidFormViewWorkflowData.map((step: any) => step.value).includes(solidWorkflowFieldValue) &&
                                    (
                                        <div className="absolute active-step-arrow">
                                            <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform="rotate(30)"
                                                height="48px"
                                                width="48px"
                                            >
                                                <g id="SVGRepo_iconCarrier">
                                                    <g id="color">
                                                        <polygon fill={"var(--primary-color)"} points="36,62 65,12 7,12" />
                                                    </g>
                                                    <g id="line">
                                                        <polyline fill="none" stroke="" stroke-miterlimit="10" stroke-width="1.5" points="36,62 65,12 7,12" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </div>
                                    )}

                                {(isActive || isBeforeActive) && !isFirstVisible && (!isTwoStepsOnly || index === 1) && (
                                    <div className="absolute active-before-step-arrow">
                                        <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform="rotate(30)"
                                            height="48px"
                                            width="48px"
                                        >
                                            <g id="SVGRepo_iconCarrier">
                                                <g id="color">
                                                    <polygon fill="#EAEDF1" points="36,62 65,12 7,12" />
                                                </g>
                                                <g id="line">
                                                    <polyline fill="none" stroke="var(--solid-stepper-border)" stroke-miterlimit="10" stroke-width="1.5" points="36,62 65,12 7,12" />
                                                </g>
                                            </g>
                                        </svg>
                                    </div>
                                )}

                                {isAfterActive && !isLastVisible && (
                                    <div className="absolute inactive-step-arrow">
                                        <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" fill="#000000" transform="rotate(30)"
                                            height="48px"
                                            width="48px"
                                        >
                                            <g id="SVGRepo_iconCarrier">
                                                <g id="color">
                                                    <polygon fill="#fff" points="36,62 65,12 7,12" />
                                                </g>
                                                <g id="line">
                                                    <polyline fill="none" stroke="var(--solid-stepper-border)" stroke-miterlimit="10" stroke-width="1.5" points="36,62 65,12 7,12" />
                                                </g>
                                            </g>
                                        </svg>
                                    </div>
                                )}
                            </>
                            {solidFormViewWorkflowData.length > 5 && index === 4 && (
                                <div className='absolute' style={{ right: 5 }}>
                                    <Button
                                        type='button'
                                        icon="pi pi-angle-down"
                                        text
                                        size='small'
                                        style={{ height: 24, width: '1.5rem', padding: 0 }}
                                        onClick={(e) =>
                                            // @ts-ignore 
                                            formStepperOverlay.current.toggle(e)
                                        }
                                    />
                                    <OverlayPanel ref={formStepperOverlay} className="solid-custom-overlay solid-form-stepper-overlay">
                                        <div className='flex flex-column gap-1 p-1'>
                                            {solidFormViewWorkflowData.slice(5).map((step: any, index: number) => (
                                                <Button
                                                    key={index}
                                                    type='button'
                                                    label={step.label}
                                                    size='small'
                                                    text
                                                    onClick={() => handleButtonClick(step.value)}
                                                />
                                            ))}
                                        </div>
                                    </OverlayPanel>
                                </div>
                            )}
                        </Button>
                    )
                })}
            </div>
        </>
    )
}