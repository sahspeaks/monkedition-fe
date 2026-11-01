import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("working");
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    api
      .post("/api/v2/unsubscribe", { email: params.get("email"), token: params.get("token") }, { auth: false })
      .then(() => setStatus("done"))
      .catch(() => setStatus("failed"));
  }, [params]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900">Email reminders</h1>
        <p className="text-sm text-gray-600">
          {status === "working" && "Updating your preferences..."}
          {status === "done" && "You will not get cart reminders any more. We will still email you about your orders."}
          {status === "failed" && "This link is not valid. Please contact us and we will sort it out."}
        </p>
        <Link to="/" className="inline-block text-sm text-orange-700 hover:underline">Back to the shop</Link>
      </div>
    </div>
  );
};

export default Unsubscribe;
