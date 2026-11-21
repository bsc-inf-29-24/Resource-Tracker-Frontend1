import { useEffect, useRef, useState, type FormEvent } from "react";
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

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function responseMessage(value: unknown, fallback: string) {
  const unwrapped = unwrapApiResponse(value);
  return isApiRecord(unwrapped) && typeof unwrapped.message === "string"
    ? unwrapped.message
    : fallback;
}

export default function AccountSettingsPage() {
  const { user, refreshSession } = useAuth();
  const initializedProfile = useRef(false);
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    if (!user || initializedProfile.current) return;
    initializedProfile.current = true;
    setProfile({
      phoneNumber: user.phoneNumber ?? "",
      address: user.address ?? "",
      dateOfBirth: user.dateOfBirth?.slice(0, 10) ?? "",
      preferredPronoun:
        user.preferredPronoun === "Mr." ||
        user.preferredPronoun === "Mrs." ||
        user.preferredPronoun === "Miss"
          ? user.preferredPronoun
          : "",
    });
  }, [user]);

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
      setPasswordError("The new password must be 8–12 characters and include a digit.");
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
      setDeleteMessage(result.message);
      setDeleteOpen(false);
    } catch (error) {
      setDeleteError(messageFrom(error, "Account deletion could not be scheduled."));
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <main className={`rt-root ${styles.page}`}>
      <PageHeader title="My account" description="Manage your profile and account security." />
      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Profile information</h2>
        <p className={styles.identity}>{user?.fullName} · {user?.email}</p>
        <form className={styles.form} onSubmit={submitProfile}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Phone number</span>
              <input maxLength={30} value={profile.phoneNumber} onChange={(event) => setProfile({ ...profile, phoneNumber: event.target.value })} />
            </label>
            <label className={styles.field}>
              <span>Address</span>
              <input maxLength={255} value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
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
          <p className={styles.note}>The backend profile lookup does not currently return these editable fields, so they may not be prefilled after signing in again.</p>
          {profileError && <p className={styles.error} role="alert">{profileError}</p>}
          {profileSuccess && <p className={styles.success} role="status">{profileSuccess}</p>}
          <button className="rt-root rt-btn rt-btn--primary" type="submit" disabled={profileLoading}>{profileLoading ? "Saving…" : "Save profile"}</button>
        </form>
      </section>

      <section className={`rt-root rt-card ${styles.panel}`}>
        <h2>Change password</h2>
        <form className={styles.form} onSubmit={submitPassword}>
          <div className={styles.grid}>
            <label className={styles.field}><span>Current password</span><input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <label className={styles.field}><span>New password</span><input type="password" autoComplete="new-password" minLength={8} maxLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><small>8–12 characters and at least one digit.</small></label>
            <label className={styles.field}><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} maxLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          </div>
          {passwordError && <p className={styles.error} role="alert">{passwordError}</p>}
          {passwordSuccess && <p className={styles.success} role="status">{passwordSuccess}</p>}
          <button className="rt-root rt-btn rt-btn--primary" type="submit" disabled={passwordLoading}>{passwordLoading ? "Updating…" : "Change password"}</button>
        </form>
      </section>

      <section className={`rt-root rt-card ${styles.panel} ${styles.danger}`}>
        <h2>Delete account</h2>
        <p>Account deletion is scheduled five days after you request it. Logging in during that period cancels the request.</p>
        {deleteMessage && <p className={styles.success} role="status">{deleteMessage}</p>}
        {deleteError && <p className={styles.error} role="alert">{deleteError}</p>}
        <button type="button" className="rt-root rt-btn rt-btn--danger" onClick={() => setDeleteOpen(true)} disabled={Boolean(deleteMessage)}>Request account deletion</button>
      </section>
      <ConfirmDialog open={deleteOpen} title="Schedule account deletion?" message="The backend schedules deletion after five days. Logging in during that period cancels the request." confirmLabel="Schedule deletion" cancelLabel="Keep account" destructive loading={deleteLoading} onConfirm={() => void deleteAccount()} onCancel={() => !deleteLoading && setDeleteOpen(false)} />
    </main>
  );
}
