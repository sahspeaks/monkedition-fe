import React from 'react';

const DotIndicators = ({ currentSlideIndex, totalSlides, changeSlide, isAnimating }) => {
  return (
    <div className="flex justify-center gap-3 mt-3">
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => {
            const dir = index > currentSlideIndex ? 1 : -1;
            changeSlide(index, dir);
          }}
          disabled={isAnimating}
          className={`
            relative
            w-2 h-2 sm:w-3 sm:h-3
            rounded-full
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
            disabled:cursor-not-allowed
            ${index === currentSlideIndex
              ? "bg-orange-500 scale-125 shadow-md shadow-orange-200"
              : "bg-gray-300 hover:bg-gray-500"
            }
          `}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default DotIndicators;