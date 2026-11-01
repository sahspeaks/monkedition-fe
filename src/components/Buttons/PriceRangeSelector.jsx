import React from "react";

const PriceRangeSelector = ({ rawPrices = [], selectedRange, onSelect }) => {
  // convert flat raw prices array into range pairs
  const priceRanges = [];
  for (let i = 0; i < rawPrices.length; i += 2) {
    if (rawPrices[i + 1]) {
      priceRanges.push([rawPrices[i], rawPrices[i + 1]]);
    } else {
      priceRanges.push([rawPrices[i]]); // last one becomes ₹2500+
    }
  }

  const handleSelect = (range) => {
    // Improved comparison logic that handles both single and double element arrays
    
    const isCurrentlySelected = selectedRange && 
      range[0] === selectedRange[0] && 
      (range.length === selectedRange.length) &&
      (range.length === 1 || range[1] === selectedRange[1]);
    if (isCurrentlySelected) {
      onSelect(null); // deselect if already selected
    } else {
      onSelect(range); // select new
    }
  };

  const formatLabel = (range) => {
    if (range.length === 1) {
      return `₹${range[0]}+`; // e.g. ₹2500+
    }
    return `₹${range[0]} – ₹${range[1]}`;
  };

  const isSelected = (range) => {
    return selectedRange && 
      range[0] === selectedRange[0] && 
      (range.length === selectedRange.length) &&
      (range.length === 1 || range[1] === selectedRange[1]);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {priceRanges.map((range, index) => (
        <button
          key={index}
          onClick={() => handleSelect(range)}
          className={`border bg-gray-100 py-2 px-4 rounded-md text-center text-sm transition-all duration-200 hover:bg-gray-200 ${
            isSelected(range)
              ? "ring-2 ring-orange-400 text-black font-bold bg-orange-50"
              : "font-light"
          }`}
        >
          {formatLabel(range)}
        </button>
      ))}
    </div>
  );
};

export default PriceRangeSelector;