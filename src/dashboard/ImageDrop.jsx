// Pick or drop images; each goes straight to Cloudinary and comes back as a URL.
import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { uploadImage } from "./api";

const ImageDrop = ({ images, onChange, target, disabledReason, multiple = true, extra, label = "Add images" }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const upload = async (files) => {
    const list = [...files];
    if (!list.length || disabledReason) return;
    setError("");
    setUploading(list.length);
    const urls = [];
    const failed = [];
    for (const file of list) {
      try {
        urls.push(await uploadImage(file, target));
      } catch (err) {
        failed.push(err.message);
      }
      setUploading((count) => count - 1);
    }
    if (urls.length) onChange(multiple ? [...images, ...urls] : urls.slice(0, 1));
    if (failed.length) setError(failed.join(" "));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div key={url} className="relative">
            <img src={url} alt={`Image ${index + 1}`} className="h-24 w-24 rounded-lg object-cover bg-gray-100 border border-gray-200" />
            <button
              type="button"
              aria-label={`Remove image ${index + 1}`}
              onClick={() => onChange(images.filter((image) => image !== url))}
              className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
            </button>
            {extra?.(url)}
          </div>
        ))}
        <button
          type="button"
          disabled={Boolean(disabledReason) || uploading > 0}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files);
          }}
          className={`h-24 w-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-xs text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${dragging ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-gray-400"}`}
        >
          {uploading > 0 ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mb-1" /> {uploading} left
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mb-1" aria-hidden="true" /> {label}
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => {
          upload(e.target.files);
          e.target.value = "";
        }}
      />
      {disabledReason && <p className="mt-2 text-xs text-gray-500">{disabledReason}</p>}
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default ImageDrop;
