// import React, { useEffect, useState, useCallback } from "react";
// import {
//   assets,
//   heroSlideContent,
//   desktopBanners,
//   mobileBanners,
// } from "../assets/assets";
// import { motion, AnimatePresence } from "framer-motion";

// function Hero() {
//   const [currentImage, setCurrentImage] = useState(0);
//   const [direction, setDirection] = useState(0);
//   const [isMobile, setIsMobile] = useState(false);

//   // Initialize isMobile in useEffect to avoid SSR mismatch
//   useEffect(() => {
//     setIsMobile(window.innerWidth <= 768);
//   }, []);

//   // Memoize the current banner calculation
//   const currentBanner = isMobile
//     ? mobileBanners[currentImage]
//     : desktopBanners[currentImage];

//   // Memoize the handleResize function
//   const handleResize = useCallback(() => {
//     setIsMobile(window.innerWidth <= 768);
//   }, []);

//   useEffect(() => {
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [handleResize]);

//   const nextImage = useCallback(() => {
//     setDirection(1);
//     setCurrentImage((prev) =>
//       prev === desktopBanners.length - 1 ? 0 : prev + 1
//     );
//   }, []);

//   const prevImage = useCallback(() => {
//     setDirection(-1);
//     setCurrentImage((prev) =>
//       prev === 0 ? desktopBanners.length - 1 : prev - 1
//     );
//   }, []);

//   const getSlideDistance = () => {
//     if (window.innerWidth >= 1024) return 1000;
//     if (window.innerWidth >= 768) return 500;
//     if (window.innerWidth >= 640) return 300;
//     return 100;
//   };

//   const slideVariants = {
//     enter: (direction) => ({
//       x: direction > 0 ? getSlideDistance() : -getSlideDistance(),
//       opacity: 0,
//     }),
//     center: {
//       zIndex: 1,
//       x: 0,
//       opacity: 1,
//     },
//     exit: (direction) => ({
//       zIndex: 0,
//       x: direction < 0 ? getSlideDistance() : -getSlideDistance(),
//       opacity: 0,
//     }),
//   };

//   const textVariants = {
//     initial: (direction) => ({
//       opacity: 0,
//       x: direction > 0 ? 100 : -100,
//       scale: 0.95,
//     }),
//     animate: {
//       opacity: 1,
//       x: 0,
//       scale: 1,
//     },
//     exit: (direction) => ({
//       opacity: 0,
//       x: direction > 0 ? -100 : 100,
//       scale: 0.95,
//     }),
//   };

//   const transitionProps = {
//     type: "tween",
//     duration: 1,
//     stiffness: 300,
//     damping: 20,
//   };

//   useEffect(() => {
//     const slideInterval = setInterval(nextImage, 5000);
//     return () => clearInterval(slideInterval);
//   }, [nextImage]);

//   const NavigationButton = ({ onClick, direction, className }) => (
//     <button
//       onClick={onClick}
//       className={`absolute top-1/2 -translate-y-1/2 z-20
//         w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
//         rounded-full
//         bg-white/30 backdrop-blur-md
//         flex items-center justify-center
//         hover:bg-white/50
//         transition
//         ${className}`}
//       aria-label={direction === "left" ? "Previous slide" : "Next slide"}
//     >
//       <img
//         src={direction === "left" ? assets.arrow_left : assets.arrow_right}
//         alt={direction === "left" ? "Previous" : "Next"}
//         className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
//       />
//     </button>
//   );

//   return (
//     <div className="relative w-full h-[70vh] md:h-[60vh] lg:h-[80vh] xl:h-[90vh] overflow-hidden">
//       <AnimatePresence initial={false} custom={direction}>
//         <motion.img
//           key={currentImage}
//           custom={direction}
//           variants={slideVariants}
//           initial="enter"
//           animate="center"
//           exit="exit"
//           transition={transitionProps}
//           src={currentBanner}
//           alt={`Slide ${currentImage + 1}`}
//           className="absolute w-full h-full object-cover"
//           loading="lazy"
//         />
//       </AnimatePresence>

//       {/* Uncomment if you want to use the overlay content */}
//       {/* <div className="absolute inset-0 bg-black/20"></div>
//       <AnimatePresence mode="wait">
//         <motion.div
//           key={currentImage}
//           custom={direction}
//           variants={textVariants}
//           initial="initial"
//           animate="animate"
//           exit="exit"
//           transition={transitionProps}
//           className="absolute inset-0 flex items-end justify-end p-4 sm:p-6 md:p-10"
//         >
//           <div className="text-right text-white space-y-2 sm:space-y-3 md:space-y-4">
//             <motion.p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-medium">
//               {heroSlideContent[currentImage].subtitle}
//             </motion.p>
//             <motion.h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
//               {heroSlideContent[currentImage].title}
//             </motion.h2>
//             <motion.button
//               className="rounded-full
//                 bg-black
//                 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3
//                 text-sm sm:text-base md:text-lg
//                 text-white
//                 hover:bg-gray-800
//                 transition"
//             >
//               {heroSlideContent[currentImage].buttonText}
//             </motion.button>
//           </div>
//         </motion.div>
//       </AnimatePresence> */}

//       <NavigationButton
//         onClick={prevImage}
//         direction="left"
//         className="left-2 sm:left-4"
//       />
//       <NavigationButton
//         onClick={nextImage}
//         direction="right"
//         className="right-2 sm:right-4"
//       />

//       {/* Optional: Add slide indicators */}
//       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
//         {desktopBanners.map((_, index) => (
//           <button
//             key={index}
//             onClick={() => {
//               setDirection(index > currentImage ? 1 : -1);
//               setCurrentImage(index);
//             }}
//             className={`w-2 h-2 rounded-full transition-colors ${
//               index === currentImage ? "bg-white" : "bg-white/50"
//             }`}
//             aria-label={`Go to slide ${index + 1}`}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Hero;

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DotIndicators from "./DotIndicator";
import sliderService from "../context/sliderService";

/**
 * Hero Carousel Component
 * Displays a full-screen, interactive hero section with rotating background images,
 * dynamic text content, and navigation controls. Supports desktop, mobile,
 * and accessibility features like keyboard and touch navigation.
 * Now integrated with backend API for dynamic content.
 */
function Hero() {
  // --- State Management ---
  const [slides, setSlides] = useState([]); // Slides data from API
  const [currentImage, setCurrentImage] = useState(0); // Index of the currently displayed slide
  const [direction, setDirection] = useState(0); // Direction of slide change (1 for next, -1 for previous)
  const [isMobile, setIsMobile] = useState(false); // Flag to determine if the device is mobile
  const [isScrolling, setIsScrolling] = useState(false); // Flag to prevent rapid slide changes during animation
  const [touchStart, setTouchStart] = useState(null); // X-coordinate of touch start
  const [touchEnd, setTouchEnd] = useState(null); // X-coordinate of touch end
  const [loading, setLoading] = useState(true); // Loading state for API call
  const [error, setError] = useState(null); // Error state for API failures

  // --- Refs for DOM Elements and Timers ---
  const heroRef = useRef(null); // Ref to the main hero div for attaching event listeners
  const wheelTimeoutRef = useRef(null); // Ref for wheel event debounce timer
  const autoSlideIntervalRef = useRef(null); // Ref for auto-slide interval timer
  const impressionTrackedRef = useRef(new Set()); // Track which slides have had impressions logged

  // --- Constants ---
  const SWIPE_THRESHOLD = 50; // Minimum pixel distance for a successful swipe
  const ANIMATION_DURATION = 1000; // Duration of slide transition in milliseconds
  const AUTO_SLIDE_INTERVAL = 8000; // Interval for auto-sliding in milliseconds

  // --- Effects ---

  // Fetch slides from API on component mount
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await sliderService.getActiveSliders();

        if (response.success && response.data.length > 0) {
          setSlides(response.data);
          setCurrentImage(0);
        } else {
          setError("No active slides found");
        }
      } catch (err) {
        console.error("Failed to fetch slides:", err);
        setError("Failed to load slides. Please try again later.");
        // Fallback to empty array to prevent crashes
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  // Track impression for current slide
  useEffect(() => {
    if (slides.length > 0 && !loading) {
      const currentSlide = slides[currentImage];
      if (currentSlide && !impressionTrackedRef.current.has(currentSlide.id)) {
        sliderService.trackImpression(currentSlide.id);
        impressionTrackedRef.current.add(currentSlide.id);
      }
    }
  }, [currentImage, slides, loading]);

  // Initialize `isMobile` state based on window width on component mount
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  // Update `isMobile` state on window resize
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // --- Core Slide Navigation Logic ---

  /**
   * Changes the current slide to a new index.
   * Prevents changes if an animation is already in progress.
   * @param {number} newIndex - The index of the slide to navigate to.
   * @param {number} dir - The direction of navigation (1 for next, -1 for previous).
   */
  const changeSlide = useCallback(
    (newIndex, dir) => {
      if (isScrolling || slides.length === 0) return; // Do not change slide if already animating or no slides

      setIsScrolling(true); // Indicate that a slide change is in progress
      setDirection(dir); // Set animation direction
      setCurrentImage(newIndex); // Update current slide index

      // Reset `isScrolling` after the animation duration
      setTimeout(() => {
        setIsScrolling(false);
      }, ANIMATION_DURATION);
    },
    [isScrolling, slides.length]
  );

  /** Navigates to the next slide in the carousel. */
  const nextImage = useCallback(() => {
    if (slides.length === 0) return;
    const newIndex = currentImage === slides.length - 1 ? 0 : currentImage + 1;
    changeSlide(newIndex, 1); // Direction 1 for next
  }, [currentImage, changeSlide, slides.length]);

  /** Navigates to the previous slide in the carousel. */
  const prevImage = useCallback(() => {
    if (slides.length === 0) return;
    const newIndex = currentImage === 0 ? slides.length - 1 : currentImage - 1;
    changeSlide(newIndex, -1); // Direction -1 for previous
  }, [currentImage, changeSlide, slides.length]);

  // --- Event Handlers for User Interaction ---




  /**
   * Records the starting X-coordinate for touch swipe gestures.
   * @param {TouchEvent} e - The touch start event object.
   */
  const handleTouchStart = useCallback((e) => {
    // Reset touchEnd to ensure a new swipe gesture starts clean
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  /**
   * Records the current X-coordinate during touch swipe gestures.
   * @param {TouchEvent} e - The touch move event object.
   */
  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  /**
   * Determines swipe direction and triggers slide change on touch release.
   * @param {TouchEvent} e - The touch end event object.
   */
  const handleTouchEnd = useCallback(() => {
    if (
      isScrolling ||
      touchStart === null ||
      touchEnd === null ||
      slides.length === 0
    )
      return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > SWIPE_THRESHOLD; // Swiped left (moved finger left)
    const isRightSwipe = distance < -SWIPE_THRESHOLD; // Swiped right (moved finger right)

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    // Reset touch coordinates for the next swipe
    setTouchStart(null);
    setTouchEnd(null);
  }, [isScrolling, touchStart, touchEnd, nextImage, prevImage, slides.length]);

  /**
   * Handles keyboard arrow key presses for navigation.
   * @param {KeyboardEvent} e - The keyboard event object.
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (isScrolling || slides.length === 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextImage();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        prevImage();
      }
    },
    [isScrolling, nextImage, prevImage, slides.length]
  );

  /**
   * Handles CTA button click and tracks the click event
   */
  const handleCTAClick = useCallback((slide) => {
    // Track click event
    sliderService.trackClick(slide.id);

    // Navigate to CTA link if provided
    if (slide.ctaLink && slide.ctaLink !== "#") {
      if (slide.ctaLink.startsWith("http")) {
        window.open(slide.ctaLink, "_blank");
      } else {
        window.location.href = slide.ctaLink;
      }
    }
  }, []);

  // --- Event Listener Setup and Cleanup ---
  useEffect(() => {
    const heroElement = heroRef.current;
    if (!heroElement || slides.length === 0) return;

   
    // Attach passive: true for touch events for better performance
    heroElement.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    heroElement.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    heroElement.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("keydown", handleKeyDown); // Listen for keyboard events on the document

    // Cleanup function: remove all event listeners and clear timeouts
    return () => {
     
      heroElement.removeEventListener("touchstart", handleTouchStart);
      heroElement.removeEventListener("touchmove", handleTouchMove);
      heroElement.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
    };
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    slides.length,
  ]);

  // --- Framer Motion Variants and Transitions ---

  /** Dynamically calculates the slide distance for Framer Motion animations based on screen width. */
  const getSlideDistance = () => {
    if (window.innerWidth >= 1024) return 1000; // Large screens
    if (window.innerWidth >= 768) return 500; // Tablets
    if (window.innerWidth >= 640) return 300; // Small tablets/large mobiles
    return 100; // Default for mobile
  };

  // Variants for image slide animation
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? getSlideDistance() : -getSlideDistance(),
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? getSlideDistance() : -getSlideDistance(),
      opacity: 0,
    }),
  };

  // Variants for text content container (stagger effect)
  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  // Variants for individual text elements and CTA
  const itemVariants = {
    initial: {
      opacity: 0,
      y: 30,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "tween",
        duration: 0.5,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  // Common transition properties for Framer Motion
  const transitionProps = {
    type: "tween",
    duration: ANIMATION_DURATION / 1000,
    ease: "easeInOut",
  };

  // --- Auto-slide Functionality ---
  useEffect(() => {
    if (slides.length === 0) return;

    // Clear any existing interval to prevent multiple intervals running
    if (autoSlideIntervalRef.current) {
      clearInterval(autoSlideIntervalRef.current);
    }
    // Set a new interval for auto-sliding
    autoSlideIntervalRef.current = setInterval(nextImage, AUTO_SLIDE_INTERVAL);

    // Cleanup function to clear interval on component unmount or dependency change
    return () => {
      if (autoSlideIntervalRef.current) {
        clearInterval(autoSlideIntervalRef.current);
      }
    };
  }, [nextImage, slides.length]);

  // --- Loading and Error States ---
  if (loading) {
    return (
      <div className="relative w-full px-4 py-6 md:px-6 md:py-8 mx-auto max-w-7xl">
        <div className="relative w-full h-[60vh] overflow-hidden rounded-3xl shadow-xl bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-500 text-lg">Loading slides...</div>
        </div>
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div></div>
    );
  }

  // Get current slide data
  const currentSlide = slides[currentImage];
  const currentBanner = isMobile ? currentSlide.mobile : currentSlide.desktop;

  // --- Rendered Component (JSX) ---
  return (
    <div className=" relative w-full px-4 py-6 md:px-6 md:py-8 mx-auto lg:px-10">
      <div
        ref={heroRef}
        className="relative w-full h-[60vh] lg:h-[80vh] overflow-hidden cursor-grab active:cursor-grabbing rounded-3xl shadow-xl"
        style={{ touchAction: "pan-y" }}
      >
        {/* Background Images with Framer Motion Animation */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentImage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transitionProps}
            className="absolute inset-0"
          >
            <img
              src={currentBanner}
              alt={`Slide ${currentImage + 1}: ${currentSlide.title}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                console.error("Image failed to load:", currentBanner);
                e.target.src =
                  "https://via.placeholder.com/1200x800/cccccc/666666?text=Image+Not+Found";
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        </AnimatePresence>

        {/* Content Overlay */}
        <div
          className="absolute inset-0 flex items-end justify-start md:justify-end z-20 pb-12 sm:pb-16 md:pb-20
                        px-4 sm:px-6 md:px-12 lg:px-20  "
        >
          <div className="text-left md:text-right text-white max-w-md md:max-w-2xl  md:ml-auto ">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentImage + "-content"}
                custom={direction}
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-2"
              >
                <motion.h1
                  variants={itemVariants}
                  className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-wider"
                >
                  {currentSlide.title}
                </motion.h1>
                <motion.p
                  variants={itemVariants}
                  className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed opacity-90"
                >
                  {currentSlide.subtitle}
                </motion.p>
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCTAClick(currentSlide)}
                  className="mt-6 sm:mt-8 px-8 sm:px-10 md:px-12 py-3 sm:py-4
                            bg-orange-500 text-black font-semibold text-sm sm:text-base
                            rounded-full hover:bg-orange-600 transition-all duration-300
                            shadow-lg hover:shadow-xl 
                            relative overflow-hidden cursor-pointer"
                >
                  {currentSlide.cta}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Dot Indicators */}
      <DotIndicators
        currentSlideIndex={currentImage}
        totalSlides={slides.length}
        changeSlide={changeSlide}
        isAnimating={isScrolling}
      />
    </div>
  );
}

export default Hero;
