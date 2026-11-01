import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setError("");
    setStatus("saving");
    try {
      await resetPassword(token, password);
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err.message || "Could not reset your password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
        {!token && <p className="text-sm text-red-600">This link is invalid or has expired.</p>}
        {token && status === "done" && (
          <p className="text-sm text-gray-600">Your password has been changed. Please sign in.</p>
        )}
        {token && status !== "done" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={status === "saving"}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-orange-400 text-black disabled:opacity-50"
            >
              {status === "saving" ? "Saving..." : "Change password"}
            </button>
          </form>
        )}
        <Link to="/login" className="block text-sm text-orange-700 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
