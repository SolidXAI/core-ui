import { useFormik } from 'formik';
import { useCallback, useEffect, useState } from 'react'
import { CancelButton } from './CancelButton';
import { ApiKeysTab } from '../core/users/ApiKeysTab';
import { useSession } from '../../hooks/useSession';
import { SolidButton, SolidDivider, SolidInput, SolidSegmentedControl, SolidSwitch, SolidTabGroup, SolidTextarea } from '../shad-cn-ui';
import { usePathname } from "../../hooks/usePathname";
import SolidLogo from '../../resources/images/SolidXLogo.svg'
import AuthScreenRightBackgroundImage from '../../resources/images/auth/solid-left-layout-bg.png';
import AuthScreenLeftBackgroundImage from '../../resources/images/auth/solid-right-layout-bg.png';
import AuthScreenCenterBackgroundImage from '../../resources/images/auth/solid-login-light.png';
import { useDropzone } from 'react-dropzone';
import { SettingDropzoneActivePlaceholder } from './SolidSettings/SettingDropzoneActivePlaceholder';
import { SolidUploadedImage } from './SolidSettings/SolidUploadedImage';
import { SettingsImageRemoveButton } from './SolidSettings/SettingsImageRemoveButton';
import { ModelConfigTab, ProvidersTab, ModelBehavior, ModelEntry, SolidAiConfig, ensureBuiltInProviders } from './SolidSettings/LlmSettings/AiModelConfigTab';
import { useDispatch, useSelector } from 'react-redux';
import { ERROR_MESSAGES } from '../../constants/error-messages';
import { useBulkUpdateSolidSettingsMutation, useLazyGetSolidSettingsQuery } from '../../redux/api/solidSettingsApi';
import { env } from "../../adapters/env";
import { showToast } from "../../redux/features/toastSlice";

export const GeneralSettings = () => {
    const { data: session } = useSession();
    const [appLogoPreview, setAppLogoPreview] = useState<string | null>(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
    const [authScreenRightBackgroundImagePreview, setAuthScreenRightBackgroundImagePreview] = useState<string | null>(null);
    const [authScreenLeftBackgroundImagePreview, setAuthScreenLeftBackgroundImagePreview] = useState<string | null>(null);
    const [authScreenCenterBackgroundImagePreview, setAuthScreenCenterBackgroundImagePreview] = useState<string | null>(null);
    const dispatch = useDispatch()

  const [trigger, { data: solidSettingsData }] = useLazyGetSolidSettingsQuery();

    useEffect(() => {
        trigger("") // Fetch settings on mount
    }, [trigger])
    const pathname = usePathname();
    const [bulkUpdateSolidSettings] = useBulkUpdateSolidSettingsMutation();
    const initialValues = {
        appLogo: solidSettingsData?.data?.appLogo ?? null,
        companylogo: solidSettingsData?.data?.companylogo ?? null,
        passwordlessRegistrationValidateWhat: solidSettingsData?.data?.passwordlessRegistrationValidateWhat ?? "email",
        passwordlessLoginValidateWhat: solidSettingsData?.data?.passwordlessLoginValidateWhat ?? "email",
        allowPublicRegistration: solidSettingsData?.data?.allowPublicRegistration ?? false,
        passwordBasedAuth: solidSettingsData?.data?.passwordBasedAuth ?? false,
        passwordLessAuth: solidSettingsData?.data?.passwordLessAuth ?? false,
        activateUserOnRegistration: solidSettingsData?.data?.activateUserOnRegistration ?? false,
        iamGoogleOAuthEnabled: solidSettingsData?.data?.iamGoogleOAuthEnabled ?? false,
        iamMicrosoftOAuthEnabled: solidSettingsData?.data?.iamMicrosoftOAuthEnabled ?? false,
        iamFacebookOAuthEnabled: solidSettingsData?.data?.iamFacebookOAuthEnabled ?? false,
        iamAppleOAuthEnabled: solidSettingsData?.data?.iamAppleOAuthEnabled ?? false,
        // shouldQueueEmails: solidSettingsData?.data?.shouldQueueEmails ?? false,
        // shouldQueueSms: solidSettingsData?.data?.shouldQueueSms ?? false,
        authPagesLayout: solidSettingsData?.data?.authPagesLayout ?? "center",
        defaultRole: solidSettingsData?.data?.defaultRole ?? "Admin",
        appLogoPosition: solidSettingsData?.data?.appLogoPosition ?? "in_form_view",
        showAuthContent: solidSettingsData?.data?.showAuthContent ?? false,
        appTitle: solidSettingsData?.data?.appTitle ?? "SolidX",
        appSubtitle: solidSettingsData?.data?.appSubtitle ?? "Welcome To",
        appDescription: solidSettingsData?.data?.appDescription ?? "appDescription",
        showLegalLinks: solidSettingsData?.data?.showLegalLinks ?? false,
        appTnc: solidSettingsData?.data?.appTnc ?? null,
        appPrivacyPolicy: solidSettingsData?.data?.appPrivacyPolicy ?? null,
        enableDarkMode: solidSettingsData?.data?.enableDarkMode ?? false,
        copyright: solidSettingsData?.data?.copyright ?? null,
        forceChangePasswordOnFirstLogin: solidSettingsData?.data?.forceChangePasswordOnFirstLogin ?? false,
        contactSupportEmail: solidSettingsData?.data?.contactSupportEmail ?? null,
        contactSupportDisplayName: solidSettingsData?.data?.contactSupportDisplayName ?? null,
        contactSupportIcon: solidSettingsData?.data?.contactSupportIcon ?? null,
        authScreenRightBackgroundImage: solidSettingsData?.data?.authScreenRightBackgroundImage ?? null,
        authScreenLeftBackgroundImage: solidSettingsData?.data?.authScreenLeftBackgroundImage ?? null,
        authScreenCenterBackgroundImage: solidSettingsData?.data?.authScreenCenterBackgroundImage ?? null,
        solidXGenAiCodeBuilderConfig: (() => {
            const defaultAiConfig: SolidAiConfig = {
                models: {
                    default: { providerId: "", model: "", behavior: { streaming: false, custom: "" } },
                    fast: { providerId: "", model: "", behavior: { streaming: false, custom: "" } },
                },
                providers: {},
            };
            const raw = solidSettingsData?.data?.solidXGenAiCodeBuilderConfig;
            if (!raw) return defaultAiConfig;
            try {
                const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                return (parsed && typeof parsed === "object" ? parsed : defaultAiConfig) as SolidAiConfig;
            } catch {
                return defaultAiConfig;
            }
        })(),
        // llmProvider: solidSettingsData?.data?.llmProvider ?? null,
        // llModelName: solidSettingsData?.data?.llModelName ?? null,
        // llmProviderApiKey: solidSettingsData?.data?.llmProviderApiKey ?? null,
        // llmProviderBaseURL: solidSettingsData?.data?.llmProviderBaseURL ?? null,
        // llmModelIdentifier: solidSettingsData?.data?.llmModelIdentifier ?? null


    };
    const formik = useFormik({
        initialValues: initialValues,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {

                const updatedSettingsArray: Array<{ key: string; value: string; type: string }> = [];
                const currentSettings = solidSettingsData?.data || {};

        const formData = new FormData();

        // Compare changed fields
        Object.entries(values).forEach(([key, value]) => {
          const currentValue = currentSettings[key];

                    const wasCleared = currentValue != null && currentValue !== "" && (value === null || value === "");
                    const isFile = value instanceof File;
          const normalizedCurrent = currentValue ?? "";
          const normalizedValue = value ?? "";
          const changed = isFile || wasCleared || normalizedCurrent !== normalizedValue;

        if (changed) {
            if (isFile) {
              formData.append(key, value as File);
              updatedSettingsArray.push({
                key,
                value: "",
                type: "system",
              });
            } else {
              updatedSettingsArray.push({
                key,
                value:
                  value === null || value === undefined ? "" : (typeof value === "string" ? value : JSON.stringify(value)),
                type: "system",
              });
            }
          }
        });

        if (updatedSettingsArray.length === 0) {
          dispatch(
            showToast({
              severity: "success",
              summary: "No Changes",
              detail: "No settings were updated",
            }),
          );
          return;
        }

        // Append settings array to formData
        formData.append("settings", JSON.stringify(updatedSettingsArray));

        // Call API
        const response = await bulkUpdateSolidSettings({
          data: formData,
        }).unwrap();

        if (response.statusCode === 200) {
          dispatch(
            showToast({
              severity: "success",
              summary: "Updated",
              detail: "Settings updated",
            }),
          );
          trigger("");
        }
      } catch (error: any) {
        console.log("Error updating settings:", error);
        dispatch(
          showToast({
            severity: "error",
            summary: ERROR_MESSAGES.FAILED,
            detail: error?.data?.message || ERROR_MESSAGES.SOMETHING_WRONG,
          }),
        );
      }
    },
  });

  const showError = async () => {
    const errors = await formik.validateForm();
    const errorMessages = Object.values(errors);

    if (errorMessages.length > 0) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Error",
          detail: Array.isArray(errorMessages)
            ? errorMessages.join(", ")
            : errorMessages,
        }),
      );
    }
  };
  useEffect(() => {}, [pathname]);

  const positionMap: Record<"left" | "center" | "right", string> = {
    left: "The form will appear on the left side of the screen, while the banner will be positioned on the right side",
    center:
      "The form will be centered in the middle of the screen for balanced alignment",
    right:
      "The form will appear on the right side of the screen, and the banner will be positioned on the left side",
  };

  const onAppLogoDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          dispatch(
            showToast({
              severity: "error",
              summary: "File too large",
              detail: "Maximum file size is 2MB",
            }),
          );
          return;
        }
        formik.setFieldValue("appLogo", file);
        setAppLogoPreview(URL.createObjectURL(file));
      }
    },
    [formik],
  );

  const onCompanyLogoDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          dispatch(
            showToast({
              severity: "error",
              summary: "File too large",
              detail: "Maximum file size is 2MB",
            }),
          );
          return;
        }
        formik.setFieldValue("companylogo", file);
        setCompanyLogoPreview(URL.createObjectURL(file));
      }
    },
    [formik],
  );

  const {
    getRootProps: getAppLogoRootProps,
    getInputProps: getAppLogoInputProps,
    isDragActive: isAppLogoDragActive,
  } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpeg", ".jpg"],
      "image/svg+xml": [".svg"],
      "image/webp": [".webp"],
    },
    multiple: false,
    onDrop: onAppLogoDrop,
  });
  const {
    getRootProps: getCompanyLogoRootProps,
    getInputProps: getCompanyLogoInputProps,
    isDragActive: isCompanyLogoDragActive,
  } = useDropzone({
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
    },
    multiple: false,
    onDrop: onCompanyLogoDrop,
  });

  const removeAppLogo = () => {
    formik.setFieldValue("appLogo", null);
    if (appLogoPreview) {
      URL.revokeObjectURL(appLogoPreview);
      setAppLogoPreview(null);
    }
  };

  const removeCompanyLogo = () => {
    formik.setFieldValue("companylogo", null);
    if (companyLogoPreview) {
      URL.revokeObjectURL(companyLogoPreview);
      setCompanyLogoPreview(null);
    }
  };

  const onAuthScreenRightBackgroundImageDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          dispatch(
            showToast({
              severity: "error",
              summary: ERROR_MESSAGES.FILE_LARGE,
              detail: ERROR_MESSAGES.MAX_FILE_SIZE,
            }),
          );
          return;
        }
        formik.setFieldValue("authScreenRightBackgroundImage", file);
        setAuthScreenRightBackgroundImagePreview(URL.createObjectURL(file));
      }
    },
    [formik],
  );

  const onAuthScreenLeftBackgroundImageDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          dispatch(
            showToast({
              severity: "error",
              summary: ERROR_MESSAGES.FILE_LARGE,
              detail: ERROR_MESSAGES.MAX_FILE_SIZE,
            }),
          );
          return;
        }
        formik.setFieldValue("authScreenLeftBackgroundImage", file);
        setAuthScreenLeftBackgroundImagePreview(URL.createObjectURL(file));
      }
    },
    [formik],
  );

  const onAuthScreenCenterBackgroundImageDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          dispatch(
            showToast({
              severity: "error",
              summary: ERROR_MESSAGES.FILE_LARGE,
              detail: ERROR_MESSAGES.MAX_FILE_SIZE,
            }),
          );
          return;
        }
        formik.setFieldValue("authScreenCenterBackgroundImage", file);
        setAuthScreenCenterBackgroundImagePreview(URL.createObjectURL(file));
      }
    },
    [formik],
  );

  const {
    getRootProps: getAuthScreenRightBackgroundImageRootProps,
    getInputProps: getAuthScreenRightBackgroundImageInputProps,
    isDragActive: isAuthScreenRightBackgroundImageDragActive,
  } = useDropzone({
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp'],
    },
    multiple: false,
    onDrop: onAuthScreenRightBackgroundImageDrop,
  });

  const {
    getRootProps: getAuthScreenLeftBackgroundImageRootProps,
    getInputProps: getAuthScreenLeftBackgroundImageInputProps,
    isDragActive: isAuthScreenLeftBackgroundImageDragActive,
  } = useDropzone({
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp']
    },
    multiple: false,
    onDrop: onAuthScreenLeftBackgroundImageDrop
  });

  const {
    getRootProps: getAuthScreenCenterBackgroundImageRootProps,
    getInputProps: getAuthScreenCenterBackgroundImageInputProps,
    isDragActive: isAuthScreenCenterBackgroundImageDragActive
  } = useDropzone({
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/svg+xml': ['.svg'],
      'image/webp': ['.webp']
    },
    multiple: false,
    onDrop: onAuthScreenCenterBackgroundImageDrop
  });

  const removeAuthScreenRightBackgroundImage = () => {
    formik.setFieldValue("authScreenRightBackgroundImage", null);
    if (authScreenRightBackgroundImagePreview) {
      URL.revokeObjectURL(authScreenRightBackgroundImagePreview);
      setAuthScreenRightBackgroundImagePreview(null);
    }
  };

  const removeAuthScreenLeftBackgroundImage = () => {
    formik.setFieldValue("authScreenLeftBackgroundImage", null);
    if (authScreenLeftBackgroundImagePreview) {
      URL.revokeObjectURL(authScreenLeftBackgroundImagePreview);
      setAuthScreenLeftBackgroundImagePreview(null);
    }
  };

  const removeAuthScreenCenterBackgroundImage = () => {
    formik.setFieldValue("authScreenCenterBackgroundImage", null);
    if (authScreenCenterBackgroundImagePreview) {
      URL.revokeObjectURL(authScreenCenterBackgroundImagePreview);
      setAuthScreenCenterBackgroundImagePreview(null);
    }
  };

  const handleAiConfigChange = (newConfig: SolidAiConfig) => {
    formik.setFieldValue("solidXGenAiCodeBuilderConfig", newConfig);
  };

  return (
    <div className="page-parent-wrapper">
      <div className="solid-form-wrapper">
        <div className="solid-form-section">
          <form onSubmit={formik.handleSubmit}>
            <div className="page-header secondary-border-bottom">
              <div className="form-wrapper-title ">Settings</div>
              <div className="gap-3 flex">
                {formik.dirty && (
                  <SolidButton
                    size="sm"
                    type="submit"
                    loading={formik.isSubmitting}
                    onClick={() => showError()}
                  >
                    Save
                  </SolidButton>
                )}
                {/* <CancelButton /> */}
              </div>
            </div>
            <div className="px-4 py-3 md:p-4 solid-form-content">
              {pathname.includes("app-settings") && (
                <>
                  <div className="formgrid grid">
                    <div className="col-12 lg:col-10 xl:col-8">
                      <div className="formgrid grid">
                        <div className="col-12 md:col-6">
                          <p className="solid-settings-subheading">App Logo</p>
                          <div>
                            <div
                              {...getAppLogoRootProps()}
                              className="solid-dropzone-wrapper"
                              style={{ borderRadius: 8 }}
                            >
                              <input {...getAppLogoInputProps()} />
                              {/* {isAppLogoDragActive && */}
                              <SettingDropzoneActivePlaceholder />
                              {/* } */}
                            </div>
                            <div className="mt-2">
                              {(() => {
                                const logoSrc =
                                  (SolidLogo as any).src || SolidLogo;

                                let src = appLogoPreview
                                  ? appLogoPreview
                                  : formik.values.appLogo
                                    ? formik.values.appLogo
                                    : logoSrc;

                                const isBlobOrAbsolute =
                                  src?.startsWith("blob:") ||
                                  src?.startsWith("http");

                                if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                  src = `${env("API_URL")}/${src}`;
                                }
                                return (
                                  <SolidUploadedImage
                                    src={src}
                                    className="solid-app-logo"
                                  />
                                );
                              })()}
                            </div>
                            {formik.values.appLogo && (
                              <SettingsImageRemoveButton
                                onClick={removeAppLogo}
                              />
                            )}
                          </div>
                        </div>
                        <div className="col-12 md:col-6">
                          <p className="solid-settings-subheading">
                            Company Logo
                          </p>
                          <div>
                            <div
                              {...getCompanyLogoRootProps()}
                              className="solid-dropzone-wrapper"
                              style={{ borderRadius: 8 }}
                            >
                              <input {...getCompanyLogoInputProps()} />
                              {/* {isCompanyLogoDragActive && */}
                              <SettingDropzoneActivePlaceholder />
                              {/* } */}
                            </div>
                            <div className="mt-2">
                              {(() => {
                                const logoSrc =
                                  (SolidLogo as any).src || SolidLogo;

                                let src = companyLogoPreview
                                  ? companyLogoPreview
                                  : formik.values.companylogo
                                    ? formik.values.companylogo
                                    : logoSrc;

                                const isBlobOrAbsolute =
                                  src?.startsWith("blob:") ||
                                  src?.startsWith("http");

                                if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                  src = `${env("API_URL")}/${src}`;
                                }

                                return (
                                  <SolidUploadedImage
                                    src={src}
                                    className="solid-compony-logo"
                                  />
                                );
                              })()}
                            </div>
                            {formik.values.companylogo && (
                              <SettingsImageRemoveButton
                                onClick={removeCompanyLogo}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="solid-settings-heading">App Logo Position</p>
                  <div className="formgrid grid">
                    <div className="col-12 lg:col-10 xl:col-8">
                      <div className="flex">
                        <SolidSegmentedControl
                          className="solid-settings-segmented"
                          value={formik.values.appLogoPosition}
                          options={[
                            { value: "in_form_view", label: "In Form View" },
                            { value: "in_image_view", label: "In Image View" },
                          ]}
                          onChange={(value) => formik.setFieldValue("appLogoPosition", value)}
                        />
                      </div>
                    </div>
                  </div>
                  <SolidDivider className="my-4" />
                  <p className="solid-settings-heading">Title & Description Details</p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                      <div className="formgrid grid">
                        <div className="col-12 md:col-6">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Show Details on Authentication Screen</label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="showAuthContent"
                                checked={formik.values.showAuthContent}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "showAuthContent",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-6">
                          <div className="formgrid grid align-items-center">
                            <div className="col-12 md:col-5 pb-2 md:pb-0">
                              <label className="form-field-label">
                                App Title
                              </label>
                            </div>
                            <div className="col-12 md:col-7">
                              <SolidInput
                                type="text"
                                id="appTitle"
                                name="appTitle"
                                onChange={formik.handleChange}
                                value={formik.values.appTitle ?? ''}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-6 mt-4">
                          <div className="formgrid grid align-items-center">
                            <div className="col-12 md:col-5 pb-2 md:pb-0">
                              <label className="form-field-label">
                                App Subtitle
                              </label>
                            </div>
                            <div className="col-12 md:col-7">
                              <SolidInput
                                type="text"
                                id="appSubtitle"
                                name="appSubtitle"
                                onChange={formik.handleChange}
                                value={formik.values.appSubtitle ?? ''}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-6 mt-4">
                          <div className="formgrid grid align-items-start">
                            <div className="col-12 md:col-5 pb-2 md:pb-0">
                              <label className="form-field-label">
                                Description
                              </label>
                            </div>
                            <div className="col-12 md:col-7">
                              <SolidTextarea
                                rows={3}
                                id="appDescription"
                                name="appDescription"
                                onChange={formik.handleChange}
                                value={formik.values.appDescription ?? ''}
                                className='w-full'
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-6 mt-4">
                          <div className="formgrid grid align-items-start">
                            <div className="col-12 md:col-5 pb-2 md:pb-0">
                              <label className="form-field-label">Copyright</label>
                            </div>
                            <div className="col-12 md:col-7">
                              <SolidTextarea
                                rows={3}
                                id="copyright"
                                name="copyright"
                                onChange={formik.handleChange}
                                value={formik.values.copyright ?? ''}
                                className='w-full'
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <SolidDivider className="my-4" />

                  <p className="solid-settings-heading">Legal Links</p>
                  <div className='formgrid grid'>
                    <div className='col-12 lg:col-10 xl:col-8'>
                      <div className="formgrid grid">
                        <div className="col-12 md:col-6">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">Show Legal Links</label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="showLegalLinks"
                                checked={formik.values.showLegalLinks}
                                onChange={(checked) => formik.setFieldValue("showLegalLinks", checked)}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-6">
                          <div className="formgrid grid align-items-center">
                            <div className="col-12 md:col-5 py-2 md:py-0">
                              <label className="form-field-label">
                                Terms and Conditions Link
                              </label>
                            </div>
                            <div className="col-12 md:col-7">
                              <SolidInput
                                type="text"
                                id="appTnc"
                                name="appTnc"
                                onChange={formik.handleChange}
                                value={formik.values.appTnc ?? ""}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-6 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-12 md:col-5 pb-2 md:pb-0">
                              <label className="form-field-label">
                                Privacy Policy Link
                              </label>
                            </div>
                            <div className="col-12 md:col-7">
                              <SolidInput
                                type="text"
                                id="appPrivacyPolicy"
                                name="appPrivacyPolicy"
                                onChange={formik.handleChange}
                                value={formik.values.appPrivacyPolicy ?? ""}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <SolidDivider className="my-4" />
                  <p className="solid-settings-heading">Theme</p>
                  <div className="formgrid grid">
                    <div className="col-12 lg:col-10 xl:col-8">
                      <div className="formgrid grid">
                        <div className="col-12 md:col-6">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-10 lg:col-5">
                              <label className="form-field-label">
                                Enable Dark Mode
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="enableDarkMode"
                                checked={formik.values.enableDarkMode}
                                onChange={(checked) => formik.setFieldValue("enableDarkMode",checked)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {pathname.includes("authentication-settings") && (
                <>
                  <p className="solid-settings-heading">User Authentication</p>
                  <div className="formgrid grid">
                    <div className="col-12 lg:col-10 xl:col-8">
                      <div className="formgrid grid">
                        <div className="col-12">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Public Registration
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="allowPublicRegistration"
                                checked={formik.values.allowPublicRegistration}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "allowPublicRegistration",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Password Based Authentication
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="passwordBasedAuth"
                                checked={formik.values.passwordBasedAuth}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "passwordBasedAuth",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Password Less Authentication
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="passwordLessAuth"
                                checked={formik.values.passwordLessAuth}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "passwordLessAuth",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Auto Activate User on Registration{" "}
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="activateUserOnRegistration"
                                checked={
                                  formik.values.activateUserOnRegistration
                                }
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "activateUserOnRegistration",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Allow Login/ Signup with Google{" "}
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="iamGoogleOAuthEnabled"
                                checked={formik.values.iamGoogleOAuthEnabled}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "iamGoogleOAuthEnabled",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Allow Login/ Signup with Microsoft{" "}
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="iamMicrosoftOAuthEnabled"
                                checked={formik.values.iamMicrosoftOAuthEnabled}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "iamMicrosoftOAuthEnabled",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Allow Login/ Signup with Facebook{" "}
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="iamFacebookOAuthEnabled"
                                checked={formik.values.iamFacebookOAuthEnabled}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "iamFacebookOAuthEnabled",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Allow Login/ Signup with Apple{" "}
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="iamAppleOAuthEnabled"
                                checked={formik.values.iamAppleOAuthEnabled}
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "iamAppleOAuthEnabled",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 mt-3">
                          <div className="formgrid grid align-items-center">
                            <div className="col-10 sm:col-9 lg:col-5">
                              <label className="form-field-label">
                                Force Password change on first Login{" "}
                              </label>
                            </div>
                            <div className="col-2 sm:col-3 lg:col-7">
                              <SolidSwitch
                                name="forceChangePasswordOnFirstLogin"
                                checked={
                                  formik.values.forceChangePasswordOnFirstLogin
                                }
                                onChange={(checked) =>
                                  formik.setFieldValue(
                                    "forceChangePasswordOnFirstLogin",
                                    checked,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                        {formik.values.passwordLessAuth === true && (
                          <div className="col-12 mt-3">
                            <div className="formgrid grid align-items-center">
                              <div className="col-12 sm:col-12 lg:col-5 xl:col-5">
                                <label className="form-field-label">
                                  Password Less Registration Method
                                </label>
                              </div>
                              <div className="col-12 sm:col-12 lg:col-6 xl:col-6">
                                <SolidSegmentedControl
                                  className="solid-settings-segmented mt-3 lg:mt-0"
                                  value={
                                    formik.values
                                      .passwordlessRegistrationValidateWhat
                                  }
                                  options={[
                                    { value: "email", label: "Email" },
                                    { value: "mobile", label: "Mobile" },
                                  ]}
                                  onChange={(value) =>
                                    formik.setFieldValue(
                                      "passwordlessRegistrationValidateWhat",
                                      value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {formik.values.passwordLessAuth === true && (
                          <div className="col-12 mt-3">
                            <div className="formgrid grid align-items-center">
                              <div className="col-12 sm:col-12 lg:col-5 xl:col-5">
                                <label className="form-field-label">
                                  Password Less Login Method
                                </label>
                              </div>
                              <div className="col-12 sm:col-12 lg:col-6 xl:col-6">
                                <SolidSegmentedControl
                                  className="solid-settings-segmented mt-3 lg:mt-0"
                                  value={
                                    formik.values.passwordlessLoginValidateWhat
                                  }
                                  options={[
                                    { value: "email", label: "Email" },
                                    { value: "mobile", label: "Mobile" },
                                    {
                                      value: "selectable",
                                      label: "Selectable",
                                    },
                                  ]}
                                  onChange={(value) =>
                                    formik.setFieldValue(
                                      "passwordlessLoginValidateWhat",
                                      value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <SolidDivider className="my-4" />
                  <p className="solid-settings-heading">
                    Authentication Screen Layout
                  </p>
                  <div className="formgrid grid">
                    <div className="col-12 lg:col-10 xl:col-8">
                      <SolidSegmentedControl
                        className="solid-settings-segmented"
                        value={formik.values.authPagesLayout}
                        options={[
                          { value: "left", label: "Left" },
                          { value: "center", label: "Center" },
                          { value: "right", label: "Right" },
                        ]}
                        onChange={(value) =>
                          formik.setFieldValue("authPagesLayout", value)
                        }
                      />
                      <p className="mt-3 text-sm font-bold">
                        Note :{" "}
                        {
                          positionMap[
                            formik.values.authPagesLayout as
                              | "left"
                              | "center"
                              | "right"
                          ]
                        }
                      </p>
                    </div>
                  </div>
                  {formik.values.authPagesLayout === "center" && <></>}
                  <div className="formgrid grid">
                    <div className="col-12 lg:col-10 xl:col-8">
                      <div className="formgrid grid">
                        <div className="col-12 md:col-8 lg:col-6">
                          <p className="solid-settings-subheading">
                            {formik.values.authPagesLayout === "center"
                              ? "Background"
                              : "Banner"}{" "}
                            Image
                          </p>
                          {formik.values.authPagesLayout === "left" && (
                            <div>
                              <div
                                {...getAuthScreenLeftBackgroundImageRootProps()}
                                className="solid-dropzone-wrapper"
                                style={{ borderRadius: 8 }}
                              >
                                <input
                                  {...getAuthScreenLeftBackgroundImageInputProps()}
                                />
                                {/* {isAuthScreenLeftBackgroundImageDragActive && */}
                                <SettingDropzoneActivePlaceholder
                                  note={
                                    "Recommended: 724×724px | Aspect ratio: 1:1"
                                  }
                                />
                                {/* } */}
                              </div>
                              <div className="mt-2">
                                {(() => {
                                  const logoSrc =
                                    (AuthScreenLeftBackgroundImage as any)
                                      .src || AuthScreenLeftBackgroundImage;

                                  let src = authScreenLeftBackgroundImagePreview
                                    ? authScreenLeftBackgroundImagePreview
                                    : formik.values
                                          .authScreenLeftBackgroundImage
                                      ? formik.values
                                          .authScreenLeftBackgroundImage
                                      : logoSrc;

                                  const isBlobOrAbsolute =
                                    src?.startsWith("blob:") ||
                                    src?.startsWith("http");

                                  if (
                                    !isBlobOrAbsolute &&
                                    !src.startsWith("/")
                                  ) {
                                    src = `${env("API_URL")}/${src}`;
                                  }
                                  return (
                                    <SolidUploadedImage
                                      src={src}
                                      height={400}
                                      width={400}
                                      maxHeight={400}
                                    />
                                  );
                                })()}
                              </div>
                              {formik.values.authScreenLeftBackgroundImage && (
                                <SettingsImageRemoveButton
                                  onClick={removeAuthScreenLeftBackgroundImage}
                                />
                              )}
                            </div>
                          )}
                          {formik.values.authPagesLayout === "right" && (
                            <div>
                              <div
                                {...getAuthScreenRightBackgroundImageRootProps()}
                                className="solid-dropzone-wrapper"
                                style={{ borderRadius: 8 }}
                              >
                                <input
                                  {...getAuthScreenRightBackgroundImageInputProps()}
                                />
                                {/* {isAuthScreenRightBackgroundImageDragActive && */}
                                <SettingDropzoneActivePlaceholder
                                  note={
                                    "Recommended: 724×724px | Aspect ratio: 1:1"
                                  }
                                />
                                {/* } */}
                              </div>
                              <div className="mt-2">
                                {(() => {
                                  const logoSrc =
                                    (AuthScreenRightBackgroundImage as any)
                                      .src || AuthScreenRightBackgroundImage;

                                  let src =
                                    authScreenRightBackgroundImagePreview
                                      ? authScreenRightBackgroundImagePreview
                                      : formik.values
                                            .authScreenRightBackgroundImage
                                        ? formik.values
                                            .authScreenRightBackgroundImage
                                        : logoSrc;

                                  const isBlobOrAbsolute =
                                    src?.startsWith("blob:") ||
                                    src?.startsWith("http");

                                  if (
                                    !isBlobOrAbsolute &&
                                    !src.startsWith("/")
                                  ) {
                                    src = `${env("API_URL")}/${src}`;
                                  }
                                  return (
                                    <SolidUploadedImage
                                      src={src}
                                      height={400}
                                      width={400}
                                      maxHeight={400}
                                    />
                                  );
                                })()}
                              </div>
                              {formik.values.authScreenRightBackgroundImage && (
                                <SettingsImageRemoveButton
                                  onClick={removeAuthScreenRightBackgroundImage}
                                />
                              )}
                            </div>
                          )}
                          {formik.values.authPagesLayout === "center" && (
                            <div>
                              <div
                                {...getAuthScreenCenterBackgroundImageRootProps()}
                                className="solid-dropzone-wrapper"
                                style={{ borderRadius: 8 }}
                              >
                                <input
                                  {...getAuthScreenCenterBackgroundImageInputProps()}
                                />
                                <SettingDropzoneActivePlaceholder
                                  note={
                                    "Recommended: 1440px × 724px | Aspect ratio: 2:1"
                                  }
                                />
                              </div>
                              <div className="mt-2">
                                {(() => {
                                  const logoSrc =
                                    (AuthScreenCenterBackgroundImage as any)
                                      .src || AuthScreenCenterBackgroundImage;

                                  let src =
                                    authScreenCenterBackgroundImagePreview
                                      ? authScreenCenterBackgroundImagePreview
                                      : formik.values
                                            .authScreenCenterBackgroundImage
                                        ? formik.values
                                            .authScreenCenterBackgroundImage
                                        : logoSrc;

                                  const isBlobOrAbsolute =
                                    src?.startsWith("blob:") ||
                                    src?.startsWith("http");

                                                                    if (!isBlobOrAbsolute && !src.startsWith("/")) {
                                                                        src = `${env("API_URL")}/${src}`;
                                                                    }
                                                                    return (
                                                                        <SolidUploadedImage src={src} height={300} width={600} maxHeight={300} />
                                                                    );
                                                                })()}
                                                            </div>
                                                            {formik.values.authScreenCenterBackgroundImage && (
                                                                <SettingsImageRemoveButton onClick={removeAuthScreenCenterBackgroundImage} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <SolidDivider className="my-4" />
                                </>
                            )}

              {pathname.includes("misc-settings") && (
                <>
                  {/* 
                                    <p className='font-bold' style={{ fontSize: 16, color: 'var(--solid-setting-title)' }}>Misc Details</p>
                                    <div className='formgrid grid'>
                                        <div className='col-12 lg:col-10 xl:col-8'>
                                            <div className="formgrid grid">
                                                <div className="col-12 md:col-6 pb-3 md:pb-0">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5 ">
                                                            <label className="form-field-label">Use queue for sending emails</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="shouldQueueEmails"
                                                                checked={formik.values.shouldQueueEmails}
                                                                onChange={(e) => formik.setFieldValue("shouldQueueEmails", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-5 pb-2">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-10 sm:col-9 lg:col-5">
                                                            <label className="form-field-label">Use queue for sending SMS</label>
                                                        </div>
                                                        <div className="col-2 sm:col-3 lg:col-7">
                                                            <InputSwitch
                                                                name="shouldQueueSms"
                                                                checked={formik.values.shouldQueueSms}
                                                                onChange={(e) => formik.setFieldValue("shouldQueueSms", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Divider />
                                 */}
                                    <p className="solid-settings-heading">Contact Support</p>
                                    <div className='formgrid grid'>
                                        <div className="col-12 lg:col-10 xl:col-8">
                                            <div className='formgrid grid'>
                                                <div className="col-12 md:col-6 pb-3 md:pb-0">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Contact Support Email</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <SolidInput
                                                                type="text"
                                                                id="contactSupportEmail"
                                                                name="contactSupportEmail"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.contactSupportEmail ?? ''}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-12 md:col-6">
                                                    <div className="formgrid grid align-items-center">
                                                        <div className="col-12 md:col-5 pb-2 md:pb-0">
                                                            <label className="form-field-label">Display Name</label>
                                                        </div>
                                                        <div className="col-12 md:col-7">
                                                            <SolidInput
                                                                type="text"
                                                                id="contactSupportDisplayName"
                                                                name="contactSupportDisplayName"
                                                                onChange={formik.handleChange}
                                                                value={formik.values.contactSupportDisplayName ?? ''}
                                                                className='w-full'
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {pathname.includes("ai-settings") &&
                                <AiSettingsSection
                                    aiConfig={formik.values.solidXGenAiCodeBuilderConfig as SolidAiConfig}
                                    onAiConfigChange={handleAiConfigChange}
                                />
                            }
                            {pathname.includes("api-keys") && session?.user?.id &&
                                <ApiKeysTab
                                    userId={session.user.id}
                                    canCreate={session?.user?.isAllowedToGenerateApiKeys ?? false}
                                />
                            }
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

interface AiSettingsSectionProps {
  aiConfig: SolidAiConfig;
  onAiConfigChange: (config: SolidAiConfig) => void;
}

const DEFAULT_BEHAVIOR: ModelBehavior = { streaming: false, custom: "" };
const DEFAULT_MODEL_ENTRY: ModelEntry = { providerId: "", model: "", behavior: DEFAULT_BEHAVIOR };

const AiSettingsSection = ({ aiConfig, onAiConfigChange }: AiSettingsSectionProps) => {
    const [activeTab, setActiveTab] = useState<"providers" | "default" | "fast">("providers");
    const [showAddProvider, setShowAddProvider] = useState(false);

    const providers = ensureBuiltInProviders(aiConfig.providers ?? {});

    const tabItems = [
        {
            value: "providers" as const,
            label: "Providers",
            content: (
                <ProvidersTab
                    providers={providers}
                    onProvidersChange={(newProviders) => {
                        onAiConfigChange({ ...aiConfig, providers: newProviders });
                    }}
                    showAddModal={showAddProvider}
                    onAddModalClose={() => setShowAddProvider(false)}
                />
            ),
        },
        {
            value: "default" as const,
            label: "Intelligent Model",
            content: (
                <ModelConfigTab
                    modelEntry={aiConfig.models?.default ?? DEFAULT_MODEL_ENTRY}
                    providers={providers}
                    onModelEntryChange={(entry) => {
                        onAiConfigChange({ ...aiConfig, models: { ...aiConfig.models, default: entry } });
                    }}
                />
            ),
        },
        {
            value: "fast" as const,
            label: "Fast Model",
            content: (
                <ModelConfigTab
                    modelEntry={aiConfig.models?.fast ?? DEFAULT_MODEL_ENTRY}
                    providers={providers}
                    onModelEntryChange={(entry) => {
                        onAiConfigChange({ ...aiConfig, models: { ...aiConfig.models, fast: entry } });
                    }}
                />
            ),
        },
    ];

    return (
        <div>
            <p className="solid-settings-heading" style={{ marginBottom: "1rem" }}>
                AI Model Configuration
            </p>
            <SolidTabGroup
                tabs={tabItems}
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "providers" | "default" | "fast")}
                tabPosition="left"
                extra={
                    activeTab === "providers" ? (
                        <SolidButton size="sm" onClick={() => setShowAddProvider(true)}>
                            Add
                        </SolidButton>
                    ) : undefined
                }
            />
        </div>
    );
};
