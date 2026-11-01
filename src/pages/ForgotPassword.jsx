import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await requestPasswordReset(email.trim());
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
        {status === "sent" ? (
          <p className="text-sm text-gray-600">
            If that email is registered, a reset link is on its way. It expires in 30 minutes.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </div>
            {status === "error" && (
              <p className="text-xs text-red-600">Something went wrong. Please try again.</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-orange-500 text-black disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send reset link"}
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

export default ForgotPassword;
