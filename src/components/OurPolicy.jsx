import React from "react";
import {
  Shield,
  ArrowLeftRight,
  Clock,
  Truck,
  HeadphonesIcon,
  BadgeCheck,
} from "lucide-react";
import { BoldTitle, Title } from "./Title";
import { Link } from "react-router-dom";

const PolicyHighlight = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center p-6 transition-all duration-300 ease-out   group bg-white rounded-2xl">
    
    {/* Simple background hover effect */}
    <div className="absolute inset-0 bg-orange-50/0  transition-all duration-300 rounded-2xl"></div>
    
    {/* Icon wrapper */}
    <div className="mb-4 p-3 rounded-full bg-orange-50 transition-all duration-300 group-hover:bg-orange-100 group-hover:scale-110 relative z-10">
      <Icon 
        className="w-8 h-8 text-orange-700 transition-all duration-300 group-hover:text-orange-800" 
        strokeWidth={1.5} 
      />
    </div>
    
    {/* Title */}
    <h3 className="font-semibold text-gray-800 mb-2 transition-colors duration-300 group-hover:text-gray-900 text-center">
      {title}
    </h3>
    
    {/* Description */}
    <p className="text-gray-600 text-sm text-center transition-colors duration-300 group-hover:text-gray-700 leading-relaxed">
      {description}
    </p>
  </div>
);

/* Simple CSS Animations */
const animationStyles = `
  /* Reduce motion for accessibility */
  @media (prefers-reduced-motion: reduce) {
    .transition-all,
    .transition-transform {
      transition: none !important;
    }
  }
`;

const PolicyHighlights = () => {
  const policies = [
    {
      icon: Clock,
      title: "7 Days Return",
      description: "Full refund within 7 days for manufacturing defects",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      description: "Dedicated customer support team at your service",
    },
    {
      icon: BadgeCheck,
      title: "Quality Assured",
      description: "Every product passes our quality checks",
    },
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "100% secure payment processing",
    },
    {
      icon: Truck,
      title: "Free Shipping",
      description: "Free delivery on all prepaid orders",
    },
  ];

  return (
    <div className="bg-canvas py-16 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header section */}
        <div className="text-center mb-6">
          <div className="text-3xl md:text-4xl mb-2">
            <BoldTitle text1={"Our"} text2={" Policies"} />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            We believe in making your shopping experience as smooth as possible
            with our customer-friendly policies
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {policies.map((policy, index) => (
            <PolicyHighlight
              key={index}
              icon={policy.icon}
              title={policy.title}
              description={policy.description}
            />
          ))}
        </div>
           {/* Bottom CTA section */}
        <div className="text-center mt-16 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full   transition-all duration-300 hover:bg-white hover:border-orange-200/50">
            <span className="text-gray-600 text-sm font-medium">Have questions about our policies?</span>
            <span className="text-orange-700 text-sm font-semibold hover:text-orange-800 cursor-pointer transition-colors">
               <Link
              to="/contact"
              className="hover:font-medium transition-colors duration-300"
            >
              Contact Us →
            </Link>
            </span>
          </div>
        </div>
      </div>
      
      <style>{animationStyles}</style>
    </div>
  );
};

export default PolicyHighlights;