// import React from "react";
import { ToastContainer, toast } from "react-toastify";

function NewsletterBox() {
  const onSubmitHandler = (event) => {
    event.preventDefault();
    toast.success("Stay Tuned for Exclusive Offers");
  };

  return (
    <div className="text-center mt-8 px-2 md:px-24">
      <p className="text-2xl font-medium text-gray-800 mb-2">
        Stay Tuned for <span className="text-orange-300">Exclusive Offers</span>
      </p>
      <p className="text-gray-500 text-justify">
        Our newsletter subscription feature is coming soon! Subscribe to get
        special discounts, early access to new designs, and stay updated with
        the latest drops from Monkedition. Be among the first to receive our{" "}
        <span className="text-orange-300">20% off</span> welcome discount when
        subscriptions go live.
      </p>
      <ToastContainer />
      <form
        onSubmit={onSubmitHandler}
        className="w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3"
      >
        <input
          className="w-full sm:flex-1 outline-none cursor-not-allowed bg-gray-50"
          type="email"
          placeholder="Coming Soon!"
          disabled
        />
        <button
          type="submit"
          className="bg-orange-300 text-black text-xs px-10 py-4 font-semibold hover:bg-orange-400 transition-colors"
        >
          Coming Soon
        </button>
      </form>
    </div>
  );
}

export default NewsletterBox;
