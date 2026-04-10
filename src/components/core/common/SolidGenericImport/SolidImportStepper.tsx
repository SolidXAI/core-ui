import { Check } from "lucide-react";

const allSteps = [
    { id: 1, label: "Instructions" },
    { id: 2, label: "Upload" },
    { id: 3, label: "Map Fields" },
    { id: 4, label: "Summary" }
];

export const SolidImportStepper = ({ importStep, maxStepReached = importStep, setImportStep }: any) => {
    return (
        <div className="solid-import-stepper" aria-label="Import steps">
            {allSteps.map((step, index) => {
                const isActive = importStep === step.id;
                const isCompleted = importStep > step.id;
                const isLocked = step.id > maxStepReached;

                return (
                    <div
                        key={step.id}
                        className={`solid-import-stepper-item-wrap ${index === allSteps.length - 1 ? "is-last" : ""}`}
                    >
                        <button
                            type="button"
                            className={`solid-import-stepper-item ${isActive ? "is-active" : ""} ${isCompleted ? "is-complete" : ""} ${isLocked ? "is-locked" : ""}`}
                            onClick={() => setImportStep(step.id)}
                            disabled={isLocked}
                        >
                            <span className="solid-import-stepper-badge">
                                {isCompleted ? <Check size={13} /> : step.id}
                            </span>
                            <span className="solid-import-stepper-label">{step.label}</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
