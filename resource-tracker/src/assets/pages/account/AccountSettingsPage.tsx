import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, Eye, EyeOff, KeyRound, Mail, MapPin, PencilLine, Phone, Shield, UsersRound, UserRound, VenusAndMars, Trash2, X } from "lucide-react";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { usersApi, type PreferredPronoun } from "../../data/api-services";
import { isApiRecord, unwrapApiResponse } from "../../data/api-response";
import styles from "./AccountSettingsPage.module.css";

interface ProfileFields {
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  preferredPronoun: PreferredPronoun | "";
}

const emptyProfile: ProfileFields = {
  phoneNumber: "",
  address: "",
  dateOfBirth: "",
  preferredPronoun: "",
};

type AccountDialog = "profile" | "password" | null;

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function responseMessage(value: unknown, fallback: string) {
  const unwrapped = unwrapApiResponse(value);
  return isApiRecord(unwrapped) && typeof unwrapped.message === "string"
    ? unwrapped.message
    : fallback;
}

function displayValue(value?: string | null) {
  return value?.trim() || "Not provided";
}

function displayDate(value?: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function displayRole(value?: string | null) {
  return value
    ? value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    : "Not provided";
}

export default function AccountSettingsPage() {
  const { user, refreshSession } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeDialog, setActiveDialog] = useState<AccountDialog>(null);
  const [profile, setProfile] = useState<ProfileFields>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, next: false, confirm: false });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (activeDialog && !dialog.open) dialog.showModal();
    else if (!activeDialog && dialog.open) dialog.close();
  }, [activeDialog]);

  useEffect(() => {
    if (!activeDialog) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setActiveDialog(null);
    }

    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [activeDialog]);

  function openProfileDialog() {
    setProfile({
      phoneNumber: user?.phoneNumber ?? "",
      address: user?.address ?? "",
      dateOfBirth: user?.dateOfBirth?.slice(0, 10) ?? "",
      preferredPronoun:
        user?.preferredPronoun === "Mr." ||
        user?.preferredPronoun === "Mrs." ||
        user?.preferredPronoun === "Miss"
          ? user.preferredPronoun
          : "",
    });
    setProfileError("");
    setProfileSuccess("");
    setActiveDialog("profile");
  }

  function openPasswordDialog() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
    setVisiblePasswords({ current: false, next: false, confirm: false });
    setActiveDialog("password");
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    const input = {
      action: "update_profile" as const,
      ...(profile.phoneNumber.trim() && { phoneNumber: profile.phoneNumber.trim() }),
      ...(profile.address.trim() && { address: profile.address.trim() }),
      ...(profile.dateOfBirth && { dateOfBirth: profile.dateOfBirth }),
      ...(profile.preferredPronoun && { preferredPronoun: profile.preferredPronoun }),
    };
    if (Object.keys(input).length === 1) {
      setProfileError("Enter at least one profile field to update.");
      return;
    }
    setProfileLoading(true);
    try {
      const result = await usersApi.updateMyAccount(input);
      await refreshSession();
      setProfileSuccess(responseMessage(result, "Profile updated successfully."));
      setActiveDialog(null);
    } catch (error) {
      setProfileError(messageFrom(error, "Your profile could not be updated."));
    } finally {
      setProfileLoading(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword.length < 8 || newPassword.length > 12 || !/\d/.test(newPassword)) {
      setPasswordError("The new password must be 8-12 characters and include a digit.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The new password and confirmation do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const result = await usersApi.updateMyAccount({
        action: "change_password",
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(responseMessage(result, "Password changed successfully."));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setActiveDialog(null);
    } catch (error) {
      setPasswordError(messageFrom(error, "Your password could not be changed."));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function deleteAccount() {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const result = await usersApi.deleteMyAccount();
      setDeleteMessage(result.message || "Account deletion was scheduled.");
      setDeleteOpen(false);
    } catch (error) {
      setDeleteError(messageFrom(error, "Account deletion could not be scheduled."));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <main className={`rt-root ${styles.page}`}>
      <PageHeader title="My account" description="View and manage your account details." />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <div className={styles.panelHeading}>
          <div>
            <h2>User details</h2>
            <p className={styles.identity}>Your account information and security settings.</p>
          </div>
        </div>
        {(profileSuccess || passwordSuccess || deleteMessage) && (
          <p className={styles.success} role="status">
            {profileSuccess || passwordSuccess || deleteMessage}
          </p>
        )}
        <dl className={styles.details}>
          <div className={styles.detail}>
            <dt><UserRound aria-hidden="true" size={15} />Full name</dt>
            <dd>{displayValue(user?.fullName)}</dd>
          </div>
          <div className={styles.detail}>
            <dt><Mail aria-hidden="true" size={15} />Email</dt>
            <dd>{displayValue(user?.email)}</dd>
          </div>
          <div className={styles.detail}>
            <dt><Shield aria-hidden="true" size={15} />Role</dt>
            <dd>{displayRole(user?.role)}</dd>
          </div>
          <div className={styles.detail}>
            <dt><Phone aria-hidden="true" size={15} />Phone number</dt>
            <dd className={styles.indentedValue}>{displayValue(user?.phoneNumber)}</dd>
          </div>
          <div className={styles.detail}>
            <dt><MapPin aria-hidden="true" size={15} />Address</dt>
            <dd className={styles.indentedValue}>{displayValue(user?.address)}</dd>
          </div>
          <div className={styles.detail}>
            <dt><CalendarDays aria-hidden="true" size={15} />Date of birth</dt>
            <dd>{displayDate(user?.dateOfBirth)}</dd>
          </div>
          <div className={styles.detail}>
            <dt><VenusAndMars aria-hidden="true" size={15} />Preferred pronoun</dt>
            <dd className={styles.indentedValue}>{displayValue(user?.preferredPronoun)}</dd>
          </div>
          {user?.department && (
            <div className={styles.detail}>
              <dt><UsersRound aria-hidden="true" size={15} />Department</dt>
              <dd>{user.department}</dd>
            </div>
          )}
          {user?.team && (
            <div className={styles.detail}>
              <dt><UsersRound aria-hidden="true" size={15} />Team</dt>
              <dd>{user.team}</dd>
            </div>
          )}
        </dl>
        <div className={styles.operations} aria-label="Account operations">
          <button type="button" className={`rt-root rt-btn rt-btn--outline ${styles.operation}`} onClick={openProfileDialog}>
            <PencilLine aria-hidden="true" size={17} />
            Edit user info
          </button>
          <button type="button" className={`rt-root rt-btn rt-btn--outline ${styles.operation}`} onClick={openPasswordDialog}>
            <KeyRound aria-hidden="true" size={17} />
            Change password
          </button>
          <button type="button" className={`rt-root rt-btn rt-btn--danger ${styles.operation}`} onClick={() => { setDeleteError(""); setDeleteOpen(true); }} disabled={Boolean(deleteMessage)}>
            <Trash2 aria-hidden="true" size={17} />
            Delete account
          </button>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="account-dialog-title"
        onCancel={() => setActiveDialog(null)}
        onClose={() => setActiveDialog(null)}
      >
        <div className={styles.dialogHeader}>
          <h2 id="account-dialog-title">
            {activeDialog === "profile" ? "Edit user info" : "Change password"}
          </h2>
          <button type="button" className={styles.closeButton} aria-label="Close dialog" onClick={() => setActiveDialog(null)}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        {activeDialog === "profile" && (
          <form className={styles.form} onSubmit={submitProfile}>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Phone number</span>
                <input type="tel" maxLength={30} placeholder="Enter your phone number" value={profile.phoneNumber} onChange={(event) => setProfile({ ...profile, phoneNumber: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Address</span>
                <input maxLength={255} placeholder="Enter your address" value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Date of birth</span>
                <input type="date" value={profile.dateOfBirth} onChange={(event) => setProfile({ ...profile, dateOfBirth: event.target.value })} />
              </label>
              <label className={styles.field}>
                <span>Preferred pronoun</span>
                <select value={profile.preferredPronoun} onChange={(event) => setProfile({ ...profile, preferredPronoun: event.target.value as PreferredPronoun | "" })}>
                  <option value="">Select</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Miss">Miss</option>
                </select>
              </label>
            </div>
            {profileError && <p className={styles.error} role="alert">{profileError}</p>}
            <div className={styles.dialogActions}>
              <button type="button" className="rt-root rt-btn rt-btn--outline" onClick={() => setActiveDialog(null)} disabled={profileLoading}>Cancel</button>
              <button className="rt-root rt-btn rt-btn--primary" type="submit" disabled={profileLoading}>{profileLoading ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        )}
        {activeDialog === "password" && (
          <form className={styles.form} onSubmit={submitPassword}>
            <label className={styles.field}>
              <span>Current password</span>
              <div className={styles.passwordControl}>
                <input type={visiblePasswords.current ? "text" : "password"} placeholder="Enter your current password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                <button type="button" aria-label={visiblePasswords.current ? "Hide current password" : "Show current password"} aria-pressed={visiblePasswords.current} onClick={() => setVisiblePasswords((visible) => ({ ...visible, current: !visible.current }))}>{visiblePasswords.current ? <EyeOff /> : <Eye />}</button>
              </div>
            </label>
            <label className={styles.field}>
              <span>New password</span>
              <div className={styles.passwordControl}>
                <input type={visiblePasswords.next ? "text" : "password"} placeholder="Enter a new password" autoComplete="new-password" minLength={8} maxLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                <button type="button" aria-label={visiblePasswords.next ? "Hide new password" : "Show new password"} aria-pressed={visiblePasswords.next} onClick={() => setVisiblePasswords((visible) => ({ ...visible, next: !visible.next }))}>{visiblePasswords.next ? <EyeOff /> : <Eye />}</button>
              </div>
              <small>Use 8 to 12 characters and include a digit.</small>
            </label>
            <label className={styles.field}>
              <span>Confirm new password</span>
              <div className={styles.passwordControl}>
                <input type={visiblePasswords.confirm ? "text" : "password"} placeholder="Confirm your new password" autoComplete="new-password" minLength={8} maxLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                <button type="button" aria-label={visiblePasswords.confirm ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={visiblePasswords.confirm} onClick={() => setVisiblePasswords((visible) => ({ ...visible, confirm: !visible.confirm }))}>{visiblePasswords.confirm ? <EyeOff /> : <Eye />}</button>
              </div>
            </label>
            {passwordError && <p className={styles.error} role="alert">{passwordError}</p>}
            <div className={styles.dialogActions}>
              <button type="button" className="rt-root rt-btn rt-btn--outline" onClick={() => setActiveDialog(null)} disabled={passwordLoading}>Cancel</button>
              <button className="rt-root rt-btn rt-btn--primary" type="submit" disabled={passwordLoading}>{passwordLoading ? "Updating..." : "Change password"}</button>
            </div>
          </form>
        )}
      </dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete your account?"
        message={deleteError || "Account deletion is scheduled five days after you request it. Logging in during that period cancels the request."}
        confirmLabel="Delete account"
        cancelLabel="Keep account"
        destructive
        loading={deleteLoading}
        onConfirm={() => void deleteAccount()}
        onCancel={() => !deleteLoading && setDeleteOpen(false)}
      />
    </main>
  );
}
