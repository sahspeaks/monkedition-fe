import React from "react";
import { useNavigate, useParams } from "react-router-dom";

const SuccessPage = () => {
  const navigate = useNavigate();
  const { qiKinkOrderId } = useParams();
  console.log(qiKinkOrderId);

  return (
    <div className="py-20 flex flex-col justify-center items-center bg-gray-100 px-6">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        {/* ✅ Animated Checkmark */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-500 text-white flex items-center justify-center rounded-full shadow-lg animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              width="48"
              height="48"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* 🎉 Success Message */}
        <h2 className="text-2xl font-bold text-gray-800 mt-6">
          Order Successful!
        </h2>
        <p className="text-gray-600 mt-2">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        {/* 📦 Order Details (Example) */}
        <div className="mt-4 bg-gray-100 p-4 rounded-md">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Order ID:</span> {qiKinkOrderId}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Estimated Delivery:</span> 3-5
            Business Days
          </p>
        </div>

        {/* 🔘 Buttons */}
        <div className="mt-6 flex gap-4 justify-between">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="px-6 py-2 bg-orange-500 text-black rounded-lg hover:bg-orange-600 transition"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
