import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useCollections } from '../context/CollectionsContext';
import SparkleButton from './Buttons/SparkleButton';
import TabContainer from './Buttons/TabSelector';
import {  useNavigate } from 'react-router-dom';

const CollectionsCategory = () => {
  const [activeTab, setActiveTab] = useState('Men');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);

  const { CollectionsData: cachedCollections, fetchCollections, error } = useCollections();
  const isLoading = Object.keys(cachedCollections).length === 0 && !error;
  const tabs = ["Men", "Women"];
  const navigate = useNavigate(); 
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Trigger card animations on tab change
  useEffect(() => {
    if (!isLoading && cachedCollections[activeTab]) {
      setAnimateCards(true);
      const timer = setTimeout(() => setAnimateCards(false), 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isLoading, cachedCollections]);

  const CategoryCard = ({ category, index, shouldAnimate,onClick }) => {
    const isHovered = hoveredCard === category.id;
    const animationDelay = `${index * 120}ms`;

    return (
      <div onClick={onClick}
        className={`group relative overflow-hidden cursor-pointer rounded-3xl ${
          shouldAnimate ? 'animate-smooth-enter' : ''
        }`}
        style={shouldAnimate ? { animationDelay } : {}}
        onMouseEnter={() => setHoveredCard(category.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[620px] overflow-hidden rounded-3xl shadow-lg transition-all duration-500 ease-out transform ${
          isHovered 
            ? ' shadow-2xl shadow-black/20 ' 
            : ' shadow-lg hover:shadow-xl'
        }`}>
          
          {/* Background Image */}
       <div className="absolute inset-0">
    <img 
        src={category.thumbnail}
        alt={category.name}
        className={`w-full h-full object-cover transition-all duration-1000 ease-out ${
            isHovered 
            ? ' brightness-110 contrast-105' 
            : 'brightness-100 contrast-100'
        }`}
    />
</div>

          {/* Gradient Overlays */}
          <div className={`absolute inset-0 bg-gradient-to-t transition-all duration-500 ${
            isHovered 
              ? 'from-black/50 via-black/10 to-transparent' 
              : 'from-black/70 via-black/20 to-transparent'
          }`}></div>
          
          <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
            isHovered 
              ? 'from-orange-500/10 via-black-500/5 to-black-500/10 opacity-100' 
              : 'from-transparent to-transparent opacity-0'
          }`}></div>

          {/* Floating Badge */}
          <div className={`absolute right-0 transition-all duration-500`}>
            <SparkleButton />
          </div>

          {/* Category Content */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2"></div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className={`transition-all duration-500 `}>
                <h3 className={`font-black text-white tracking-tight leading-none text-2xl sm:text-3xl md:text-4xl lg:text-5xl transition-all duration-500 ${
                  isHovered 
                    ? 'text-shadow-glow transform ' 
                    : 'transform '
                }`}>
                  {category.name}
                </h3>
                
                <div className={`text-white/80 font-medium text-sm sm:text-base transition-all duration-500 delay-100 ${
                  isHovered 
                    ? ' text-white/100' 
                    : ' text-white/80'
                }`}>
                  Discover Collection
                  <ArrowRight className={`inline ml-2 w-4 h-4 transition-all duration-500 ${
                    isHovered 
                      ? ' opacity-100' 
                      : ' opacity-70'
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Shimmer Effect */}
          <div className={`absolute inset-0 transition-all duration-700 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-[-25deg] animate-shimmer"></div>
          </div>

          {/* Floating Particles */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + i * 0.5}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 rounded-3xl shadow-lg min-h-[380px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[620px]">
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header Skeleton */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="h-12 sm:h-16 md:h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl w-64 sm:w-80 md:w-96 mx-auto mb-4 sm:mb-6 animate-pulse shadow-lg"></div>
            <div className="h-4 sm:h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-80 sm:w-96 md:w-[500px] mx-auto animate-pulse"></div>
          </div>
          
          {/* Tabs Skeleton */}
          <div className="flex justify-center space-x-4 sm:space-x-6 mb-12 sm:mb-16">
            <div className="h-12 sm:h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-24 sm:w-32 md:w-40 animate-pulse shadow-lg"></div>
            <div className="h-12 sm:h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl w-24 sm:w-32 md:w-40 animate-pulse shadow-lg"></div>
          </div>
          
          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-800 mb-3 sm:mb-4 tracking-tight">
            Style
            <span className="bg-gradient-to-r from-orange-200 to-orange-400 bg-clip-text text-transparent"> Collections</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium px-4">
            Discover curated collections that define your unique style and personality
          </p>
        </div>

        <div className="flex justify-center pb-6">
          <TabContainer
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Collections Grid */}
        <div className="relative mx-auto">
          <div key={activeTab} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {cachedCollections[activeTab]?.slice(0, 4).map((category, index) => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                index={index}
                shouldAnimate={animateCards}
                      onClick={() => {
                            navigate(
                              `/collection/${activeTab}/${category.name}`
                            );
                          }}
              />
            )) || (
              <div className="col-span-full text-center py-16 sm:py-20">
                <div className="text-gray-400 text-xl sm:text-2xl font-bold">No collections available</div>
              </div>
            )}
          </div>
        </div>

        {/* Show More Button */}
        {cachedCollections[activeTab]?.length > 4 && (
          <div className="text-center mt-8 sm:mt-12">
            <button className="bg-white text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-50 shadow-lg border border-gray-200 transition-colors duration-300">
              View All Collections
              <ArrowRight className="inline ml-2 w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes smoothEnter {
          0% { 
            opacity: 0; 
            transform: translate3d(0, 30px, 0) scale(0.95) rotateX(5deg);
            filter: blur(3px);
          }
          60% {
            opacity: 0.9;
            filter: blur(1px);
          }
          100% { 
            opacity: 1; 
            transform: translate3d(0, 0, 0) scale(1) rotateX(0deg);
            filter: blur(0px);
          }
        }
        
        .animate-smooth-enter {
          animation: smoothEnter 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          backface-visibility: hidden;
          perspective: 1000px;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-25deg);
          }
          100% {
            transform: translateX(200%) skewX(-25deg);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 1.5s ease-out;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 1;
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .text-shadow-glow {
          text-shadow: 
            0 0 10px rgba(255, 255, 255, 0.3),
            0 0 20px rgba(255, 255, 255, 0.2),
            0 0 30px rgba(255, 255, 255, 0.1);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-smooth-enter,
          .animate-shimmer,
          .animate-float {
            animation: none !important;
          }
          
          .group:hover .transition-all,
          .transition-all {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CollectionsCategory;