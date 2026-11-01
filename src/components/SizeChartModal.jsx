import React, { useState } from "react";

export const SizeChartModal = ({ setIsModalOpen, parentCategory }) => {
  const [unit, setUnit] = useState("Inches");

  const handleUnitChange = (selectedUnit) => {
    setUnit(selectedUnit);
  };

  // Size data in Inches
  const sizeDatabase = {
    // Men's Categories
    "Acid Wash Oversized T-shirt": [
      { size: "XS", chest: 39, length: 27 },
      { size: "S", chest: 41, length: 28 },
      { size: "M", chest: 43, length: 29 },
      { size: "L", chest: 45, length: 30 },
      { size: "XL", chest: 47, length: 31 },
      { size: "XXL", chest: 49, length: 32 },
    ],
    "Acid Wash Hoodie": [
      { size: "XS", chest: 38, length: 25 },
      { size: "S", chest: 40, length: 26 },
      { size: "M", chest: 42, length: 27 },
      { size: "L", chest: 44, length: 28 },
      { size: "XL", chest: 46, length: 29 },
      { size: "XXL", chest: 48, length: 30 },
    ],
    "Oversized T-shirt": [
      { size: "XS", chest: 39, length: 27 },
      { size: "S", chest: 41, length: 28 },
      { size: "M", chest: 43, length: 29 },
      { size: "L", chest: 45, length: 30 },
      { size: "XL", chest: 47, length: 31 },
      { size: "XXL", chest: 49, length: 32 },
    ],
    "Crop Top": [
      { size: "XS", chest: 32, length: 15.5 },
      { size: "S", chest: 34, length: 16.5 },
      { size: "M", chest: 36, length: 17.5 },
      { size: "L", chest: 38, length: 18.5 },
      { size: "XL", chest: 40, length: 19.5 },
      { size: "XXL", chest: 42, length: 20.5 },
    ],
    "Terry Oversized T-shirt": [
      { size: "XS", chest: 39, length: 26, shoulder: 18, sleeveOpen: 6.5, sleeveLength: 7.5 },
      { size: "S", chest: 41, length: 27, shoulder: 19, sleeveOpen: 7, sleeveLength: 8.5 },
      { size: "M", chest: 43, length: 28, shoulder: 20, sleeveOpen: 7.5, sleeveLength: 9.5 },
      { size: "L", chest: 45, length: 29, shoulder: 21, sleeveOpen: 8, sleeveLength: 10.5 },
      { size: "XL", chest: 47, length: 30, shoulder: 22, sleeveOpen: 8.5, sleeveLength: 11.5 },
      { size: "XXL", chest: 49, length: 31, shoulder: 23, sleeveOpen: 9, sleeveLength: 12.5 },
    ],
    "Hooded Sweatshirt": [
      { size: "XS", chest: 38, length: 25 },
      { size: "S", chest: 40, length: 26 },
      { size: "M", chest: 42, length: 27 },
      { size: "L", chest: 44, length: 28 },
      { size: "XL", chest: 46, length: 29 },
      { size: "XXL", chest: 48, length: 30 },
    ],
    "Crop Hoodie": [
      { size: "XS", chest: 32, length: 16, shoulder: 16.75 },
      { size: "S", chest: 34, length: 16.5, shoulder: 17.75 },
      { size: "M", chest: 36, length: 17, shoulder: 18.75 },
      { size: "L", chest: 38, length: 17.5, shoulder: 19.75 },
      { size: "XL", chest: 40, length: 18, shoulder: 20.75 },
      { size: "XXL", chest: 42, length: 18.5, shoulder: 21.75 },
    ],
    "Zip Hoodie": [
      { size: "S", chest: 40, length: 26 },
      { size: "M", chest: 42, length: 27 },
      { size: "L", chest: 44, length: 28 },
      { size: "XL", chest: 46, length: 29 },
      { size: "XXL", chest: 48, length: 30 },
    ],
    "Oversized Hooded Sweatshirt": [
      { size: "S", chest: 40, length: 27 },
      { size: "M", chest: 42, length: 28 },
      { size: "L", chest: 44, length: 29 },
      { size: "XL", chest: 46, length: 30 },
      { size: "XXL", chest: 48, length: 31 },
    ],
    "Sweatshirt": [
      { size: "XS", chest: 38, length: 25 },
      { size: "S", chest: 40, length: 26 },
      { size: "M", chest: 42, length: 27 },
      { size: "L", chest: 44, length: 28 },
      { size: "XL", chest: 46, length: 29 },
      { size: "XXL", chest: 48, length: 30 },
    ],
    "Oversized Sweatshirt": [
      { size: "S", chest: 40, length: 27 },
      { size: "M", chest: 42, length: 28 },
      { size: "L", chest: 44, length: 29 },
      { size: "XL", chest: 46, length: 30 },
      { size: "XXL", chest: 48, length: 31 },
    ],
    "Women's Classic T-shirt": [
      { size: "S", chest: 32, length: 23 },
      { size: "M", chest: 34, length: 24 },
      { size: "L", chest: 36, length: 25 },
      { size: "XL", chest: 38, length: 26 },
      { size: "XXL", chest: 40, length: 27 },
    ],
    "Varsity Jacket": [
      { size: "XS", chest: 38, length: 25, shoulder: 17, sleeveLength: 21.5 },
      { size: "S", chest: 40, length: 26, shoulder: 18, sleeveLength: 22.5 },
      { size: "M", chest: 42, length: 27, shoulder: 19, sleeveLength: 23.5 },
      { size: "L", chest: 44, length: 28, shoulder: 20, sleeveLength: 24.5 },
      { size: "XL", chest: 46, length: 29, shoulder: 21, sleeveLength: 25.5 },
      { size: "XXL", chest: 48, length: 30, shoulder: 22, sleeveLength: 26.5 },
    ],
  };

  // Get size data for the specific parent category
  const sizeDataInInches = sizeDatabase[parentCategory] || [];

  // Conversion function
  const convertToCms = (value) => (value * 2.54).toFixed(1);

  // Convert data to cms if needed
  const convertRowToCms = (row) => {
    const convertedRow = { size: row.size };
    Object.keys(row).forEach(key => {
      if (key !== 'size') {
        convertedRow[key] = convertToCms(row[key]);
      }
    });
    return convertedRow;
  };

  // Adjusted size data based on the selected unit
  const sizeData = unit === "Cms" 
    ? sizeDataInInches.map(convertRowToCms)
    : sizeDataInInches;

  // Get all possible columns from the data
  const getColumns = () => {
    if (sizeData.length === 0) return [];
    const firstRow = sizeData[0];
    return Object.keys(firstRow);
  };

  const columns = getColumns();

  // Format column headers
  const formatHeader = (key) => {
    switch (key) {
      case 'size': return 'Size';
      case 'chest': return 'Chest';
      case 'length': return 'Length';
      case 'shoulder': return 'Shoulder';
      case 'sleeveOpen': return 'Sleeve Open';
      case 'sleeveLength': return 'Sleeve Length';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  // Show message if no data found for the category
  if (!sizeDataInInches.length) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform animate-scale-in">
          {/* Close Button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 z-10"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Content */}
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Size Chart</h3>
            <p className="text-gray-600 mb-6">
              Size chart not available for <span className="font-semibold">"{parentCategory}"</span>
            </p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] flex flex-col transform animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1" id="modal-title">
              Size Chart
            </h3>
            <p className="text-gray-600 font-medium">{parentCategory}</p>
          </div>
          
          {/* Close Button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:rotate-90"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="p-6 pb-4 flex justify-center">
          <div className="bg-gray-100 p-1 rounded-xl inline-flex shadow-inner">
            <button
              onClick={() => handleUnitChange("Inches")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                unit === "Inches"
                  ? "bg-white text-gray-900 shadow-sm transform scale-105"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Inches
            </button>
            <button
              onClick={() => handleUnitChange("Cms")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                unit === "Cms"
                  ? "bg-white text-gray-900 shadow-sm transform scale-105"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Centimeters
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <div className="bg-gray-50 rounded-xl p-4 h-full overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0 min-w-full">
                <thead>
                  <tr>
                    {columns.map((column, index) => (
                      <th 
                        key={column} 
                        className={`bg-orange-400 text-black font-semibold py-4 px-6 text-center ${
                          index === 0 ? 'rounded-l-xl' : ''
                        } ${
                          index === columns.length - 1 ? 'rounded-r-xl' : ''
                        } border-r border-orange-100 last:border-r-0`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{formatHeader(column)}</span>
                          {column !== 'size' && (
                            <span className="text-xs text-gray-700 font-normal">
                              ({unit.toLowerCase()})
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="group">
                      {columns.map((column, colIndex) => (
                        <td 
                          key={column} 
                          className={`bg-white group-hover:bg-blue-50 transition-colors duration-200 py-4 px-6 text-center border-r border-gray-200 last:border-r-0 ${
                            rowIndex === sizeData.length - 1 && colIndex === 0 ? 'rounded-bl-xl' : ''
                          } ${
                            rowIndex === sizeData.length - 1 && colIndex === columns.length - 1 ? 'rounded-br-xl' : ''
                          }`}
                        >
                          {column === 'size' ? (
                            <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                              {row[column]}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-700">
                              {row[column] || '-'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>All measurements are approximate and may vary slightly</span>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-medium px-8 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Got it!
          </button>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};