// A buyer's own review of a product. Only someone whose order arrived sees it.
import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useAuth } from "../context/NewAuthContext";
import { getMyReview, saveMyReview, uploadReviewPhoto } from "../api/catalog";

const MAX_PHOTOS = 3;

const ReviewForm = ({ productId }) => {
  const { user } = useAuth();
  const [canReview, setCanReview] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
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
          setPhotos(review.photos ?? []);
          setHidden(review.status === "HIDDEN");
        }
      })
      .catch(() => setCanReview(false));
  }, [user?._id, productId]);

  if (!canReview) return null;

  const addPhotos = async (files) => {
    setUploading(true);
    setError("");
    try {
      const urls = [];
      for (const file of [...files].slice(0, MAX_PHOTOS - photos.length)) {
        urls.push(await uploadReviewPhoto(productId, file));
      }
      setPhotos((current) => [...current, ...urls]);
    } catch (err) {
      setError(err.message || "Could not upload that photo.");
    } finally {
      setUploading(false);
    }
  };

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
      await saveMyReview(productId, { rating, comment: comment.trim(), photos });
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
      <div>
        <p className="text-sm text-gray-700 mb-2">Add photos (up to {MAX_PHOTOS})</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((url, index) => (
            <span key={url} className="relative">
              <img src={url} alt={`Your photo ${index + 1}`} className="h-16 w-16 object-cover rounded border border-gray-200" />
              <button
                type="button"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => setPhotos(photos.filter((photo) => photo !== url))}
                className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              aria-label="Add photos"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="h-16 w-16 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => {
            addPhotos(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {message && <p role="status" className="text-xs text-green-700">{message}</p>}
      <button type="submit" disabled={busy || uploading} className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-black disabled:opacity-50">
        {busy ? "Saving..." : "Save review"}
      </button>
    </form>
  );
};

export default ReviewForm;
