import { Button } from "primereact/button"
import styles from './SolidImport.module.css'

export const SolidImportStepper = ({ importStep, setImportStep }: any) => {
    const getStepColor = (step: number) => {
        if (importStep === step) return "var(--primary-color)";      // current step
        if (importStep > step) return "#eceff1";        // past step
        return "#F9F9F9";                                  // future step
    };

    return (
        <div className="py-2 px-4 secondary-border-bottom" style={{ backgroundColor: '#F6F6F6' }}>
            <div className="flex align-items-center" style={{ borderRadius: 6, border: '1px solid var(--primary-light-color)', overflow: 'hidden', cursor: 'pointer' }}>
                {/* Step 1 */}
                <div className="flex relative" style={{ flex: 1, height: 40, zIndex: 4 }} onClick={() => setImportStep(1)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 343 40" fill="none" preserveAspectRatio="none">
                        <path d="M342 20.1399L329 0H0V40H329L342 20.1399Z" fill={getStepColor(1)} stroke={getStepColor(1)} strokeLinejoin="round" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="100%" viewBox="0 0 10 40" fill="none" style={{ marginLeft: -12 }}>
                        <path d="M1 0L10 20.1399L1 40" stroke="#CFD6DC" stroke-linejoin="round" />
                    </svg>
                    <div className={`${styles.StepperText} ${importStep === 1 ? styles.ActiveStepperText : styles.DeactiveStepperText}`}>Instructions</div>
                </div>

                {/* Step 2 */}
                <div className="flex relative" style={{ flex: 1, height: 40, zIndex: 3, marginLeft: -14 }} onClick={() => setImportStep(2)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 343 40" fill="none" preserveAspectRatio="none">
                        <path d="M342 20.1399L330 0H0L13.5 20L0 40H330L342 20.1399Z" fill={getStepColor(2)} stroke={getStepColor(2)} strokeLinejoin="round" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="100%" viewBox="0 0 10 40" fill="none" style={{ marginLeft: -13 }}>
                        <path d="M1 0L10 20.1399L1 40" stroke="#CFD6DC" stroke-linejoin="round" />
                    </svg>
                    <div className={`${styles.StepperText} ${importStep === 2 ? styles.ActiveStepperText : styles.DeactiveStepperText}`}>Import</div>
                </div>

                {/* Step 3 */}
                <div className="flex relative" style={{ marginLeft: -22, flex: 1, height: 40, zIndex: 2 }} onClick={() => setImportStep(3)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 343 40" fill="none" preserveAspectRatio="none">
                        <path d="M342 20.1399L330 0H0L13.5 20L0 40H330L342 20.1399Z" fill={getStepColor(3)} stroke={getStepColor(3)} strokeLinejoin="round" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="100%" viewBox="0 0 10 40" fill="none" style={{ marginLeft: -13 }}>
                        <path d="M1 0L10 20.1399L1 40" stroke="#CFD6DC" stroke-linejoin="round" />
                    </svg>
                    <div className={`${styles.StepperText} ${importStep === 3 ? styles.ActiveStepperText : styles.DeactiveStepperText}`}>Map the fields</div>
                </div>

                {/* Step 4 */}
                <div className="flex relative" style={{ marginLeft: -22, flex: 1, height: 40, zIndex: 1 }} onClick={() => setImportStep(4)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 330 40" fill="none" preserveAspectRatio="none">
                        <path d="M330 0H0L13.5 20L0 40H330V0Z" fill={getStepColor(4)} stroke={getStepColor(4)} strokeLinejoin="round" />
                    </svg>
                    <div className={`${styles.StepperText} ${importStep === 4 ? styles.ActiveStepperText : styles.DeactiveStepperText}`}>Summary</div>
                </div>
            </div>
        </div>
    )
}