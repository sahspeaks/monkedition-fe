// import React, { useEffect, useState } from "react";
// import { Title } from "./Title";
// import { useCollections } from "../context/CollectionsContext";
// import { assets } from "../assets/assets";
// import { useNavigate, useLocation } from "react-router-dom";
// import { CollectionCategoryItem } from "./ProductItem";

// // Skeleton components remain the same (as in original code)
// const CategorySkeleton = () => (
//   <div className="animate-pulse">
//     <div className="relative aspect-square bg-gray-200 rounded-lg"></div>
//     <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
//   </div>
// );

// const CategorySectionSkeleton = () => (
//   <div className="text-center py-8">
//     <div className="animate-pulse">
//       <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
//       <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-6"></div>
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 justify-center mt-6 mx-10">
//         {Array(8)
//           .fill(0)
//           .map((_, index) => (
//             <CategorySkeleton key={index} />
//           ))}
//       </div>
//     </div>
//   </div>
// );

// function CollectionsView() {
//   const { CollectionsData, isLoading, error, fetchCollections } =
//     useCollections();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [cachedCollections, setCachedCollections] = useState(null);

//   useEffect(() => {
//     // Check if collections are already in sessionStorage
//     const storedCollections = sessionStorage.getItem("collectionsData");

//     if (storedCollections) {
//       setCachedCollections(JSON.parse(storedCollections));
//     } else if (!CollectionsData) {
//       // Fetch collections only if not already loaded
//       fetchCollections();
//     }
//   }, [fetchCollections, CollectionsData]);

//   // Update cache when CollectionsData changes
//   useEffect(() => {
//     sessionStorage.setItem("previousPath", location.pathname);
//     if (CollectionsData) {
//       sessionStorage.setItem(
//         "collectionsData",
//         JSON.stringify(CollectionsData)
//       );
//       setCachedCollections(CollectionsData);
//     }
//   }, [CollectionsData]);

//   if (
//     isLoading ||
//     !cachedCollections ||
//     Object.keys(cachedCollections).length === 0
//   ) {
//     return (
//       <div className="my-2 sm:my-8 lg:my-10">
//         <CategorySectionSkeleton />
//         <CategorySectionSkeleton />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-center py-8 text-red-600">
//         <p>Error loading collections: {error.message}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="my-1">
//       {Object.entries(cachedCollections).map(
//         ([categoryName, categoryData], index) => {
//           const categoryId =
//             categoryData.id || categoryName.toLowerCase().replace(/\s+/g, "-");

//           return (
//             <div key={index} className="text-center p-5 text-3xl">
//               <Title
//                 text1={categoryName.split(" ")[0]}
//                 text2={` ${categoryName.split(" ")[1] || ""}`}
//               />
//               <p className="w-3/4 m-auto text-sm sm:text-sm md:text-base text-gray-600">
//                 {categoryData.description}
//               </p>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center mt-2">
//                 {categoryData.map((subCategory, subIndex) => {
//                   const subCategoryId = `${subCategory.name
//                     .toLowerCase()
//                     .replace(/\s+/g, "-")}`;
//                   return (
//                     <CollectionCategoryItem
//                       key={subIndex}
//                       title={subCategory.name}
//                       img={subCategory.thumbnail || assets.p_img1}
//                       categoryName={subCategory.name}
//                       onClick={() => {
//                         navigate(`/collection/${categoryId}/${subCategoryId}`);
//                       }}
//                     />
//                   );
//                 })}
//               </div>
//             </div>
//           );
//         }
//       )}
//     </div>
//   );
// }

//----------------------------------------------------------------------------------------------------------------
import React, { useEffect, useState } from "react";
import { Title } from "./Title";
import { useCollections } from "../context/CollectionsContext";
import { assets } from "../assets/assets";
import { useNavigate, useLocation } from "react-router-dom";
import { CollectionCategoryItem } from "./ProductItem";

// Enhanced skeleton components with orange theme
const CategorySkeleton = () => (
  <div className="animate-pulse">
    <div className="relative aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl shadow-sm"></div>
    <div className="h-4 bg-orange-100 rounded-full w-3/4 mt-3"></div>
    <div className="h-3 bg-orange-50 rounded-full w-1/2 mt-2"></div>
  </div>
);

const CategorySectionSkeleton = () => (
  <div className="text-center py-8">
    <div className="animate-pulse">
      <div className="h-8 bg-orange-100 rounded-full w-48 mx-auto mb-4"></div>
      <div className="h-4 bg-orange-50 rounded-full w-3/4 mx-auto mb-6"></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center mt-6 mx-4">
        {Array(8)
          .fill(0)
          .map((_, index) => (
            <CategorySkeleton key={index} />
          ))}
      </div>
    </div>
  </div>
);

// Enhanced product card with refined orange color scheme
const NewlyAddedProductCard = ({ product, onClick, index }) => (
  <div 
    className="group relative flex-shrink-0 cursor-pointer overflow-hidden transition-all duration-700 ease-out transform rounded-3xl snap-start"
    onClick={onClick}
    style={{
      animationDelay: `${index * 100}ms`,
    }}
  >
    {/* Premium glassmorphism container with orange accents */}
    <div className="relative bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl hover:shadow-orange-400/20 hover:shadow-3xl border border-orange-200/30 overflow-hidden transition-all duration-700 ease-out group-hover:bg-white/95 group-hover:border-orange-400/50">
      
      {/* Sophisticated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 via-orange-400/5 to-orange-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      {/* Refined NEW badge with elegant animation */}
      {/* <div className="absolute top-3 right-3 z-20">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-pulse opacity-75"></div>
          <div className="relative bg-gradient-to-r from-orange-400 to-orange-500 text-black px-3 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-xl backdrop-blur-sm">
            NEW
          </div>
        </div>
      </div> */}
      
      {/* Enhanced image container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-orange-50/50 to-orange-100/30 rounded-t-3xl">
        <img 
          src={product.thumbnail || assets.p_img1} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
        />
        
        {/* Elegant overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        {/* Subtle floating particles */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-60 transition-opacity duration-1000">
          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-orange-400/80 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-500/70 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-orange-200/80 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
        </div>
      </div>
      
      {/* Refined content section */}
      <div className="relative p-4 bg-gradient-to-r from-white/80 to-orange-50/60 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-orange-50/80 group-hover:from-white/95 group-hover:to-orange-50/90 transition-all duration-500"></div>
        
        <div className="relative z-10">
          <h3 className="font-bold text-base text-gray-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-500 transition-all duration-500 leading-tight line-clamp-2">
            {product.name}
          </h3>
          
          {/* Enhanced CTA with orange theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600 group-hover:text-orange-800 transition-colors duration-500">
              <span className="text-sm font-semibold tracking-wide">Explore</span>
              <div className="ml-2 relative">
                <svg className="w-4 h-4 transform group-hover:translate-x-1 group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
            <div className="w-2 h-2 bg-orange-400 rounded-full group-hover:bg-orange-500 transition-colors duration-500"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function CollectionsView() {
  const { CollectionsData, isLoading, error, fetchCollections } =
    useCollections();
  const navigate = useNavigate();
  const location = useLocation();
  const [cachedCollections, setCachedCollections] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    // Check if collections are already in sessionStorage
    const storedCollections = sessionStorage.getItem("collectionsData");
    


    if (storedCollections) {
      setCachedCollections(JSON.parse(storedCollections));
    } else if (!CollectionsData) {
      // Fetch collections only if not already loaded
      fetchCollections();
    }
  
  }, [fetchCollections, CollectionsData]);

  // Update cache when CollectionsData changes
  useEffect(() => {
    sessionStorage.setItem("previousPath", location.pathname);
    if (CollectionsData) {
      sessionStorage.setItem(
        "collectionsData",
        JSON.stringify(CollectionsData)
      );
      setCachedCollections(CollectionsData);
    }
  }, [CollectionsData]);

  // Function to handle scroll and update active slide index
  const handleScroll = (categoryId) => {
    const scrollContainer = document.getElementById(`scroll-container-${categoryId}`);
    if (scrollContainer) {
      const scrollLeft = scrollContainer.scrollLeft;
      const itemWidth = scrollContainer.children[0]?.offsetWidth || 288; // 288px is w-72
      const gap = 16; // 16px gap between items
      const totalItemWidth = itemWidth + gap;
      const currentIndex = Math.round(scrollLeft / totalItemWidth);
      setActiveSlideIndex(currentIndex);
    }
  };

  // Function to scroll to specific slide
  const scrollToSlide = (categoryId, index) => {
    const scrollContainer = document.getElementById(`scroll-container-${categoryId}`);
    if (scrollContainer) {
      const itemWidth = scrollContainer.children[0]?.offsetWidth || 288;
      const gap = 16;
      const totalItemWidth = itemWidth + gap;
      const scrollLeft = index * totalItemWidth;
      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
      setActiveSlideIndex(index);
    }
  };

  if (
    isLoading ||
    !cachedCollections ||
    Object.keys(cachedCollections).length === 0
  ) {
    return (
      <div className="my-2 sm:my-8 lg:my-10">
        <CategorySectionSkeleton />
        <CategorySectionSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading collections: {error.message}</p>
      </div>
    );
  }

  // Function to check if category should use horizontal scroll
  const isNewlyAddedCategory = (categoryName) => {
    return categoryName.toLowerCase().includes("newly added");
  };

  return (
    <div className="my-1">
      {Object.entries(cachedCollections).map(
        ([categoryName, categoryData], index) => {
          const categoryId =
            categoryData.id || categoryName.toLowerCase().replace(/\s+/g, "-");

          const useHorizontalScroll = isNewlyAddedCategory(categoryName);

          return (
            <div key={index} className={useHorizontalScroll ? "mb-0" : "text-center p-5 text-3xl"}>
              {useHorizontalScroll ? (
                // Premium newly added section with refined orange design
                <div className="relative bg-gradient-to-br from-orange-50/80 via-white to-orange-100/40 overflow-hidden min-h-screen">
                  
                  {/* Sophisticated background with geometric elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    {/* Refined gradient orbs */}
                    <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-gradient-to-br from-orange-400/20 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/15 to-orange-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-orange-400/25 to-orange-200/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
                    
                    {/* Elegant geometric shapes */}
                    <div className="absolute top-1/4 left-1/6 w-6 h-6 bg-orange-400/40 rounded-lg rotate-45 animate-bounce" style={{animationDelay: '1s'}}></div>
                    <div className="absolute top-2/3 right-1/4 w-4 h-4 bg-orange-500/30 rounded-full animate-bounce" style={{animationDelay: '3s'}}></div>
                    <div className="absolute bottom-1/4 left-2/3 w-3 h-12 bg-orange-200/30 rounded-full animate-bounce" style={{animationDelay: '5s'}}></div>
                  </div>
                  
                  <div className="relative z-10">
                    {/* Refined hero header */}
                    <div className="text-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
                      {/* Premium badge */}
                      <div className="inline-block mb-6 sm:mb-8 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                        <div className="relative bg-gradient-to-r from-orange-400 to-orange-500 text-black px-6 py-3 rounded-full text-sm font-bold tracking-[0.15em] shadow-xl backdrop-blur-sm">
                          ✨ LATEST ARRIVALS
                        </div>
                      </div>
                      
                      {/* Elegant main title */}
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-orange-500 to-orange-500 tracking-tight leading-none mb-6 sm:mb-8">
                        {categoryName}
                      </h1>
                      
                      <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
                        Discover our newest arrivals crafted with passion and designed to inspire your unique style
                      </p>
                    </div>

                    {/* Improved mobile-first layout */}
                    <div className="pb-12 sm:pb-16 lg:pb-20">
                      {/* Mobile: Optimized single column scroll */}
                      <div className="sm:hidden px-4">
                        <div
                          id={`scroll-container-${categoryId}`}
                          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                          }}
                          onScroll={() => handleScroll(categoryId)}
                        >
                          {categoryData.map((subCategory, subIndex) => {
                            const subCategoryId = `${subCategory.name
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`;
                            return (
                              <div key={subIndex} className="w-72 flex-shrink-0">
                                <NewlyAddedProductCard
                                  product={subCategory}
                                  index={subIndex}
                                  onClick={() => {
                                    navigate(
                                      `/collection/${categoryId}/${subCategoryId}`
                                    );
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Dynamic Mobile scroll indicator */}
                        <div className="flex justify-center mt-6 space-x-2">
                          {categoryData.map((_, i) => (
                            <button
                              key={i}
                              className={`transition-all duration-300 ease-out rounded-full ${
                                i === activeSlideIndex
                                  ? 'w-8 h-2 bg-gradient-to-r from-orange-500 to-orange-500 shadow-lg'
                                  : 'w-2 h-2 bg-orange-400/40 hover:bg-orange-400/60'
                              }`}
                              onClick={() => scrollToSlide(categoryId, i)}
                              aria-label={`Go to slide ${i + 1}`}
                            />
                          ))}
                        </div>
                        
                        {/* Progress indicator */}
                        <div className="flex justify-center mt-2">
                          <span className="text-xs text-gray-500 font-medium">
                            {activeSlideIndex + 1} of {categoryData.length}
                          </span>
                        </div>
                      </div>

                      {/* Tablet: 2-column scroll */}
                      <div className="hidden sm:block md:hidden px-6">
                        <div
                          id={`scroll-container-${categoryId}`}
                          className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                          }}
                        >
                          {/* Create pairs for 2-column layout */}
                          {Array.from({ length: Math.ceil(categoryData.length / 2) }, (_, groupIndex) => (
                            <div key={groupIndex} className="flex-shrink-0 snap-start">
                              <div className="grid grid-cols-2 gap-4 w-[600px]">
                                {categoryData.slice(groupIndex * 2, (groupIndex + 1) * 2).map((subCategory, subIndex) => {
                                  const actualIndex = groupIndex * 2 + subIndex;
                                  const subCategoryId = `${subCategory.name
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`;
                                  return (
                                    <NewlyAddedProductCard
                                      key={actualIndex}
                                      product={subCategory}
                                      index={actualIndex}
                                      onClick={() => {
                                        navigate(
                                          `/collection/${categoryId}/${subCategoryId}`
                                        );
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desktop: Premium horizontal scroll */}
                      <div className="hidden md:block px-8 lg:px-12">
                        <div
                          id={`scroll-container-${categoryId}`}
                          className="flex gap-8 lg:gap-12 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                          }}
                        >
                          {categoryData.map((subCategory, subIndex) => {
                            const subCategoryId = `${subCategory.name
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`;
                            return (
                              <div key={subIndex} className="w-80 lg:w-96 flex-shrink-0">
                                <NewlyAddedProductCard
                                  product={subCategory}
                                  index={subIndex}
                                  onClick={() => {
                                    navigate(
                                      `/collection/${categoryId}/${subCategoryId}`
                                    );
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Regular category section with orange accents
                <>
                  <Title
                    text1={categoryName.split(" ")[0]}
                    text2={` ${categoryName.split(" ")[1] || ""}`}
                  />
                  <p className="w-3/4 m-auto text-sm sm:text-sm md:text-base text-gray-600">
                    {categoryData.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center mt-2">
                    {categoryData.map((subCategory, subIndex) => {
                      const subCategoryId = `${subCategory.name
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`;
                      return (
                        <CollectionCategoryItem
                          key={subIndex}
                          title={subCategory.name}
                          img={subCategory.thumbnail || assets.p_img1}
                          categoryName={subCategory.name}
                          onClick={() => {
                            navigate(
                              `/collection/${categoryId}/${subCategoryId}`
                            );
                          }}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}

export default CollectionsView;