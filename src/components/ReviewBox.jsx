import React from "react";
import { assets } from "../assets/assets";
function ReviewBox({ review }) {
  const filledStars = Math.floor(Number(review.rating));
  const dullStars = 5 - filledStars;
  
  return (
    <div className="group bg-white hover:bg-gray-50 transition-all duration-300 p-6 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg">
      <div className="flex gap-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {review?.user ? (
            <img
              src={review?.user?.avatar}
              alt=""
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300"
            />
          ) : (
            <img 
              src={assets.p_img1} 
              alt="" 
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300" 
            />
          )}
        </div>

        {/* Review Content */}
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 text-base">
              {review?.user?.firstName || "Anonymous"}
            </h4>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {review.rating}/5
            </span>
          </div>
          
          <p className="text-gray-700 leading-relaxed">
            {review.comment}
          </p>

          {review.photos?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.photos.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Customer photo ${index + 1}`}
                    loading="lazy"
                    className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {Array(filledStars)
              .fill()
              .map((_, index) => (
                <img 
                  key={index} 
                  src={assets.star_icon} 
                  alt="" 
                  className="w-4 h-4 transition-transform group-hover:scale-110" 
                />
              ))}
            {Array(dullStars)
              .fill()
              .map((_, index) => (
                <img
                  key={index}
                  src={assets.star_dull_icon}
                  alt=""
                  className="w-4 h-4 opacity-40"
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReviewBox;
