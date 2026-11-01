// A buyer's own review of a product. Only someone whose order arrived sees it.
import { useEffect, useState } from "react";
import { useAuth } from "../context/NewAuthContext";
import { getMyReview, saveMyReview } from "../api/catalog";

const ReviewForm = ({ productId }) => {
  const { user } = useAuth();
  const [canReview, setCanReview] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?._id || !productId) return;
    getMyReview(productId)
      .then(({ canReview: allowed, review }) => {
        setCanReview(allowed);
        if (review) {
          setRating(review.rating);
          setComment(review.comment ?? "");
          setHidden(review.status === "HIDDEN");
        }
      })
      .catch(() => setCanReview(false));
  }, [user?._id, productId]);

  if (!canReview) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Please choose a rating.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveMyReview(productId, { rating, comment: comment.trim() });
      setMessage("Thanks! Your review is saved and will show here shortly.");
    } catch (err) {
      setError(err.message || "Could not save your review. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="font-medium text-gray-900">Your review</p>
      {hidden && <p className="text-xs text-gray-500">Our team has hidden this review from the shop.</p>}
      <div className="flex gap-1" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            aria-pressed={rating === value}
            onClick={() => setRating(value)}
            className={`text-2xl leading-none ${value <= rating ? "text-amber-500" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        aria-label="Your comment"
        rows={3}
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What did you think of it?"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {message && <p role="status" className="text-xs text-green-700">{message}</p>}
      <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-300 text-black disabled:opacity-50">
        {busy ? "Saving..." : "Save review"}
      </button>
    </form>
  );
};

export default ReviewForm;
