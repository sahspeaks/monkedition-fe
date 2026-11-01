import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../api/auth";
import { useAuth } from "../context/NewAuthContext";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState(token ? "checking" : "failed");
  // The token works once, and StrictMode runs effects twice in development.
  const sent = useRef(false);
  const { user, fetchUser } = useAuth();

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    verifyEmail(token)
      .then(() => {
        setStatus("verified");
        if (user) fetchUser().catch(() => {});
      })
      .catch(() => setStatus("failed"));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 space-y-5 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Confirm your email</h1>
        <p className="text-sm text-gray-600">
          {status === "checking" && "Confirming your email..."}
          {status === "verified" && "Your email is confirmed. Thank you!"}
          {status === "failed" && "This link is invalid or has expired."}
        </p>
        <Link to="/" className="block text-sm text-orange-700 hover:underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
