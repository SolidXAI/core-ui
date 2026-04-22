import { useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { useDeleteMediaMutation } from "../../../../redux/api/mediaApi";
import { useGetUserQuery, useUpdateUserProfileMutation } from "../../../../redux/api/userApi";
import { useSession } from "../../../../hooks/useSession";
import { ERROR_MESSAGES } from "../../../../constants/error-messages";
import { SolidButton } from "../../../shad-cn-ui/SolidButton";
import styles from "./SolidAccountSettings.module.css";

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
      ? styles.toastError
      : toast.severity === "success"
        ? styles.toastSuccess
        : toast.severity === "warn"
          ? styles.toastWarn
          : styles.toastInfo;

  return (
    <div className={`${styles.toast} ${severityClass}`} role="status" aria-live="polite">
      <div>
        <div className={styles.toastTitle}>{toast.summary}</div>
        <div className={styles.toastBody}>{toast.detail}</div>
      </div>
      <button type="button" className={styles.toastClose} onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
};

const ConfirmDialog = ({
  visible,
  title,
  text,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!visible) return null;
  return (
    <div className={styles.confirmBackdrop} role="presentation" onClick={onCancel}>
      <div
        className={styles.confirmModal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.confirmHeader}>{title}</div>
        <div className={styles.confirmBody}>{text}</div>
        <div className={styles.confirmActions}>
          <SolidButton size="sm" variant="destructive" onClick={onConfirm}>
            Confirm
          </SolidButton>
          <SolidButton size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </SolidButton>
        </div>
      </div>
    </div>
  );
};

export const SolidPersonalInfo = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [replaceDialogVisible, setReplaceDialogVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: userData, refetch } = useGetUserQuery(userId, { skip: !userId });
  const [deleteMedia] = useDeleteMediaMutation();
  const [updateUser] = useUpdateUserProfileMutation();

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

  const initialValues = useMemo(
    () => ({
      fullName: userData?.data?.fullName ?? "",
      profilePicture: userData?.data?._media?.profilePicture?.[0]?._full_url ?? null,
    }),
    [userData]
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();
        if (values.fullName !== initialValues.fullName) {
          formData.append("fullName", values.fullName);
        }
        if (values.profilePicture && values.profilePicture instanceof File) {
          formData.append("profilePicture", values.profilePicture);
        }

        if (!formData.has("fullName") && !formData.has("profilePicture")) {
          notify("info", ERROR_MESSAGES.NO_CHANGE, ERROR_MESSAGES.NO_UPDATE_MADE);
          return;
        }

        const response = await updateUser({ data: formData }).unwrap();
        if (response?.statusCode === 200) {
          notify("success", ERROR_MESSAGES.PROFILE_SAVED, ERROR_MESSAGES.PROFILE_SAVED_SUCCESSFULLY);
          refetch();
          formik.resetForm();
          setPreviewImage(null);
        } else {
          notify("error", ERROR_MESSAGES.FAILED, ERROR_MESSAGES.FAILED_UPDATED_PROFILE);
        }
      } catch {
        notify("error", ERROR_MESSAGES.FAILED, ERROR_MESSAGES.SOMETHING_WRONG);
      }
    },
  });

  const initials = useMemo(() => {
    const value = userData?.data?.email || "";
    if (!value) return "U";
    const email = value.includes("@") ? value.split("@")[0] : value;
    return email[0]?.toUpperCase() || "U";
  }, [userData]);

  const avatarBg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 60%)`;
  }, [initials]);

  const liveAvatarUrl = previewImage || userData?.data?._media?.profilePicture?.[0]?._full_url || null;
  const roleLabels = userData?.data?.roles?.map((role: any) => role.name) || [];

  const handleFileChange = (file: File) => {
    const existing = userData?.data?._media?.profilePicture?.[0];
    if (existing) {
      setPendingFile(file);
      setReplaceDialogVisible(true);
      return;
    }
    formik.setFieldValue("profilePicture", file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleDeleteAvatar = () => {
    const existing = userData?.data?._media?.profilePicture?.[0];
    if (existing) {
      setDeleteDialogVisible(true);
      return;
    }
    formik.setFieldValue("profilePicture", null);
    setPreviewImage(null);
  };

  const confirmReplace = async () => {
    const existing = userData?.data?._media?.profilePicture?.[0];
    try {
      if (existing?.id) {
        await deleteMedia(existing.id).unwrap();
      }
      if (pendingFile) {
        formik.setFieldValue("profilePicture", pendingFile);
        setPreviewImage(URL.createObjectURL(pendingFile));
        setTimeout(() => {
          formik.submitForm();
        }, 0);
      }
    } catch {
      notify("error", ERROR_MESSAGES.FAILED, ERROR_MESSAGES.FAILED_DELETED_IMAGE);
    } finally {
      setReplaceDialogVisible(false);
      setPendingFile(null);
    }
  };

  const confirmDelete = async () => {
    const existing = userData?.data?._media?.profilePicture?.[0];
    if (existing?.id) {
      try {
        await deleteMedia(existing.id).unwrap();
        notify("success", ERROR_MESSAGES.DELETED, ERROR_MESSAGES.PROFILE_PICTURE_REMOVE);
        refetch();
      } catch {
        notify("error", ERROR_MESSAGES.ERROR, ERROR_MESSAGES.FAILED_DELETED_IMAGE);
      }
    }

    formik.setFieldValue("profilePicture", null);
    setPreviewImage(null);
    setDeleteDialogVisible(false);
  };

  return (
    <>
      <form onSubmit={formik.handleSubmit} className={styles.accountForm}>
        <ToastMessage toast={toast} onClose={() => setToast(null)} />

        <div className={styles.accountScroll}>
          <div className={styles.sectionTitle}>Profile Picture</div>

          <div className={styles.avatarRow}>
            <div className={styles.avatarShell}>
              {liveAvatarUrl ? (
                <img src={liveAvatarUrl} alt="Profile" className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarFallback} style={{ backgroundColor: avatarBg }}>
                  {initials}
                </span>
              )}

              {liveAvatarUrl ? (
                <button
                  type="button"
                  className={styles.avatarRemove}
                  onClick={handleDeleteAvatar}
                  aria-label="Delete profile picture"
                >
                  ×
                </button>
              ) : null}
            </div>

            <SolidButton
              type="button"
              size="sm"
              variant="outline"
              className={styles.accountSecondaryBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Avatar
            </SolidButton>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.svg"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFileChange(file);
                event.currentTarget.value = "";
              }}
            />
          </div>

          <div className={styles.dashedDivider} />

          <div className={styles.sectionTitle}>Details</div>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="fullName">Name</label>
              <input
                id="fullName"
                name="fullName"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" disabled value={userData?.data?.email || ""} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label htmlFor="mobile">Contact Number</label>
              <input id="mobile" disabled value={userData?.data?.mobile || ""} className={styles.input} />
            </div>

            <div className={styles.field}>
              <label>Role</label>
              <div className={styles.roleBox}>
                {roleLabels.map((name: string) => (
                  <span key={name} className={styles.roleChip}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerActions}>
          <SolidButton type="submit" size="sm" loading={formik.isSubmitting}>
            Save
          </SolidButton>
        </div>
      </form>

      <ConfirmDialog
        visible={replaceDialogVisible}
        title="Replace Profile Picture"
        text="Do you want to replace the existing profile picture?"
        onConfirm={confirmReplace}
        onCancel={() => {
          setReplaceDialogVisible(false);
          setPendingFile(null);
        }}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Profile Picture"
        text="Do you want to delete your profile picture?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    </>
  );
};
