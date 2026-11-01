import { useState } from "react";
import { useAuth } from "../context/NewAuthContext";
import { changePassword, logoutEverywhere, resendVerificationEmail } from "../api/auth";
import { Title } from "./Title";

const passwordMessage = (err) =>
  err.body?.errors?.[0]?.path === "currentPassword"
    ? "Your current password is incorrect."
    : err.message || "Could not change your password. Please try again.";

const AccountSecurity = () => {
  const { user, logout } = useAuth();
  const [resendStatus, setResendStatus] = useState("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const resend = async () => {
    setResendStatus("sending");
    try {
      await resendVerificationEmail();
      setResendStatus("sent");
    } catch {
      setResendStatus("failed");
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setDone("Your password has been changed. Please sign in again.");
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setError(passwordMessage(err));
      setBusy(false);
    }
  };

  const signOutEverywhere = async () => {
    if (!window.confirm("Sign out on all your devices, including this one?")) return;
    setBusy(true);
    setError("");
    try {
      await logoutEverywhere();
      logout();
    } catch (err) {
      setError(err.message || "Could not sign you out. Please try again.");
      setBusy(false);
    }
  };

  return (
    <section className="mt-8 space-y-6">
      <div className="text-xl">
        <Title text1="ACCOUNT" text2="SECURITY" />
      </div>

      {user?.emailVerified === false && (
        <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded text-sm">
          <p className="text-gray-800">Your email address is not verified yet.</p>
          {resendStatus === "sent" ? (
            <p className="mt-1 text-gray-700">A new link is on its way to {user.email}.</p>
          ) : (
            <button
              type="button"
              disabled={resendStatus === "sending"}
              onClick={resend}
              className="mt-1 text-orange-700 hover:underline disabled:opacity-50"
            >
              {resendStatus === "sending" ? "Sending..." : "Send a new verification link"}
            </button>
          )}
          {resendStatus === "failed" && (
            <p className="mt-1 text-red-600">Could not send the link. Please try again later.</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-green-700">{done}</p>}

      {user?.hasPassword && (
        <form onSubmit={submitPassword} className="space-y-3">
          <p className="font-medium text-gray-800">Change password</p>
          {[
            ["Current password", currentPassword, setCurrentPassword, "current-password"],
            ["New password", newPassword, setNewPassword, "new-password"],
            ["Confirm new password", confirm, setConfirm, "new-password"],
          ].map(([title, value, setValue, autoComplete]) => (
            <label key={title} className="block text-sm text-gray-700">
              {title}
              <input
                type="password"
                required
                autoComplete={autoComplete}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              />
            </label>
          ))}
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 text-sm bg-orange-500 text-black rounded disabled:opacity-50"
          >
            Change password
          </button>
        </form>
      )}

      <div>
        <p className="font-medium text-gray-800">Other devices</p>
        <button
          type="button"
          disabled={busy}
          onClick={signOutEverywhere}
          className="mt-2 px-4 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
        >
          Sign out everywhere
        </button>
      </div>
    </section>
  );
};

export default AccountSecurity;
