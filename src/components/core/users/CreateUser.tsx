import { FetchBaseQueryError } from "@reduxjs/toolkit/dist/query";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { BackButton } from "../../../components/common/BackButton";
import { CancelButton } from "../../../components/common/CancelButton";
import { SolidFormHeader } from "../../../components/common/SolidFormHeader";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { useRouter } from "../../../hooks/useRouter";
import { useRegisterPrivateMutation, useUpdateUserMutation } from "../../../redux/api/authApi";
import { useGetrolesQuery } from "../../../redux/api/roleApi";
import { useDeleteUserMutation } from "../../../redux/api/userApi";
import { showToast } from "../../../redux/features/toastSlice";
import {
  SolidButton,
  SolidCheckbox,
  SolidInput,
  SolidMessage,
  SolidPanel,
  SolidPasswordInput,
  SolidSwitch,
  SolidTabGroup,
} from "../../shad-cn-ui";
import { ApiKeysTab } from "./ApiKeysTab";

interface ErrorResponseData {
  message: string;
  statusCode: number;
  error: string;
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const CreateUser = ({ data, params }: any) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("userDetails");

  const [registerPrivate, { isLoading, error: userCreateError, isSuccess }] = useRegisterPrivateMutation();
  const [
    updateUser,
    {
      isLoading: isUserUpdating,
      isSuccess: isUpdateUserSuccess,
      error: userUpdateError,
    },
  ] = useUpdateUserMutation();

  const [deleteUser, { isLoading: isUserDeleting, isSuccess: isDeleteUserSuccess }] = useDeleteUserMutation();
  const { data: rolesData } = useGetrolesQuery("");

  useEffect(() => {
    if (data?.roles) {
      setSelectedRoles(data.roles.map((role: any) => role.name));
    }
  }, [data]);

  const initialValues = {
    fullName: data?.fullName ?? "",
    username: data?.username ?? "",
    email: data?.email ?? "",
    mobile: data?.mobile ?? "",
    password: "",
    confirmPassword: "",
    failedLoginAttempts: data?.failedLoginAttempts ?? 0,
    isAllowedToGenerateApiKeys: data?.isAllowedToGenerateApiKeys ?? false,
  };

  const validationSchema = Yup.object({
    fullName: Yup.string().required(ERROR_MESSAGES.FIELD_REUQIRED("Full Name")),
    username: Yup.string().required("Username is required"),
    email: Yup.string()
      .email(ERROR_MESSAGES.FIELD_INVALID("email address"))
      .required(ERROR_MESSAGES.FIELD_REUQIRED("Email")),
    password: Yup.string().min(6, ERROR_MESSAGES.PASSWORD_CHARACTER(6)).nullable(),
    confirmPassword: Yup.string().when("password", {
      is: (val: any) => !!val,
      then: (schema) => schema.oneOf([Yup.ref("password")], ERROR_MESSAGES.FIELD_MUST_MATCH("Password")).nullable(),
      otherwise: (schema) => schema.notRequired().nullable(),
    }),
    mobile: Yup.number().required(ERROR_MESSAGES.FIELD_REUQIRED("Mobile")),
    failedLoginAttempts: Yup.number()
      .typeError("Failed Login Attempts must be a number")
      .nullable()
      .transform((value, originalValue) => (originalValue === "" ? null : value)),
  });

  function isFetchBaseQueryErrorWithErrorResponse(
    error: any
  ): error is FetchBaseQueryError & { data: ErrorResponseData } {
    return error && typeof error === "object" && "data" in error && "message" in error.data;
  }

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (data) {
        const userData: any = {
          fullName: values.fullName,
          username: values.username,
          email: values.email,
          mobile: values.mobile,
          roles: selectedRoles,
          failedLoginAttempts: values.failedLoginAttempts,
          isAllowedToGenerateApiKeys: values.isAllowedToGenerateApiKeys,
        };

        if (values.password) {
          userData.password = values.password;
        }

        updateUser({ id: data.id, data: userData });
        return;
      }

      registerPrivate({
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        mobile: values.mobile,
        password: values.password,
        roles: selectedRoles,
        failedLoginAttempts: values.failedLoginAttempts,
        isAllowedToGenerateApiKeys: values.isAllowedToGenerateApiKeys,
      });
    },
  });

  const fieldError = (fieldName: keyof typeof initialValues) =>
    formik.touched[fieldName] && formik.errors[fieldName] ? String(formik.errors[fieldName]) : "";

  const handleCheckboxChange = (roleName: string) => {
    const updatedRoles = selectedRoles.includes(roleName)
      ? selectedRoles.filter((name) => name !== roleName)
      : [...selectedRoles, roleName];

    setSelectedRoles(updatedRoles);
    formik.setFieldTouched("roles", true);
    formik.setFieldValue("roles", updatedRoles);
  };

  useEffect(() => {
    const handleError = (errorToast: any) => {
      let errorMessage: any = [ERROR_MESSAGES.ERROR_OCCURED];

      if (isFetchBaseQueryErrorWithErrorResponse(errorToast)) {
        errorMessage = errorToast.data.message;
      } else {
        errorMessage = [ERROR_MESSAGES.SOMETHING_WRONG];
      }

      const detail = Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage;
      dispatch(showToast({ severity: "error", summary: ERROR_MESSAGES.ERROR, detail }));
    };

    if (userCreateError) handleError(userCreateError);
    if (userUpdateError) handleError(userUpdateError);
  }, [dispatch, userCreateError, userUpdateError]);

  useEffect(() => {
    if (isSuccess || isDeleteUserSuccess || isUpdateUserSuccess) {
      router.back();
    }
  }, [isDeleteUserSuccess, isSuccess, isUpdateUserSuccess, router]);

  const isEditMode = params.id !== "new";
  const isSaving = isLoading || isUserUpdating;


  return (
    <div className="solid-form-wrapper">
      <div className="solid-form-section">
        <form onSubmit={formik.handleSubmit}>
          <div className="solid-form-header flex align-items-center justify-content-between gap-3 flex-wrap">
            <div className="solid-user-form-titleblock flex align-items-center gap-3">
              <BackButton />
              <div>
                <div className="form-wrapper-title">{isEditMode ? "Update User" : "Create User"}</div>
                <p className="solid-user-form-subtitle m-0">
                  {isEditMode
                    ? "Update account details, access roles, and security controls."
                    : "Create a user account and assign the right access roles."}
                </p>
              </div>
            </div>
            <div className="gap-3 flex flex-wrap">
              {formik.dirty ? (
                <SolidButton size="small" type="submit" loading={isSaving}>
                  Save
                </SolidButton>
              ) : null}
              {data ? (
                <SolidButton
                  size="small"
                  type="button"
                  variant="destructive"
                  loading={isUserDeleting}
                  onClick={() => deleteUser(data.id)}
                >
                  Delete
                </SolidButton>
              ) : null}
              <CancelButton />
            </div>
          </div>

          <SolidFormHeader />

          <div className="px-4 py-3 md:p-4 solid-form-content">
            {isEditMode ? (
              <SolidTabGroup
                value={activeTab}
                onValueChange={setActiveTab}
                tabs={[
                  {
                    value: "userDetails",
                    label: "User Details",
                    content: <UserDetailsContent
                      formik={formik}
                      fieldError={fieldError}
                      rolesData={rolesData}
                      selectedRoles={selectedRoles}
                      handleCheckboxChange={handleCheckboxChange}
                      isEditMode={isEditMode}
                    />,
                  },
                  {
                    value: "apiKeys",
                    label: "API Keys",
                    content: <div className="pt-4">
                      <ApiKeysTab
                        userId={data?.id}
                        canCreate={data?.isAllowedToGenerateApiKeys ?? false}
                      />
                    </div>,
                  },
                ]}
              />
            ) : (
              <UserDetailsContent
                formik={formik}
                fieldError={fieldError}
                rolesData={rolesData}
                selectedRoles={selectedRoles}
                handleCheckboxChange={handleCheckboxChange}
                isEditMode={isEditMode}
              />
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

/** Extracted form body so it can be used both inside and outside the tab wrapper */
function UserDetailsContent({
  formik,
  fieldError,
  rolesData,
  selectedRoles,
  handleCheckboxChange,
  isEditMode,
}: {
  formik: any;
  fieldError: (field: any) => string;
  rolesData: any;
  selectedRoles: string[];
  handleCheckboxChange: (roleName: string) => void;
  isEditMode: boolean;
}) {
  return (
    <div className="grid">
      <div className="col-12 lg:col-10 xl:col-8 mx-auto">
        <SolidPanel header="Basic Info" className="solid-column-panel solid-user-form-panel">
          <div className="grid formgrid">
            <div className="field col-12 md:col-6 flex flex-column gap-2">
              <label htmlFor="fullName" className="form-field-label">
                Full Name
              </label>
              <SolidInput
                type="text"
                id="fullName"
                name="fullName"
                autoComplete="off"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.fullName}
                className={cx(fieldError("fullName") && "solid-user-form-input-invalid")}
              />
              {fieldError("fullName") ? <SolidMessage severity="error" text={fieldError("fullName")} /> : null}
            </div>

            <div className="field col-12 md:col-6 flex flex-column gap-2">
              <label htmlFor="username" className="form-field-label">
                Username
              </label>
              <SolidInput
                type="text"
                id="username"
                name="username"
                autoComplete="off"
                disabled={Boolean(formik.values.username) && isEditMode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.username}
                className={cx(fieldError("username") && "solid-user-form-input-invalid")}
              />
              {fieldError("username") ? <SolidMessage severity="error" text={fieldError("username")} /> : null}
            </div>

            <div className="field col-12 md:col-6 flex flex-column gap-2 mt-3">
              <label htmlFor="email" className="form-field-label">
                Email
              </label>
              <SolidInput
                type="email"
                id="email"
                name="email"
                autoComplete="off"
                disabled={isEditMode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={cx(fieldError("email") && "solid-user-form-input-invalid")}
              />
              {fieldError("email") ? <SolidMessage severity="error" text={fieldError("email")} /> : null}
            </div>

            <div className="field col-12 md:col-6 flex flex-column gap-2 mt-3">
              <label htmlFor="mobile" className="form-field-label">
                Mobile
              </label>
              <SolidInput
                type="text"
                id="mobile"
                name="mobile"
                autoComplete="off"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.mobile}
                className={cx(fieldError("mobile") && "solid-user-form-input-invalid")}
              />
              {fieldError("mobile") ? <SolidMessage severity="error" text={fieldError("mobile")} /> : null}
            </div>

            {!isEditMode ? (
              <>
                <div className="field col-12 md:col-6 flex flex-column gap-2 mt-3">
                  <label htmlFor="password" className="form-field-label">
                    Password
                  </label>
                  <SolidPasswordInput
                    id="password"
                    name="password"
                    autoComplete="off"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={cx(fieldError("password") && "solid-user-form-input-invalid")}
                  />
                  {fieldError("password") ? <SolidMessage severity="error" text={fieldError("password")} /> : null}
                </div>

                <div className="field col-12 md:col-6 flex flex-column gap-2 mt-3">
                  <label htmlFor="confirmPassword" className="form-field-label">
                    Confirm Password
                  </label>
                  <SolidPasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="off"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={cx(fieldError("confirmPassword") && "solid-user-form-input-invalid")}
                  />
                  {fieldError("confirmPassword") ? (
                    <SolidMessage severity="error" text={fieldError("confirmPassword")} />
                  ) : null}
                </div>
              </>
            ) : (
              <div className="field col-12 md:col-6 flex flex-column gap-2 mt-3">
                <label htmlFor="failedLoginAttempts" className="form-field-label">
                  Failed Login Attempts
                </label>
                <SolidInput
                  type="number"
                  id="failedLoginAttempts"
                  name="failedLoginAttempts"
                  autoComplete="off"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.failedLoginAttempts}
                  className={cx(fieldError("failedLoginAttempts") && "solid-user-form-input-invalid")}
                />
                {fieldError("failedLoginAttempts") ? (
                  <SolidMessage severity="error" text={fieldError("failedLoginAttempts")} />
                ) : null}
                <p className="solid-user-form-helper">
                  Your account has been locked due to repeated unsuccessful login attempts. Please contact your
                  system admin.
                </p>
              </div>
            )}
          </div>
        </SolidPanel>

        <SolidPanel toggleable header="Access" className="solid-column-panel solid-user-form-panel mt-5">
          <div className="formgrid grid">
            <div className="field col-12 flex align-items-center justify-content-between gap-3">
              <div>
                <p className="form-field-label m-0">Allow API Key Generation</p>
                <p className="solid-user-form-helper m-0 mt-1">
                  When enabled, this user can generate API keys for programmatic access.
                </p>
              </div>
              <SolidSwitch
                checked={formik.values.isAllowedToGenerateApiKeys}
                onChange={(checked) => formik.setFieldValue("isAllowedToGenerateApiKeys", checked)}
              />
            </div>
          </div>
        </SolidPanel>

        <SolidPanel toggleable header="Roles" className="solid-column-panel solid-user-form-panel mt-5">
          <p className="solid-user-form-panel-copy">Select the roles that should be assigned to this user.</p>
          <div className="formgrid grid solid-user-role-grid">
            {rolesData?.data?.records?.map((role: any) => (
              <div key={role.name} className="field col-12 md:col-6 solid-user-role-item">
                <SolidCheckbox
                  id={role.name}
                  checked={selectedRoles.includes(role.name)}
                  onChange={() => handleCheckboxChange(role.name)}
                  label={role.name}
                />
              </div>
            ))}
          </div>
        </SolidPanel>
      </div>
    </div>
  );
}

export default CreateUser;
