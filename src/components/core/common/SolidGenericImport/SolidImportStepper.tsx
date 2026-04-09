import { Check, ChevronRight } from "lucide-react";

const allSteps = [
    { id: 1, label: "Instructions" },
    { id: 2, label: "Upload" },
    { id: 3, label: "Map Fields" },
    { id: 4, label: "Summary" }
];

export const SolidImportStepper = ({ importStep, setImportStep }: any) => {
    return (
        <div className="solid-import-stepper">
            {allSteps.map((step, index) => {
                const isActive = importStep === step.id;
                const isCompleted = importStep > step.id;

                return (
                    <div key={step.id} className="solid-import-stepper-item-wrap">
                        <button
                            type="button"
                            className={`solid-import-stepper-item ${isActive ? "is-active" : ""} ${isCompleted ? "is-complete" : ""}`}
                            onClick={() => setImportStep(step.id)}
                        >
                            <span className="solid-import-stepper-badge">
                                {isCompleted ? <Check size={13} /> : step.id}
                            </span>
                            <span className="solid-import-stepper-label">{step.label}</span>
                        </button>
                        {index < allSteps.length - 1 ? (
                            <span className="solid-import-stepper-separator" aria-hidden="true">
                                <ChevronRight size={14} />
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}
