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
            <div className="flex align-items-center" style={{ borderRadius: 6, border: '1px solid var(--primary-light-color)', overflow: 'hidden', cursor:'pointer'}}>
                <div className="flex relative" style={{ flex: 1, height: 40, zIndex: 2 }} onClick={() => setImportStep(1)}>
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 357 40" fill="none" style={{ marginLeft: -15, }}>
                        <path d="M356 20.1399L343 0H0V40H343L356 20.1399Z" fill={getStepColor(1)} stroke={getStepColor(1)} stroke-linejoin="round" />
                    </svg> */}
                    <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="100%" viewBox="0 0 522 40" fill="none">
                        <path d="M521 20.1399L508 0H0V40H508L521 20.1399Z" fill={getStepColor(1)} stroke={getStepColor(1)} stroke-linejoin="round" />
                    </svg>
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="15" height="100%" viewBox="0 0 15 40" fill="none" style={{ position: 'absolute', right: 0 }}>
                        <path d="M1 0L14 20.1399L1 40" stroke="#CFD6DC" stroke-linejoin="round" />
                    </svg> */}
                    <div className={`${styles.StepperText} ${importStep === 1 ? styles.ActiveStepperText : styles.DeactiveStepperText}`}>Instructions</div>
                </div>
                {/* <div className="flex relative" style={{ marginLeft: -52, flex: 1, zIndex: 2, overflow: "hidden", height: 40 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 358 40" fill="none">
                        <path d="M357 20.1399L344 0H1L14.5 20L1 40H344L357 20.1399Z" fill={getStepColor(2)} stroke={getStepColor(2)} stroke-linejoin="round" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="100%" viewBox="0 0 15 40" fill="none" style={{ marginLeft: -26 }}>
                        <path d="M1 0L14 20.1399L1 40" stroke="#CFD6DC" stroke-linejoin="round" />
                    </svg>
                    <div className={`${styles.StepperText} ${importStep === 2 ? styles.ActiveStepperText : styles.DeactiveStepperText}`}>Upload File</div>
                </div> */}
                <div className="flex w-full relative" style={{ marginLeft: -36, background: getStepColor(2), flex: 1, zIndex: 1, height: 40, }} onClick={() => setImportStep(2)}>
                    <div className={`${styles.StepperText} ${importStep === 2 ? styles.ActiveStepperText : styles.DeactiveStepperText}`}>Import</div>
                </div>
            </div>
        </div>
    )
}