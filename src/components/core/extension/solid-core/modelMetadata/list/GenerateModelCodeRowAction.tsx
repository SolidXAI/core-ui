import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { AlertTriangle, FileCode2, Sparkles } from "lucide-react";
import { SolidCircularLoader } from "../../../../../../components/core/common/SolidLoaders/SolidCircularLoader";
import { ERROR_MESSAGES } from "../../../../../../constants/error-messages";
import { env } from "../../../../../../adapters/env";
import { useGenerateCodeForModelMutation } from "../../../../../../redux/api/modelApi";
import { useSeederMutation } from "../../../../../../redux/api/solidServiceApi";
import { closePopup } from "../../../../../../redux/features/popupSlice";
import { showToast } from "../../../../../../redux/features/toastSlice";
import { SolidListRowdataDynamicFunctionProps } from "../../../../../../types/solid-core";
import { SolidButton } from "../../../../../shad-cn-ui";

const GenerateModelCodeRowAction = (event: SolidListRowdataDynamicFunctionProps) => {
  const dispatch = useDispatch();
  const [statusMessage, setStatusMessage] = useState("Preparing model generation...");
  const [isPinging, setIsPinging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [generateCode, { isLoading: isGenerateCodeUpdating, isSuccess: isGenerateCodeSuceess }] =
    useGenerateCodeForModelMutation();

  const [triggerSeeder, { data, isSuccess: isSeederSuccess, isError: isSeederError }] = useSeederMutation();

  const isSolidCoreModel = event?.rowData?.module?.name === "solid-core";
  const generatedFiles = useMemo(
    () => [
      "Entity file",
      "Repository file",
      "Controller file",
      "Service file",
      "Create and update DTO files",
    ],
    []
  );

  const pingBackendWithRetry = async (retries = 30, delay = 500): Promise<boolean> => {
    for (let i = 0; i < retries; i += 1) {
      try {
        const res = await fetch(`${env("NEXT_PUBLIC_BACKEND_API_URL")}/api/ping`);
        if (res.ok) return true;
      } catch (error) {
        // ignore and retry
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return false;
  };

  const generateCodeHandler = async () => {
    try {
      setIsGenerating(true);
      setStatusMessage("Submitting model generation request...");
      await generateCode({ id: event?.rowData?.id }).unwrap();
      setStatusMessage("Waiting for backend to come back online...");
    } catch (error) {
      setIsGenerating(false);
      dispatch(closePopup());
      dispatch(showToast({ severity: "error", summary: "Something went wrong", detail: ERROR_MESSAGES.API_ERROR }));
    }
  };

  useEffect(() => {
    if (!isGenerateCodeSuceess) return undefined;

    const timer = window.setTimeout(async () => {
      setIsPinging(true);
      setStatusMessage("Checking backend availability before refreshing metadata...");
      const isAlive = await pingBackendWithRetry();
      setIsPinging(false);

      if (isAlive) {
        setStatusMessage("Refreshing seeded metadata...");
        await triggerSeeder("ModuleMetadataSeederService");
        return;
      }

      setIsGenerating(false);
      dispatch(closePopup());
      dispatch(
        showToast({
          severity: "error",
          summary: ERROR_MESSAGES.BACKEND_UNAVAILABLE,
          detail: ERROR_MESSAGES.SEEDER_NOT_TRIGGERED,
        })
      );
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [dispatch, isGenerateCodeSuceess, triggerSeeder]);

  useEffect(() => {
    if (isSeederSuccess) {
      dispatch(
        showToast({
          severity: "success",
          summary: ERROR_MESSAGES.CODE_GENERTAE_SUCCESSFULLY,
          detail: ERROR_MESSAGES.CODE_GENERTAE_SUCCESSFULLY,
        })
      );
      setIsGenerating(false);
      dispatch(closePopup());
      window.location.reload();
    }

    if (isSeederError) {
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.SEEDER_ERROR, detail: ERROR_MESSAGES.SEEDER_NOT_RUN }));
      setIsGenerating(false);
    }
  }, [data, dispatch, isSeederError, isSeederSuccess]);

  if (isGenerating) {
    return (
      <div className="solid-generate-code-popup">
        <div className="solid-filter-dialog-head solid-generate-code-popup__head">
          <div>
            <h3 className="solid-filter-dialog-title">Generate Model</h3>
            <p className="solid-filter-dialog-subtitle m-0">Applying the code generation pipeline and reseeding metadata.</p>
          </div>
        </div>
        <div className="solid-filter-dialog-sep" />
        <div className="solid-filter-dialog-body solid-generate-code-popup__body solid-generate-code-popup__body--loading">
          <SolidCircularLoader />
          <p className="solid-generate-code-popup__loading-title">
            {isPinging ? "Waiting for backend..." : "Generating model code..."}
          </p>
          <p className="solid-generate-code-popup__loading-copy">{statusMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="solid-generate-code-popup">
      <div className="solid-filter-dialog-head solid-generate-code-popup__head">
        <div>
          <h3 className="solid-filter-dialog-title">Generate Model</h3>
          <p className="solid-filter-dialog-subtitle m-0">
            Generate or refresh the model code artifacts from the current metadata definition.
          </p>
        </div>
      </div>
      <div className="solid-filter-dialog-sep" />
      <div className="solid-filter-dialog-body solid-generate-code-popup__body">
        {isSolidCoreModel ? (
          <div className="solid-generate-code-popup__notice is-warning">
            <AlertTriangle size={16} />
            <span>You cannot generate code for Solid Core models.</span>
          </div>
        ) : (
          <>
            <p className="solid-generate-code-popup__intro">
              Proceed with model code generation. Existing generated files may be overwritten.
            </p>
            <div className="solid-generate-code-popup__panel">
              <div className="solid-generate-code-popup__panel-title">
                <FileCode2 size={15} />
                <span>Artifacts created</span>
              </div>
              <ul className="solid-generate-code-popup__list">
                {generatedFiles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        <div className="solid-generate-code-popup__actions">
          {!isSolidCoreModel ? (
            <SolidButton
              size="small"
              autoFocus
              leftIcon={<Sparkles size={14} />}
              loading={isGenerateCodeUpdating}
              onClick={generateCodeHandler}
            >
              Generate
            </SolidButton>
          ) : null}
          <SolidButton size="small" variant="outline" onClick={() => dispatch(closePopup())}>
            {isSolidCoreModel ? "Close" : "Cancel"}
          </SolidButton>
        </div>
      </div>
    </div>
  );
};

export default GenerateModelCodeRowAction;
