import { ChangeEventHandler, FocusEventHandler, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { handleLogout } from "../../../../adapters/auth/handleLogout";
import { env } from "../../../../adapters/env";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { useSession } from "../../../../hooks/useSession";
import { useChangePasswordMutation } from "../../../../redux/api/authApi";
import { SolidPasswordHelperText } from "../SolidPasswordHelperText";
import { SolidButton } from "../../../shad-cn-ui/SolidButton";
import "./solid-account-settings.css";

type ToastState = {
  id: number;
  severity: "success" | "error" | "info" | "warn";
  summary: string;
  detail: string;
  sticky?: boolean;
  life?: number;
} | null;

const ToastMessage = ({ toast, onClose }: { toast: ToastState; onClose: () => void }) => {
  if (!toast) return null;
  const severityClass =
    toast.severity === "error"
      ? "solid-account-settings-toast-error"
      : toast.severity === "success"
        ? "solid-account-settings-toast-success"
        : toast.severity === "warn"
          ? "solid-account-settings-toast-warn"
          : "solid-account-settings-toast-info";

  return (
    <div className={`${"solid-account-settings-toast"} ${severityClass}`} role="status" aria-live="polite">
      <div>
        <div className={"solid-account-settings-toast-title"}>{toast.summary}</div>
        <div className={"solid-account-settings-toast-body"}>{toast.detail}</div>
      </div>
      <button type="button" className={"solid-account-settings-toast-close"} onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
};

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
}: {
  id: string;
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur: FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className={"solid-account-settings-password-wrap"}>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        className={"solid-account-settings-input"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      <button
        type="button"
        className={"solid-account-settings-password-toggle"}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
};

export const SolidChangePassword = ({ solidSettingsData }: any) => {
  const [toast, setToast] = useState<ToastState>(null);
  const [changePassword] = useChangePasswordMutation();
  const session: any = useSession();

  const notify = (
    severity: "success" | "error" | "info" | "warn",
    summary: string,
    detail: string,
    opts?: { sticky?: boolean; life?: number }
  ) => {
    setToast({
      id: Date.now(),
      severity,
      summary,
      detail,
      sticky: opts?.sticky,
      life: opts?.life ?? 3000,
    });
  };

  const envPasswordRegex = env("NEXT_PUBLIC_PASSWORD_REGEX");

  const effectiveRegex = useMemo(() => {
    try {
      const backendRegex = solidSettingsData?.data?.authenticationPasswordRegex;
      if (backendRegex) return new RegExp(backendRegex);
      if (envPasswordRegex) {
        const unescaped = JSON.parse(`"${envPasswordRegex}"`);
        return new RegExp(unescaped);
      }
    } catch (error) {
      console.error(ERROR_MESSAGES.INVALID_PASSWORD_REGX, error);
    }
    return null;
  }, [solidSettingsData, envPasswordRegex]);

  const validationSchema = useMemo(() => {
    const newPasswordValidation = effectiveRegex
      ? Yup.string()
        .matches(
          effectiveRegex,
          solidSettingsData?.data?.authenticationPasswordRegexErrorMessage || ERROR_MESSAGES.PASSWORD_DO_NOT_MEET
        )
        .required(ERROR_MESSAGES.FIELD_REUQIRED("New password"))
      : Yup.string().min(6, ERROR_MESSAGES.PASSWORD_CHARACTER(6)).required(ERROR_MESSAGES.FIELD_REUQIRED("New password"));

    return Yup.object({
      email: Yup.string().email(ERROR_MESSAGES.FIELD_INAVLID_FORMAT("email")).required(ERROR_MESSAGES.FIELD_REUQIRED("Email")),
      currentPassword: Yup.string().min(6, ERROR_MESSAGES.PASSWORD_CHARACTER(6)).required(ERROR_MESSAGES.FIELD_REUQIRED("Current password")),
      newPassword: newPasswordValidation,
      confirmPassword: Yup.string().oneOf([Yup.ref("newPassword")], ERROR_MESSAGES.MUST_MATCH).required(ERROR_MESSAGES.FIELD_REUQIRED("Confirm password")),
      id: Yup.number().required(ERROR_MESSAGES.FIELD_INAVLID_FORMAT("User ID")),
    });
  }, [effectiveRegex, solidSettingsData]);

  const formik = useFormik({
    initialValues: {
      email: session?.data?.user?.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      id: session?.data?.user?.id,
    },
    validationSchema,
    onSubmit: async (values, { setErrors, resetForm }) => {
      try {
        const payload = {
          id: values.id,
          email: session?.data?.user?.email,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        };

        const response = await changePassword(payload).unwrap();
        if (response?.error) {
          notify("error", ERROR_MESSAGES.ERROR, response.error);
          setErrors({
            currentPassword: ERROR_MESSAGES.INCORRECT_CURRENT,
            newPassword: ERROR_MESSAGES.MUST_MATCH,
            confirmPassword: ERROR_MESSAGES.MUST_MATCH,
          });
          return;
        }

        notify("success", ERROR_MESSAGES.PASSWORD_CHANGE, ERROR_MESSAGES.PASSWORD_CHANGE);
        resetForm();
        handleLogout();
      } catch (err: any) {
        notify("error", err?.data?.message || ERROR_MESSAGES.ERROR, err?.data?.data?.message || err?.data?.message || ERROR_MESSAGES.SOMETHING_WRONG);
      }
    },
  });

  const fieldError = (field: string) => {
    if (!formik.touched[field as keyof typeof formik.touched]) return null;
    const error = formik.errors[field as keyof typeof formik.errors];
    return typeof error === "string" ? error : null;
  };

  const isChangePasswordDisabled = !formik.dirty || !formik.isValid || formik.isSubmitting;

  return (
    <form onSubmit={formik.handleSubmit} className={"solid-account-settings-account-form"}>
      <ToastMessage toast={toast} onClose={() => setToast(null)} />

      <div className={"solid-account-settings-account-scroll"}>
        <div className={"solid-account-settings-form-stack"}>
          <div className={"solid-account-settings-field"}>
            <label htmlFor="currentPassword">Current Password</label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {fieldError("currentPassword") ? <p className={"solid-account-settings-error-text"}>{fieldError("currentPassword")}</p> : null}
          </div>

          <div className={"solid-account-settings-field"}>
            <label htmlFor="newPassword">New Password</label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {fieldError("newPassword") ? <p className={"solid-account-settings-error-text"}>{fieldError("newPassword")}</p> : null}
          </div>

          <div className={"solid-account-settings-field"}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {fieldError("confirmPassword") ? <p className={"solid-account-settings-error-text"}>{fieldError("confirmPassword")}</p> : null}
          </div>
        </div>

        <div className={"solid-account-settings-password-hint-wrap"}>
          <SolidPasswordHelperText text={solidSettingsData?.data?.authenticationPasswordComplexityDescription} />
        </div>
      </div>

      <div className={"solid-account-settings-footer-actions"}>
        <SolidButton type="submit" size="sm" loading={formik.isSubmitting} disabled={isChangePasswordDisabled}>
          Change Password
        </SolidButton>
      </div>
    </form>
  );
};
