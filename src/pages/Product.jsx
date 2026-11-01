import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Local assets and product data (consider if these should be fetched from an API)
import { assets } from "../assets/assets";
// Contexts for global state management
import { colorMap, useCollections } from "../context/CollectionsContext";
import { getProduct } from "../api/catalog";
import { useCartContext } from "../context/CartContext";
import { useWishlist } from "../context/WhislistContext";
// UI Components
import ReviewBox from "../components/ReviewBox";
import ReviewForm from "../components/ReviewForm";
import { SizeChartModal } from "../components/SizeChartModal"; // Note: This component is currently commented out in the JSX
import { ToastContainer, toast } from "react-toastify";
import { LikeButton, ShareButton } from "../components/icons";
import ImageViewModal from "../components/ImageViewModal";
import { ProductItem } from "../components/ProductItem";

// Defines the sections for the product's bottom panel (Description, Additional Information, Reviews)
const bottomSection = ["Description", "Additional Information", "Reviews"];

// Colours a white tick would not show on.
const LIGHT_COLOURS = new Set(["Wh", "Yl", "Ph", "Be", "Mnt", "LBp", "Lv", "Gm", "NYI", "SG", "Mh"]);

const ColorSelector = ({ colors = [], selectedColor, onColorSelect }) => {

  const handleKeyDown = (event, colorCode) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onColorSelect(colorCode);
    }
  };

  return (
    <div>
      <p className="mt-5 text-gray-700 font-medium md:w-4/5">Select Color</p>
      <div className="flex gap-4 my-4 flex-wrap">
        {colors.map((colorCode) => (
          <div key={colorCode} className="relative group">
            <button
              onClick={() => onColorSelect(colorCode)}
              onKeyDown={(e) => handleKeyDown(e, colorCode)}
              className={`
              border h-10 w-10 ${colorMap[colorCode]} rounded-md 
              transition-all duration-200 ease-in-out
              transform hover:scale-110 hover:shadow-lg
            
              ${
                selectedColor === colorCode
                  ? "ring-2 ring-orange-500 border-orange-600 shadow-lg"
                  : "border-gray-200 hover:border-gray-400"
              }
              ${LIGHT_COLOURS.has(colorCode) ? "border-gray-300" : ""}
              relative overflow-hidden
            `}
              aria-label={`Select color ${colorCode}`}
              aria-pressed={selectedColor === colorCode}
              title={colorCode}
            >
              {/* Selection indicator */}
              {selectedColor === colorCode && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 ${
                      LIGHT_COLOURS.has(colorCode)
                        ? "text-gray-800"
                        : "text-white"
                    } drop-shadow-sm`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>
              )}

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-md" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


/**
 * Product Component
 *
 * This component displays detailed information about a single product,
 * including images, price, size and color selection, and reviews.
 * It also handles adding products to the cart and wishlist, and navigating
 * to the checkout process.
 */
function Product() {
  // Hooks for navigation, route parameters, and context API
  const navigate = useNavigate();
  const { productId } = useParams(); // Extracts product ID from the URL
  const { calculateReview } = useCollections();
  const { addToCart } = useCartContext(); // Custom hook for cart management
  const {
    wishlistItems = [], // Destructure wishlist items, providing an empty array as a fallback
    addToWishlist,
    removeFromWishlist,
  } = useWishlist() || {}; // Custom hook for wishlist management, providing an empty object as a fallback

  // --- State Variables ---
  const [product, setProduct] = useState({}); // Stores the fetched product data
  const [image, setImage] = useState(""); // Currently displayed main product image
  const [size, setSize] = useState(""); // Selected product size
  const [selectedColor, setSelectedColor] = useState(""); // Selected product color
  const [isLoading, setIsLoading] = useState(true); // Manages loading state for product data
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls visibility of the SizeChartModal
  const [relatedProducts, setRelatedProducts] = useState([]); // Stores related products
  const [colorImages, setColorImages] = useState([]); // Images for selected color
  const [loadError, setLoadError] = useState(null); // "missing" or "failed"
  const [attempt, setAttempt] = useState(0);

  const [selectedBottomSection, setSelectedBottomSection] = useState(
    bottomSection[0]
  ); // Controls which section (Description, Add Info, Reviews) is active
  const [overAllReview, setOverAllReview] = useState([0, 0]); // Stores calculated overall review score and count

  // --- Image View Modal States ---
  const [isImageModalOpen, setIsImageModalOpen] = useState(false); // Controls visibility of the ImageViewModal
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Index of the currently displayed image in the modal
  const [allImages, setAllImages] = useState([]); // Array of all product images (main + additional)
  const touchStartX = useRef(0); // Stores initial X coordinate for touch swipe gestures
  const touchEndX = useRef(0); // Stores final X coordinate for touch swipe gestures

  // --- Helper Functions ---

  /**
   * Handles the click event on an image to open the image view modal.
   * @param {string} clickedImage - The URL of the image that was clicked.
   */
  const handleImageClick = (clickedImage) => {
    // Find the index of the clicked image within the `allImages` array
    const imageIndex = allImages.findIndex((img) => img === clickedImage);
    setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0); // Set current index, default to 0 if not found
    setIsImageModalOpen(true); // Open the image view modal
  };

  /** The images for a colour; a colour without its own shows the product's. */
  const imagesFor = (item, colorCode) => {
    const own = item.colorImages?.find((entry) => entry.color === colorCode)?.images;
    return own?.length ? own : [item.image, ...(item.addImages ?? [])].filter(Boolean);
  };

  const showColor = (item, colorCode) => {
    const images = imagesFor(item, colorCode);
    setSelectedColor(colorCode);
    setColorImages(images);
    setImage(images[0] ?? "");
  };

  /** Whether this size can be bought in this colour. */
  const isAvailable = (colorCode, sizeName) => {
    if (!product.variants?.length) return product.stock > 0;
    return product.variants.some(
      (variant) =>
        variant.colour?.code === colorCode && variant.size === sizeName && variant.available,
    );
  };

  const handleColorSelect = (colorCode) => {
    if (colorCode === selectedColor) return;
    showColor(product, colorCode);
    if (size && !isAvailable(colorCode, size)) setSize("");
  };

  /**
   * Renders star icons based on the number of filled stars.
   * @param {number} filledStars - The number of stars to be filled.
   * @param {number} totalStars - The total number of stars to render (default is 5).
   * @returns {JSX.Element[]} An array of image elements representing stars.
   */
  const renderStars = (filledStars, totalStars = 5) => {
    return Array.from({ length: totalStars }, (_, index) => (
      <img
        key={index}
        src={
          index < Math.floor(filledStars)
            ? assets.star_icon // Filled star
            : assets.star_dull_icon // Empty star
        }
        alt={index < Math.floor(filledStars) ? "filled star" : "empty star"}
        className="w-3"
      />
    ));
  };

  /**
   * Converts a string (e.g., subcategory name) into a URL-friendly slug.
   * @param {string} subcategory - The string to convert.
   * @returns {string} The slugified string.
   */
  const OriginalToSlug = (subcategory) => {
    return subcategory.toLowerCase().replace(/\s+/g, "-"); // Convert to lowercase and replace spaces with hyphens
  };

  /**
   * Determines and returns the stock status message and styling.
   * @param {number} stock - The current stock quantity of the product.
   * @returns {JSX.Element} A styled span indicating the stock status.
   */
  function getStockStatus(stock) {
    if (stock <= 0) {
      return <span className="text-red-500">Out of Stock</span>;
    } else if (stock > 0 && stock <= 10) {
      return <span className="text-yellow-500">Only {stock} Left</span>;
    } else if (stock > 10 && stock <= 20) {
      return <span className="text-orange-700">Hurry Up</span>;
    } else {
      return <span className="text-green-500">In Stock</span>;
    }
  }

  const isSoldOut = product.stock <= 0;

  /**
   * Handles the "Buy Now" action. Validates size and color,
   * creates a cart summary, and navigates to the place order page.
   */
  const handleBuyNow = () => {
    if (isSoldOut) return;
    if (!size) {
      toast.warn("Please select a size.");
      return;
    }
    if (!selectedColor) {
      toast.warn("Please select a color.");
      return;
    }

    const itemTotal = product.price * 1; // Quantity is always 1 for buy now

    const cartSummary = {
      items: [
        {
          id: product._id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          price: product.price,
          mrp: product.mrp,
          size: size,
          color: selectedColor,
          image: image,
          weight: product.weight,
          subtotal: itemTotal,
        },
      ],
      summary: {
        totalAmount: itemTotal,
        itemCount: 1,
        originalAmount: product.mrp,
        finalTotal: itemTotal,
      },
      orderDetails: {
        createdAt: new Date().toISOString(),
        currency: "INR",
        status: "pending",
        isBuyNow: true, // Flag to indicate a direct purchase
      },
    };

    // Navigate to the place order page with cart summary data
    navigate("/place-order", {
      state: { cartSummary, isBuyNow: true },
      replace: false,
    });
  };

  /**
   * Handles the "Add to Cart" action. Validates size and color,
   * then calls the `addToCart` function from the CartContext.
   */
  const handleAddToCart = async () => {
    if (isSoldOut) return;
    if (!size) {
      toast.warn("Please select a size.");
      return;
    }
    if (!selectedColor) {
      toast.warn("Please select a color.");
      return;
    }
    // The server cart can refuse (e.g. "Only 3 left in stock"); the browser
    // cart returns nothing.
    const result = await addToCart(product._id, size, selectedColor, product);
    if (result?.ok === false) {
      toast.error(result.message);
      return;
    }
    toast.info("Item added to cart!");
  };

  /**
   * Checks if a product is already in the wishlist.
   * @param {string} itemId - The ID of the product to check.
   * @returns {boolean} True if the item is in the wishlist, false otherwise.
   */
  const isItemInWishlist = (itemId) => {
    return (
      wishlistItems?.some(
        (wishlistItem) => wishlistItem?.product?._id === itemId
      ) || false
    );
  };

  /**
   * Toggles a product's presence in the wishlist.
   * @param {Event} e - The event object (e.g., click event).
   * @param {string} itemId - The ID of the product to add/remove from wishlist.
   */
  const handleLikeClick = async (e, itemId) => {
    e.preventDefault();
    if (!wishlistItems) {
      toast.error("Wishlist is not available. Please log in.");
      return;
    }

    try {
      if (isItemInWishlist(itemId)) {
        await removeFromWishlist(itemId);
        toast.success("Item removed from wishlist.");
      } else {
        await addToWishlist(itemId);
        toast.success("Item added to wishlist!");
      }
    } catch (error) {
      console.error("Wishlist operation failed:", error);
      toast.error("Please log in to add items to your wishlist.");
    }
  };

  // --- Effects ---

  // Every product starts clean, and a slow response for the previous product
  // can never replace the one on screen.
  useEffect(() => {
    let stale = false;
    setIsLoading(true);
    setLoadError(null);
    setSize("");
    setSelectedColor("");
    setColorImages([]);
    setImage("");
    setSelectedBottomSection(bottomSection[0]);
    getProduct(productId)
      .then((data) => {
        if (stale) return;
        setProduct(data);
        setRelatedProducts(data.recommendations);
        // Open on a colour that can be bought, when there is one.
        const firstColor =
          data.color?.find((code) =>
            data.variants?.some((variant) => variant.colour?.code === code && variant.available),
          ) ?? data.color?.[0];
        showColor(data, firstColor);
        const reviewScore = calculateReview(data);
        setOverAllReview([
          Math.max(0, Math.min(5, reviewScore[0] || 0)), // Clamp score between 0 and 5
          Math.max(0, Math.min(5, reviewScore[1] || 0)), // Clamp score between 0 and 5
        ]);
      })
      .catch((error) => {
        if (stale) return;
        console.error("Failed to fetch product data:", error);
        setLoadError(error.status === 404 ? "missing" : "failed");
      })
      .finally(() => {
        if (!stale) setIsLoading(false);
      });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, attempt]);

  // Effect to initialize `allImages` array and `currentImageIndex` when product or main image changes
  useEffect(() => {
    if (product.image) {
      const images = [...(colorImages || [])];
      setAllImages(images);

      // Find the index of the currently displayed image
      const currentIndex = images.findIndex((img) => img === image);
      if (currentIndex !== -1) {
        setCurrentImageIndex(currentIndex);
      }
    }
  }, [product, image, colorImages]);

  // --- Image Gallery Navigation Functions ---

  /** Moves to the next image in the `allImages` array. */
  const goToNextImage = () => {
    if (allImages.length > 0) {
      const nextIndex = (currentImageIndex + 1) % allImages.length;
      setCurrentImageIndex(nextIndex);
      setImage(allImages[nextIndex]);
    }
  };

  /** Moves to the previous image in the `allImages` array. */
  const goToPreviousImage = () => {
    if (allImages.length > 0) {
      const prevIndex =
        currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1;
      setCurrentImageIndex(prevIndex);
      setImage(allImages[prevIndex]);
    }
  };

  /**
   * Sets the currently displayed image to a specific index.
   * @param {number} index - The index of the image to display.
   */
  const goToImage = (index) => {
    if (allImages.length > 0 && index >= 0 && index < allImages.length) {
      setCurrentImageIndex(index);
      setImage(allImages[index]);
    }
  };

  // --- Touch Swipe Handlers for Image Gallery ---

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === 0 || touchEndX.current === 0) return; // Prevent issues if touch wasn't fully recorded

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50; // Threshold for a left swipe
    const isRightSwipe = distance < -50; // Threshold for a right swipe

    if (isLeftSwipe) {
      goToNextImage();
    }
    if (isRightSwipe) {
      goToPreviousImage();
    }

    // Reset touch coordinates
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // --- Keyboard Navigation for Image Gallery (Arrow Keys) ---

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isImageModalOpen) {
        // Only handle key presses if modal is open
        if (e.key === "ArrowLeft") {
          goToPreviousImage();
        } else if (e.key === "ArrowRight") {
          goToNextImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentImageIndex, allImages, isImageModalOpen]); // Depend on current image index, all images, and modal open state

  /**
   * Product Skeleton Loader Component
   * Displays a loading skeleton while product data is being fetched.
   */
  const ProductSkeleton = () => (
    <div className="border-t-2 pt-5 sm:pt-10 px-4 sm:px-10">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 w-16 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-3 sm:flex-row animate-pulse">
        {/* Small images (thumbnails) Skeleton */}
        <div className="hidden sm:flex sm:flex-col w-[10vw] gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-20 bg-gray-200 rounded" />
          ))}
        </div>
        {/* Main image Skeleton */}
        <div className="w-full sm:w-[40%]">
          <div className="w-full aspect-square sm:h-[600px] bg-gray-200 rounded" />
        </div>

        {/* Product info Skeleton */}
        <div className="flex-1 mt-4 sm:mt-0">
          <div className="h-6 sm:h-8 w-full sm:w-2/3 bg-gray-200 rounded mb-4" />

          {/* Stars Skeleton */}
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-3 h-3 bg-gray-200 rounded-full" />
            ))}
            <div className="w-8 h-3 bg-gray-200 rounded ml-2" />
          </div>

          <div className="h-6 sm:h-8 w-20 bg-gray-200 rounded mt-4" />
          <div className="h-16 sm:h-20 w-full sm:w-4/5 bg-gray-200 rounded mt-4" />

          {/* Size buttons Skeleton */}
          <div className="flex gap-2 sm:gap-4 my-6 sm:my-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 sm:h-10 w-14 sm:w-16 bg-gray-200 rounded"
              />
            ))}
          </div>

          {/* Color buttons Skeleton */}
          <div className="flex gap-3 sm:gap-4 my-6 sm:my-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-8 bg-gray-200 rounded" />
            ))}
          </div>

          <div className="h-10 sm:h-12 w-32 bg-gray-200 rounded" />
          <hr className="mt-6 sm:mt-8 w-full sm:w-4/5" />

          {/* Product features Skeleton */}
          <div className="mt-4 sm:mt-5 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-3 sm:h-4 w-full sm:w-3/4 bg-gray-200 rounded"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Description section Skeleton */}
      <div className="mt-10 sm:mt-20">
        <div className="flex">
          <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 rounded" />
          <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 rounded ml-2" />
          <div className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 rounded ml-2" />
        </div>
        <div className="border px-4 sm:px-6 py-4 sm:py-6 mt-2">
          <div className="space-y-3 sm:space-y-4">
            <div className="h-3 sm:h-4 w-full bg-gray-200 rounded" />
            <div className="h-3 sm:h-4 w-4/5 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  // Render the skeleton loader while data is loading
  if (isLoading) {
    return <ProductSkeleton />;
  }

  if (loadError) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-gray-700 text-lg">
          {loadError === "missing"
            ? "This product is no longer available."
            : "We could not load this product."}
        </p>
        {loadError === "missing" ? (
          <button type="button" onClick={() => navigate("/")} className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-black">
            Back to home
          </button>
        ) : (
          <button type="button" onClick={() => setAttempt((count) => count + 1)} className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-black">
            Try again
          </button>
        )}
      </div>
    );
  }

  // --- Main Product Display ---
  return (
    <div className="border-t-2 pt-10 px-6 transition-opacity ease-in duration-500 opacity-100">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate("/")} className="hover:text-gray-900">
          Home
        </button>
        <span>/</span>
        {product?.category?.parentCategory?.name ? (
          <button
            onClick={() =>
              navigate(
                `/collection/${OriginalToSlug(
                  product.category.parentCategory.name
                )}/${OriginalToSlug(product.category.name)}`
              )
            }
            className="hover:text-gray-900 capitalize line-clamp-1"
          >
            {product.category.name}
          </button>
        ) : (
          <span className="capitalize line-clamp-1">{product?.category?.name}</span>
        )}
        <span>/</span>
        <span className="text-gray-900 line-clamp-1">{product?.name}</span>
      </div>

      {/* ---------------- Product Information and Images Section ----------------- */}
      <div className="flex-1  flex flex-col gap-2 md:flex-row">
        {/* Enhanced Image Gallery Section */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-[60vw] xl:w-[50vw] ">
          <>
              {/* Main Product Image with Navigation */}
              <div className="relative w-full md:w-[70%]   md:h-[50vh] lg:h-[90vh] overflow-hidden order-1 md:order-2 cursor-pointer group">
                <img
                  className="w-full h-full object-cover rounded-md hover:opacity-90 transition-opacity"
                  src={image}
                  alt={product?.name || "Product image"}
                  onClick={() => handleImageClick(image)}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />

                {/* Navigation Arrows for Main Image */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPreviousImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                      aria-label="Previous image"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
                      aria-label="Next image"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                )}

                {/* Dot Indicators for Main Image */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {allImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white bg-opacity-50 hover:bg-opacity-75"
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail Images Section */}
              <div className="flex p-2 md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto md:h-[50vh] lg:h-[90vh] w-full md:w-[30%] pb-4 lg:pb-0 order-2 md:order-1">
                {/* Additional image thumbnails */}
                {colorImages.map((img, index) => (
                  <img
                    key={img || index} // Use image URL as key if unique, otherwise index
                    src={img}
                    onClick={() => {
                      setImage(img);
                      setCurrentImageIndex(index + 1); // +1 because main image is index 0
                      handleImageClick(img);
                    }}
                    loading="lazy"
                    alt={`Thumbnail ${index + 2} of product`}
                    className={`w-[80px] h-[90px] md:w-full md:h-auto object-cover flex-shrink-0 rounded-md cursor-pointer transition-all hover:opacity-80 ${
                      currentImageIndex === index + 1
                        ? "ring-2 ring-orange-500"
                        : ""
                    }`}
                  />
                ))}
              </div>
          </>

          {/* Image View Modal (full-screen image viewer) */}
          <ImageViewModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            images={allImages}
            currentImageIndex={currentImageIndex}
          />
        </div>
        <div className="flex items-start lg:w-[50vw] justify-between">
          {/* ---------------- Product Details and Actions ------------------ */}
          <div className="flex-1 sm:ml-5">
            <h1 className="font-medium text-2xl mt-2">{product?.name}</h1>
            <div className="flex items-center gap-1 mt-2">
              {renderStars(overAllReview[0])}
              <p className="pl-2">{product?.reviews?.length || 0}</p>
            </div>
            <div className="absolute end-5 flex flex-col lg:flex-row justify-center items-end gap-4">
              <LikeButton
                like={isItemInWishlist(product._id)}
                onLikeClick={(e) => handleLikeClick(e, product._id)}
              />
              <ShareButton product={product} />
            </div>
            <div className="mt-4">
              <p>{getStockStatus(product?.stock)}</p>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-medium text-gray-800">{`₹ ${product?.price}`}</p>
                <p className="text-sm text-gray-500">
                  MRP:{" "}
                  <span className="line-through text-gray-600 font-medium">
                    {`₹ ${product?.mrp}`}
                  </span>
                </p>
              </div>
              <p className="mt-1 text-green-600 font-semibold ">
                You save{" "}
                {Math.round(
                  ((product?.mrp - product?.price) / product?.mrp) * 100
                )}
                %
              </p>
              <p className="mt-1 text-gray-500 text-xs">
                Inclusive of all Taxes
              </p>
            </div>

            {/* Size selection */}
            {/* Size Chart Modal Toggle (currently commented out but kept for future use) */}
            {product?.productCategory?.name && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-full bg-orange-500 text-xs text-black mt-2"
              >
                Size Chart
              </button>
            )}

            <p className="mt-2 mb-3 py-2 text-sm text-gray-500 italic">
              Please refer to size chart from images for accurate measurements
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 my-2 p-2 rounded-md">
              {product?.size?.map((item) => {
                const available = isAvailable(selectedColor, item);
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!available}
                    aria-pressed={item === size}
                    title={available ? undefined : "Sold out in this colour"}
                    onClick={() => setSize(item)}
                    className={`border bg-gray-100 py-2 px-4 rounded-md text-center text-sm transition-all duration-200 ${
                      !available
                        ? "opacity-40 line-through cursor-not-allowed"
                        : item === size
                          ? "ring-2 ring-orange-500 text-black font-bold bg-orange-50"
                          : "font-light"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Color selection using the reusable ColorSelector component */}
            <ColorSelector
              colors={product?.color || []}
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
            />
            <ToastContainer />

            <div className="space-y-4 mt-6">
              {/* Primary Action Buttons: Buy Now and Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={isSoldOut}
                  className="text-black w-full sm:w-auto px-8 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-700 bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                >
                  {isSoldOut ? "SOLD OUT" : "BUY NOW"}
                </button>

                <button
                  onClick={handleAddToCart}
                  disabled={isSoldOut}
                  className="bg-black w-full sm:w-auto text-white px-8 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-700 rounded-md hover:bg-gray-800 transition-colors"
                >
                  ADD TO CART
                </button>
              </div>
            </div>

            <hr className="mt-8 sm:w-4/5" />
            {/* Product features/details list */}
            {/* Product features/details list */}
            <div className="mt-5 bg-gray-50 rounded-lg p-4">
              <dl className="text-sm text-gray-700 space-y-3">
                {product?.weightGrams != null && (
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-900">Net Weight</dt>
                    <dd>{product.weightGrams} gms</dd>
                  </div>
                )}
                {product?.details?.map((item, index) => {
                  const [key, value] = item.split(":");
                  return (
                    <div key={index} className="flex">
                      <dt className="w-32 font-medium text-gray-900">
                        {key.trim()}
                      </dt>
                      <dd>{value?.trim()}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>
          {/* Secondary Action Buttons: Like (Wishlist) and Share */}
        </div>
      </div>
      {/* Size Chart Modal - Rendered conditionally */}
      {isModalOpen && (
        <SizeChartModal
          setIsModalOpen={setIsModalOpen}
          parentCategory={product.productCategory.name}
        />
      )}

      {/* ------------------ Description, Additional Information & Reviews Sections --------------------*/}
      <div className="mt-12">
        {/* Enhanced Section Navigation Tabs */}
        <div className="bg-gray-50 p-1 rounded-xl inline-flex w-full sm:w-auto overflow-hidden shadow-sm">
          {/* Description Tab */}
          <button
            onClick={() => setSelectedBottomSection(bottomSection[0])}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out ${
              selectedBottomSection === bottomSection[0]
                ? "bg-white text-gray-900 shadow-sm transform scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            Description
          </button>

          {/* Additional Information Tab */}
          <button
            onClick={() => setSelectedBottomSection(bottomSection[1])}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out ${
              selectedBottomSection === bottomSection[1]
                ? "bg-white text-gray-900 shadow-sm transform scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            Additional Info
          </button>

          {/* Reviews Tab */}
          <button
            onClick={() => setSelectedBottomSection(bottomSection[2])}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out ${
              selectedBottomSection === bottomSection[2]
                ? "bg-white text-gray-900 shadow-sm transform scale-[1.02]"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
            } flex items-center justify-center gap-2`}
          >
            <span>Reviews</span>
            <div className="flex items-center gap-1">
              <img className="w-4 h-4" src={assets.star_icon} alt="star" />
              <span
                className={`text-xs font-semibold ${
                  selectedBottomSection === bottomSection[2]
                    ? "text-amber-600"
                    : "text-gray-500"
                }`}
              >
                {overAllReview[0]}
              </span>
            </div>
          </button>
        </div>

        {/* Enhanced Content Container */}
        <div className="mt-2 w-full">
          {/* Description Content */}
          {selectedBottomSection === bottomSection[0] && (
            <div className="animate-fade-in bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Product Description
                </h3>
              </div>
              <div className="px-6 py-6 space-y-2">
                <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
                  {product.description
                    ?.split(".")
                    .filter((item) => item.trim())
                    .map((item, index) => (
                      <li key={index}>{item.trim()}</li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {/* Additional Information Content */}
          {selectedBottomSection === bottomSection[1] && (
            <div className="animate-fade-in bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Additional Information
                </h3>
              </div>

              <div className="px-6 py-6 space-y-3">
                {product.addInfo
                  ?.split("\n")
                  .filter((line) => line.trim())
                  .map((line, index) => {
                    const [heading, ...rest] = line.split(":");
                    return (
                      <p key={index} className="text-gray-700 leading-relaxed">
                        <span className="font-semibold text-gray-900">
                          {heading.trim()}:
                        </span>{" "}
                        {rest.join(":").trim()}
                      </p>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Reviews Content */}
          {selectedBottomSection === bottomSection[2] && (
            <div className="animate-fade-in bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Customer Reviews
                  </h3>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                    <img
                      className="w-4 h-4"
                      src={assets.star_icon}
                      alt="star"
                    />
                    <span className="font-semibold text-amber-600">
                      {overAllReview[0]}
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({product.reviews?.length || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                <ReviewForm productId={product._id} />
                {product.reviews?.length > 0 ? (
                  product.reviews.map((review, index) => (
                    <ReviewBox key={index} review={review} />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <img
                        className="w-8 h-8 opacity-50"
                        src={assets.star_dull_icon}
                        alt="no reviews"
                      />
                    </div>
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-sm text-gray-400">
                      Reviews come from customers whose order has arrived
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------ Related Products Section --------------------*/}
      <div className="mt-10">
        <h1 className="text-2xl font-semibold mb-4">Related Products</h1>

        <div className="flex   overflow-x-auto space-x-4 scrollbar-hide scroll-smooth snap-x snap-mandatory px-1">
          {relatedProducts?.map((item) => (
            <div key={item._id} className="snap-start shrink-0 w-60">
              <ProductItem
                id={item._id}
                name={item.name}
                image={item.image}
                mrp={item.mrp}
                price={item.price}
                colors={item.color || []}
                like={isItemInWishlist(item._id)}
                onLikeClick={(e) => handleLikeClick(e, item._id)}
                onClick={() => navigate(`/product/${item._id}`)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Product;
