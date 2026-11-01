import React from "react";

const SizeSelector = ({ sizes = [], selectedSize, onSelect }) => {
  const handleSelect = (item) => {
    if (item === selectedSize) {
      onSelect(null); // deselect if already selected
    } else {
      onSelect(item); // select new
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {sizes.map((item, index) => (
        <button
          key={index}
          onClick={() => handleSelect(item)}
          className={`border bg-gray-100 py-2 px-4 rounded-md text-center text-sm transition-all duration-200 hover:bg-gray-200  ${
            item === selectedSize
              ? "ring-2 ring-orange-500 text-black font-bold bg-orange-50"
              : "font-light"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
};

export default SizeSelector;