"use client"
import { Button } from 'primereact/button'
import { OverlayPanel } from 'primereact/overlaypanel';
import React, { useEffect, useRef, useState } from 'react'
import { createSolidEntityApi } from '@/redux/api/solidEntityApi';
import { useFormik } from 'formik';
import { Toast } from 'primereact/toast';
import { useSearchParams } from 'next/navigation';
import { ERROR_MESSAGES } from '@/constants/error-messages';
import { ActiveArrowStep } from './StepperArrows/ActiveArrowStep';
import { ActiveBeforeStepArrow } from './StepperArrows/ActiveBeforeStepArrow';
import { InactiveStepArrow } from './StepperArrows/InactiveStepArrow';
interface Props {
    solidFormViewMetaData?: any;
    modelName?: any,
    initialEntityData?: any;
    id?: any,
    solidWorkflowFieldValue?: any
    setSolidWorkflowFieldValue?: any
}

export const SolidFormStepper = (props: Props) => {
    const { solidFormViewMetaData, modelName, initialEntityData, id, solidWorkflowFieldValue, setSolidWorkflowFieldValue } = props;
    const toast = useRef<Toast>(null);
    const formStepperOverlay = useRef(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const leftFormStepperOverlay = useRef(null);

    const searchParams = useSearchParams();
    const viewMode = searchParams.get('viewMode');

    const solidFormViewWorkflowData = solidFormViewMetaData?.data?.solidFormViewWorkflowData;
    const solidWorkflowField = solidFormViewMetaData?.data?.solidView?.layout?.attrs?.workflowField;
    const solidWorkflowFieldEnabled = solidFormViewMetaData?.data?.solidView?.layout?.attrs?.workflowFieldUpdateEnabled;
    const defaultWorkflowFieldValue = solidFormViewMetaData?.data?.solidFieldsMetadata?.[solidWorkflowField]?.defaultValue
    const defaultWorkflowFieldDisplayName = solidFormViewMetaData?.data?.solidFieldsMetadata?.[solidWorkflowField]?.displayName
    const activeStep = solidFormViewMetaData?.data?.solidFormViewWorkflowData[0].value
    const [solidWorkflowFieldKey, setSolidWorkflowFieldKey] = useState<string>("");
    const [visibleStepsCount, setVisibleStepsCount] = useState<number>(1);

    // Dynamic responsive logic based on actual measurements
  useEffect(() => {
    const calculateVisibleSteps = () => {
      if (!containerRef.current || !solidFormViewWorkflowData || solidFormViewWorkflowData.length === 0) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const overflowButtonWidth = 50; // Width reserved for dropdown button
      const spacing = 8; // Gap between buttons
      
      // Create temporary elements to measure actual button widths
      const tempContainer = document.createElement('div');
      tempContainer.style.visibility = 'hidden';
      tempContainer.style.position = 'absolute';
      tempContainer.style.display = 'flex';
      tempContainer.style.gap = `${spacing}px`;
      document.body.appendChild(tempContainer);

      const buttonWidths: number[] = [];
      
      // Measure each button
      solidFormViewWorkflowData.forEach((step: any, index: number) => {
        const tempButton = document.createElement('button');
        tempButton.className = 'p-button solid-step-button';
        tempButton.textContent = step.label;
        tempButton.style.flex = '1';
        tempButton.style.minWidth = 'fit-content';
        tempContainer.appendChild(tempButton);
        buttonWidths.push(tempButton.offsetWidth);
      });

      document.body.removeChild(tempContainer);

      // Calculate how many buttons can fit
      let availableWidth = containerWidth;
      let count = 0;
      let totalWidth = 0;

      for (let i = 0; i < buttonWidths.length; i++) {
        const buttonWidth = buttonWidths[i];
        const widthWithSpacing = buttonWidth + (i > 0 ? spacing : 0);
        
        // Check if we need to reserve space for overflow button
        const needsOverflow = i < buttonWidths.length - 1;
        const requiredWidth = totalWidth + widthWithSpacing + (needsOverflow ? overflowButtonWidth + spacing : 0);
        
        if (requiredWidth <= availableWidth) {
          totalWidth += widthWithSpacing;
          count++;
        } else {
          break;
        }
      }

      // Ensure minimum 1 step visible
      count = Math.max(1, count);
      
      setVisibleStepsCount(count);
    };

    calculateVisibleSteps();
    
    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleSteps();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Recalculate when data changes
    const timeoutId = setTimeout(calculateVisibleSteps, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [solidFormViewWorkflowData]);

    useEffect(() => {
        if (!solidWorkflowField) return;

        setSolidWorkflowFieldKey(solidWorkflowField);

        setSolidWorkflowFieldValue(() => {
            if (initialEntityData?.[solidWorkflowField] !== undefined) {
                if (solidFormViewMetaData?.data?.solidFieldsMetadata?.[solidWorkflowField]?.type === "relation") {
                    return initialEntityData[solidWorkflowField]?.id || initialEntityData[solidWorkflowField];
                } else {
                    return initialEntityData[solidWorkflowField];
                }
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
                showToast("success", ERROR_MESSAGES.FIELD_UPDATE(defaultWorkflowFieldDisplayName), ERROR_MESSAGES.FIELD_UPDATE_SUCCESSFULLY(defaultWorkflowFieldDisplayName));
                if (result?.data?.[solidWorkflowFieldKey]) {
                    setSolidWorkflowFieldValue(result.data[solidWorkflowFieldKey]);
                }
            }
        } catch (error) {
            console.error(ERROR_MESSAGES.UPDATING_STEPPER, error);
            showToast("error", ERROR_MESSAGES.UPDATE_FAILED, ERROR_MESSAGES.FAILED_UPDATE_FROM);
        }
    }

    const handleButtonClick = (stepValue: any) => {
        if (solidWorkflowFieldEnabled === false || id === "new" || viewMode === "view") {
            return
        } else {
            formik.setFieldValue(solidWorkflowFieldKey, stepValue);
            formik.handleSubmit();
        }
    }

    const activeIndex = solidFormViewWorkflowData?.findIndex((step: any) => step.value === solidWorkflowFieldValue) ?? -1;

    // Smart step distribution to always show active step
    let visibleSteps: any[] = [];
    let previousSteps: any[] = [];
    let nextSteps: any[] = [];

    if (solidFormViewWorkflowData && solidFormViewWorkflowData.length > 0) {
        if (activeIndex === -1) {
            // No active step found, use default behavior
            visibleSteps = solidFormViewWorkflowData.slice(0, visibleStepsCount);
            nextSteps = solidFormViewWorkflowData.slice(visibleStepsCount);
        } else if (visibleStepsCount === 1) {
            // Only one button fits - always show active
            visibleSteps = [solidFormViewWorkflowData[activeIndex]];
            previousSteps = solidFormViewWorkflowData.slice(0, activeIndex);
            nextSteps = solidFormViewWorkflowData.slice(activeIndex + 1);
        } else {
            // Multiple buttons fit - ensure active is visible
            const totalSteps = solidFormViewWorkflowData.length;

            if (activeIndex < visibleStepsCount) {
                // Active is in the first visibleStepsCount items - show from start
                visibleSteps = solidFormViewWorkflowData.slice(0, visibleStepsCount);
                nextSteps = solidFormViewWorkflowData.slice(visibleStepsCount);
            } else {
                // Active is beyond visible range - center around active
                // Reserve 1 slot for active, distribute rest before and after
                const slotsAvailable = visibleStepsCount - 1;
                const afterActive = Math.min(Math.floor(slotsAvailable / 2), totalSteps - activeIndex - 1);
                const beforeActive = slotsAvailable - afterActive;

                const startIndex = Math.max(0, activeIndex - beforeActive);
                const endIndex = Math.min(totalSteps, activeIndex + afterActive + 1);

                previousSteps = solidFormViewWorkflowData.slice(0, startIndex);
                visibleSteps = solidFormViewWorkflowData.slice(startIndex, endIndex);
                nextSteps = solidFormViewWorkflowData.slice(endIndex);
            }
        }
    }

    const hasPreviousSteps = previousSteps.length > 0;
    const hasNextSteps = nextSteps.length > 0;

    return (
        <>
            <Toast ref={toast} />
            <div
                ref={containerRef}
                className='flex solid-dynamic-stepper'
                style={{
                    maxWidth: '700px',
                    width: '100%',
                    position: 'relative',
                }}
            >
                {/* Left dropdown for previous steps */}
                {hasPreviousSteps && (
                    <div className='flex align-items-center'>
                        <Button
                            type='button'
                            icon="pi pi-angle-left"
                            text
                            size='small'
                            style={{
                                height: '100%',
                                width: '2.5rem',
                                padding: 0,
                                minWidth: '2.5rem'
                            }}
                            onClick={(e) =>
                                // @ts-ignore
                                leftFormStepperOverlay.current.toggle(e)
                            }
                        />
                        <OverlayPanel
                            ref={leftFormStepperOverlay}
                            className="solid-custom-overlay solid-form-stepper-overlay"
                        >
                            <div className='flex flex-column gap-1 p-1'>
                                {previousSteps.map((step: any, index: number) => {
                                    const stepIndex = index;
                                    const isStepActive = stepIndex === activeIndex;
                                    const isStepBeforeActive = stepIndex < activeIndex;

                                    return (
                                        <Button
                                            key={stepIndex}
                                            type='button'
                                            label={step.label}
                                            size='small'
                                            text
                                            // text={!isStepActive && !isStepBeforeActive}
                                            onClick={() => {
                                                handleButtonClick(step.value);
                                                // @ts-ignore
                                                leftFormStepperOverlay.current.hide();
                                            }}
                                            // className={`${isStepActive ? 'p-button-primary' : ''} ${isStepBeforeActive ? 'p-button-secondary' : ''}`}
                                        />
                                    )
                                })}
                            </div>
                        </OverlayPanel>
                    </div>
                )}

                {/* Visible steps */}
                {visibleSteps.map((step: any, index: number) => {
                    const actualIndex = hasPreviousSteps ? previousSteps.length + index : index;
                    const isActive = actualIndex === activeIndex;
                    const isBeforeActive = actualIndex < activeIndex;
                    const isAfterActive = actualIndex > activeIndex;
                    const isFirstVisible = index === 0;
                    const isLastVisible = index === visibleSteps.length - 1;
                    const isNextAfterActive = actualIndex === activeIndex + 1;
                    const isTwoStepsOnly = visibleSteps.length === 2;

                    return (
                        <Button
                            key={actualIndex}
                            type="button"
                            className={`solid-step-button relative ${isTwoStepsOnly ? 'two-step-button' : ''} ${isActive ? 'p-button-primary' : ''} ${isBeforeActive ? 'p-button-secondary' : ''}`}
                            text={!isActive && !isBeforeActive}
                            onClick={() => handleButtonClick(step.value)}
                            style={{
                                flex: '1',
                                minWidth: 'fit-content',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {step.label}
                            <>
                                {isNextAfterActive && solidFormViewWorkflowData.map((step: any) => step.value).includes(solidWorkflowFieldValue) && (
                                    <div className="absolute active-step-arrow">
                                        <ActiveArrowStep />
                                    </div>
                                )}
                                {(isActive || isBeforeActive) && !isFirstVisible && (!isTwoStepsOnly || index === 1) && (
                                    <div className="absolute active-before-step-arrow">
                                        <ActiveBeforeStepArrow />
                                    </div>
                                )}
                                {isAfterActive && !isLastVisible && (
                                    <div className="absolute inactive-step-arrow">
                                        <InactiveStepArrow />
                                    </div>
                                )}
                            </>
                        </Button>
                    )
                })}

                {/* Right dropdown for next steps */}
                {hasNextSteps && (
                    <div className='flex align-items-center'>
                        <Button
                            type='button'
                            icon="pi pi-angle-down"
                            text
                            size='small'
                            style={{
                                height: '100%',
                                width: '2.5rem',
                                padding: 0,
                                minWidth: '2.5rem'
                            }}
                            onClick={(e) =>
                                // @ts-ignore
                                formStepperOverlay.current.toggle(e)
                            }
                        />
                        <OverlayPanel
                            ref={formStepperOverlay}
                            className="solid-custom-overlay solid-form-stepper-overlay"
                        >
                            <div className='flex flex-column gap-1 p-1'>
                                {nextSteps.map((step: any, index: number) => {
                                    const stepIndex = previousSteps.length + visibleSteps.length + index;
                                    const isStepActive = stepIndex === activeIndex;
                                    const isStepBeforeActive = stepIndex < activeIndex;

                                    return (
                                        <Button
                                            key={stepIndex}
                                            type='button'
                                            label={step.label}
                                            size='small'
                                            text={!isStepActive && !isStepBeforeActive}
                                            onClick={() => {
                                                handleButtonClick(step.value);
                                                // @ts-ignore
                                                formStepperOverlay.current.hide();
                                            }}
                                            className={`${isStepActive ? 'p-button-primary' : ''} ${isStepBeforeActive ? 'p-button-secondary' : ''}`}
                                        />
                                    )
                                })}
                            </div>
                        </OverlayPanel>
                    </div>
                )}
            </div>
        </>
    )
}