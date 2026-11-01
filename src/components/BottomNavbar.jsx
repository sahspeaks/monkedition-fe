
// import React, { useState, useEffect } from "react";
// import { NavLink, useNavigate, useLocation } from "react-router-dom";
// import { assets } from "../assets/assets";
// import { useCollections } from "../context/CollectionsContext";
// import { useAuth } from "../context/NewAuthContext";
// import { GrContact } from "react-icons/gr";
// import { IoCubeOutline, IoHeartOutline, IoSparklesOutline, IoStarOutline } from "react-icons/io5";
// import { FaMale } from "react-icons/fa";
// import { FaFemale } from "react-icons/fa";
// function BottomNavBar() {
//     const [showCollectionsModal, setShowCollectionsModal] = useState(false);
//     const [showProfileModal, setShowProfileModal] = useState(false);
//     const [expandedSubcategories, setExpandedSubcategories] = useState({});
//     const { CollectionsData, isLoading, error, fetchCollections } = useCollections();
//     const { user, logout } = useAuth();
//     const navigate = useNavigate();
//     const location = useLocation();

//     const SkeletonItem = () => (
//         <div className="animate-pulse">
//             <div className="bg-gray-200 h-10 rounded-lg my-2 mx-3"></div>
//         </div>
//     );

//     useEffect(() => {
//         fetchCollections();
//     }, [fetchCollections]);

//     const toggleSubcategories = (category) => {
//         setExpandedSubcategories((prev) => ({
//             ...prev,
//             [category]: !prev[category],
//         }));
//     };

//     const handleSubcategoryClick = (category, subcategory) => {
//         const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
//         const subcategorySlug = subcategory.name.toLowerCase().replace(/\s+/g, "-");
//         navigate(`/collection/${categorySlug}/${subcategorySlug}`);
//         setShowCollectionsModal(false);
//     };

//     const handleLogout = () => {
//         logout();
//         setShowProfileModal(false);
//     };

//     const isActive = (path) => location.pathname === path;

//     // Collections Modal
//     // Enhanced Collections Modal
//     const CollectionsModal = () => (
//         <div
//             className={`fixed inset-0  bg-black/60 backdrop-blur-sm z-50 transition-all duration-300 ${showCollectionsModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
//                 }`}
//             onClick={() => setShowCollectionsModal(false)}
//         >
//             <div
//                 className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] overflow-hidden transition-transform duration-300 shadow-2xl ${showCollectionsModal ? 'translate-y-0' : 'translate-y-full'
//                     }`}
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 {/* Enhanced Header */}
//                 <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 z-10">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-3">
//                             <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
//                                 <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
//                                     <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
//                                 </svg>
//                             </div>
//                             <h3 className="text-xl font-bold text-gray-900">Collections</h3>
//                         </div>
//                         <button
//                             onClick={() => setShowCollectionsModal(false)}
//                             className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors duration-200 group"
//                         >
//                             <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                             </svg>
//                         </button>
//                     </div>

//                     {/* Quick Stats */}
//                     {CollectionsData && (
//                         <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
//                             <span>{Object.keys(CollectionsData).length} categories</span>
//                             <span>•</span>
//                             <span>{Object.values(CollectionsData).reduce((total, items) => total + items.length, 0)} items</span>
//                         </div>
//                     )}
//                 </div>

//                 {/* Scrollable Content */}
//                 <div className="overflow-y-auto pb-6" style={{ maxHeight: 'calc(75vh - 120px)' }}>
//                     <div className="px-4 pt-2">
//                         {isLoading || error != null ? (
//                             // Enhanced Loading State
//                             <div className="space-y-4">
//                                 {Array(4).fill(0).map((_, index) => (
//                                     <div key={index} className="animate-pulse">
//                                         <div className="h-14 bg-gray-200 rounded-xl mb-2"></div>
//                                         <div className="ml-4 space-y-2">
//                                             <div className="h-10 bg-gray-100 rounded-lg w-3/4"></div>
//                                             <div className="h-10 bg-gray-100 rounded-lg w-1/2"></div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : CollectionsData ? (
//                             <div className="space-y-3">
//                                 {Object.entries(CollectionsData).map(([category, items]) => (
//                                     <div key={category} className="bg-gray-50/50 rounded-2xl overflow-hidden">
//                                         {/* Category Header */}
//                                         <div
//                                             onClick={() => toggleSubcategories(category)}
//                                             className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 hover:bg-gray-100/80 ${expandedSubcategories[category]
//                                                 ? "bg-orange-50 "
//                                                 : "bg-white/80"
//                                                 }`}
//                                         >
//                                             <div className="flex items-center space-x-3">
//                                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${expandedSubcategories[category]
//                                                     ? "bg-orange-100 text-orange-700"
//                                                     : "bg-gray-100 text-gray-600"
//                                                     }`}>
//                                                     {/* <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                                                         <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
//                                                     </svg> */}
//                                                     {
//                                                         (category === "Newly Added")
//                                                             ? <IoSparklesOutline />
//                                                             : (category === "Men's Clothing")
//                                                             ?<FaMale />
//                                                             : (category === "Women's Clothing")
//                                                             ? <FaFemale />
//                                                             : <IoCubeOutline />
//                                                     }
//                                                 </div>
//                                                 <div>
//                                                     <p className={`font-semibold transition-colors duration-200 ${expandedSubcategories[category]
//                                                         ? "text-orange-700"
//                                                         : "text-gray-800"
//                                                         }`}>
//                                                         {category}
//                                                     </p>
//                                                     <p className="text-xs text-gray-500 mt-0.5">
//                                                         {items.length} item{items.length !== 1 ? 's' : ''}
//                                                     </p>
//                                                 </div>
//                                             </div>

//                                             <div className={`p-2 rounded-lg transition-all duration-200 ${expandedSubcategories[category]
//                                                 ? "bg-orange-100 text-orange-700 rotate-180"
//                                                 : "bg-gray-100 text-gray-500 hover:bg-gray-200"
//                                                 }`}>
//                                                 <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//                                                 </svg>
//                                             </div>
//                                         </div>

//                                         {/* Items List */}
//                                         <div
//                                             className={`transition-all duration-300 ease-in-out ${expandedSubcategories[category]
//                                                 ? "max-h-96 opacity-100"
//                                                 : "max-h-0 opacity-0"
//                                                 }`}
//                                         >
//                                             <div className="px-2 pb-2">
//                                                 {items.map((item, subindex) => (
//                                                     <div
//                                                         key={subindex}
//                                                         onClick={() => handleSubcategoryClick(category, item)}
//                                                         className="flex items-center space-x-3 px-4 py-3 mx-1 rounded-xl hover:bg-white/80 cursor-pointer transition-all duration-200 group hover:shadow-sm"
//                                                     >
                                                        
//                                                             <img
//                                                                 src={item.thumbnail || assets.p_img1}
//                                                                 alt={item.name}
//                                                                 className="h-10 w-10 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all duration-200"
//                                                             />
                                                      

//                                                         <div className="flex-1 min-w-0">
//                                                             <p className="font-medium text-gray-800 truncate group-hover:text-orange-800 transition-colors duration-200">
//                                                                 {item.name}
//                                                             </p>
//                                                             {item.description && (
//                                                                 <p className="text-xs text-gray-500 truncate mt-0.5">
//                                                                     {item.description}
//                                                                 </p>
//                                                             )}
//                                                         </div>

//                                                         <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                                                             <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
//                                                             </svg>
//                                                         </div>
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             // Empty State
//                             <div className="text-center py-12">
//                                 <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//                                     <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//                                     </svg>
//                                 </div>
//                                 <p className="text-gray-600 font-medium">No collections found</p>
//                                 <p className="text-gray-400 text-sm mt-1">Your collections will appear here</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );

//     // Profile Modal
//     const ProfileModal = () => (
//         <div
//             className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${showProfileModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
//                 }`}
//             onClick={() => setShowProfileModal(false)}
//         >
//             <div
//                 className={`fixed bottom-24 left-4 right-4 bg-white rounded-2xl transition-transform duration-300 shadow-2xl ${showProfileModal ? 'translate-y-0' : 'translate-y-full'
//                     }`}
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center rounded-t-2xl">
//                     <h3 className="text-lg font-semibold text-gray-800">Profile Menu</h3>
//                     <button
//                         onClick={() => setShowProfileModal(false)}
//                         className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
//                     >
//                         <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                     </button>
//                 </div>

//                 <div className="p-4 space-y-2">
//                     {user ? (
//                         <>
//                             <NavLink
//                                 to="/wishlist"
//                                 onClick={() => setShowProfileModal(false)}
//                                 className="flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-300 group"
//                             >
//                                 <svg className="w-5 h-5 text-pink-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//                                 </svg>
//                                 <span className="text-gray-700 group-hover:text-gray-900">Wishlist</span>
//                             </NavLink>
//                             <NavLink
//                                 to="/orders"
//                                 onClick={() => setShowProfileModal(false)}
//                                 className="flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-300 group"
//                             >
//                                 <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                                 </svg>
//                                 <span className="text-gray-700 group-hover:text-gray-900">My Orders</span>
//                             </NavLink>
//                             <NavLink
//                                 to="/profile"
//                                 onClick={() => setShowProfileModal(false)}
//                                 className="flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-300 group"
//                             >
//                                 <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                                 </svg>
//                                 <span className="text-gray-700 group-hover:text-gray-900">My Profile</span>
//                             </NavLink>
//                             <NavLink
//                                 to="/about"
//                                 onClick={() => setShowProfileModal(false)}
//                                 className="flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-300 group"
//                             >
//                                 <img src={assets.logoMark} className="h-6 w-6 mr-3" />
//                                 <span className="text-gray-700 group-hover:text-gray-900">About us</span>
//                             </NavLink>

//                             <NavLink
//                                 to="/contact"
//                                 onClick={() => setShowProfileModal(false)}
//                                 className="flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-300 group"
//                             >
//                                 <GrContact className="w-4 h-4  mr-3" />
//                                 <span className="text-gray-700 group-hover:text-gray-900">Contact us</span>
//                             </NavLink>
//                             <div
//                                 onClick={handleLogout}
//                                 className="flex items-center px-4 py-3 rounded-xl hover:bg-red-50 cursor-pointer transition-colors duration-300 group"
//                             >
//                                 <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//                                 </svg>
//                                 <span className="text-red-600 group-hover:text-red-700">Logout</span>
//                             </div>
//                         </>
//                     ) : (
//                         <NavLink
//                             to="/login"
//                             onClick={() => setShowProfileModal(false)}
//                             className="flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-300 group"
//                         >
//                             <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
//                             </svg>
//                             <span className="text-gray-700 group-hover:text-gray-900">Login</span>
//                         </NavLink>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );

//     return (
//         <div className="sm:hidden">
//             {/* Modals */}
//             <CollectionsModal />
//             <ProfileModal />

//             {/* Bottom Navigation Bar */}
//             <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center">
//                 <div className="bg-gray-800/90 backdrop-blur-lg rounded-full px-6 py-3 shadow-2xl border border-gray-700/10">
//                     <div className="flex items-center justify-center space-x-2">

//                         {/* Home */}
//                         <NavLink
//                             to="/"
//                             className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive('/')
//                                 ? 'bg-orange-500 text-black shadow-lg'
//                                 : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
//                                 }`}
//                         >
//                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
//                             </svg>
//                         </NavLink>

//                         {/* Collections */}
//                         <button
//                             onClick={() => setShowCollectionsModal(!showCollectionsModal)}
//                             className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${showCollectionsModal
//                                 ? 'bg-orange-500 text-black shadow-lg'
//                                 : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
//                                 }`}
//                         >
//                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//                             </svg>
//                         </button>





//                         {/* Profile/Menu */}
//                         <button
//                             onClick={() => setShowProfileModal(!showProfileModal)}
//                             className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${showProfileModal
//                                 ? 'bg-orange-500 text-black shadow-lg'
//                                 : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
//                                 }`}
//                         >
//                             {user ? (
//                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//                                 </svg>
//                             ) : (
//                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
//                                 </svg>
//                             )}
//                         </button>

//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default BottomNavBar;

import React, { useState, useEffect } from "react";
import SiteSearch from "./Navbar/SiteSearch";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { useCollections } from "../context/CollectionsContext";
import { useAuth } from "../context/NewAuthContext";
import { GrContact } from "react-icons/gr";
import { IoCubeOutline, IoHeartOutline, IoSparklesOutline, IoStarOutline } from "react-icons/io5";
import { FaMale } from "react-icons/fa";
import { FaFemale } from "react-icons/fa";

function BottomNavBar() {
    const [showCollectionsModal, setShowCollectionsModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [expandedSubcategories, setExpandedSubcategories] = useState({});
    const { CollectionsData, isLoading, error, fetchCollections } = useCollections();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searching, setSearching] = useState(false);
    const location = useLocation();

    const SkeletonItem = () => (
        <div className="animate-pulse">
            <div className="bg-gray-200 h-10 rounded-lg my-2 mx-3"></div>
        </div>
    );

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const toggleSubcategories = (category) => {
        setExpandedSubcategories((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const handleSubcategoryClick = (category, subcategory) => {
        const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
        const subcategorySlug = subcategory.name.toLowerCase().replace(/\s+/g, "-");
        navigate(`/collection/${categorySlug}/${subcategorySlug}`);
        setShowCollectionsModal(false);
    };

    const handleLogout = () => {
        logout();
        setShowProfileModal(false);
    };

    const isActive = (path) => location.pathname === path;

    // Collections Modal (keeping your existing enhanced design)
    const CollectionsModal = () => (
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300 ${showCollectionsModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={() => setShowCollectionsModal(false)}
        >
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] overflow-hidden transition-transform duration-300 shadow-2xl ${showCollectionsModal ? 'translate-y-0' : 'translate-y-full'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Enhanced Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Collections</h3>
                        </div>
                        <button
                            onClick={() => setShowCollectionsModal(false)}
                            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors duration-200 group"
                        >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Quick Stats */}
                    {CollectionsData && (
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{Object.keys(CollectionsData).length} categories</span>
                            <span>•</span>
                            <span>{Object.values(CollectionsData).reduce((total, items) => total + items.length, 0)} items</span>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto pb-6" style={{ maxHeight: 'calc(75vh - 120px)' }}>
                    <div className="px-4 pt-2">
                        {isLoading || error != null ? (
                            // Enhanced Loading State
                            <div className="space-y-4">
                                {Array(4).fill(0).map((_, index) => (
                                    <div key={index} className="animate-pulse">
                                        <div className="h-14 bg-gray-200 rounded-xl mb-2"></div>
                                        <div className="ml-4 space-y-2">
                                            <div className="h-10 bg-gray-100 rounded-lg w-3/4"></div>
                                            <div className="h-10 bg-gray-100 rounded-lg w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : CollectionsData ? (
                            <div className="space-y-3">
                                {Object.entries(CollectionsData).map(([category, items]) => (
                                    <div key={category} className="bg-gray-50/50 rounded-2xl overflow-hidden">
                                        {/* Category Header */}
                                        <div
                                            onClick={() => toggleSubcategories(category)}
                                            className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-200 hover:bg-gray-100/80 ${expandedSubcategories[category]
                                                ? "bg-orange-50 "
                                                : "bg-white/80"
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${expandedSubcategories[category]
                                                    ? "bg-orange-100 text-orange-700"
                                                    : "bg-gray-100 text-gray-600"
                                                    }`}>
                                                    {
                                                        (category === "Newly Added")
                                                            ? <IoSparklesOutline />
                                                            : (category === "Men's Clothing")
                                                            ?<FaMale />
                                                            : (category === "Women's Clothing")
                                                            ? <FaFemale />
                                                            : <IoCubeOutline />
                                                    }
                                                </div>
                                                <div>
                                                    <p className={`font-semibold transition-colors duration-200 ${expandedSubcategories[category]
                                                        ? "text-orange-700"
                                                        : "text-gray-800"
                                                        }`}>
                                                        {category}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {items.length} item{items.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className={`p-2 rounded-lg transition-all duration-200 ${expandedSubcategories[category]
                                                ? "bg-orange-100 text-orange-700 rotate-180"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                }`}>
                                                <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        <div
                                            className={`transition-all duration-300 ease-in-out ${expandedSubcategories[category]
                                                ? "max-h-96 opacity-100"
                                                : "max-h-0 opacity-0"
                                                }`}
                                        >
                                            <div className="px-2 pb-2">
                                                {items.map((item, subindex) => (
                                                    <div
                                                        key={subindex}
                                                        onClick={() => handleSubcategoryClick(category, item)}
                                                        className="flex items-center space-x-3 px-4 py-3 mx-1 rounded-xl hover:bg-white/80 cursor-pointer transition-all duration-200 group hover:shadow-sm"
                                                    >
                                                        
                                                            <img
                                                                src={item.thumbnail || assets.p_img1}
                                                                alt={item.name}
                                                                className="h-10 w-10 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all duration-200"
                                                            />
                                                      

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-800 truncate group-hover:text-orange-800 transition-colors duration-200">
                                                                {item.name}
                                                            </p>
                                                            {item.description && (
                                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                                    {item.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Empty State
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <p className="text-gray-600 font-medium">No collections found</p>
                                <p className="text-gray-400 text-sm mt-1">Your collections will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Enhanced Profile Modal with Bottom Sheet Design
    const ProfileModal = () => {
        const menuItems = user ? [
            {
                icon: <IoHeartOutline className="w-5 h-5 text-pink-500" />,
                label: 'Wishlist',
                path: '/wishlist'
            },
            {
                icon: <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>,
                label: 'My Orders',
                path: '/orders'
            },
            {
                icon: <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>,
                label: 'My Profile',
                path: '/profile'
            },
            {
                icon: <img src={assets.logoMark} className="h-5 w-5" />,
                label: 'About us',
                path: '/about'
            },
            {
                icon: <GrContact className="w-4 h-4 text-green-500" />,
                label: 'Contact us',
                path: '/contact'
            }
        ] : [];

        return (
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-300 ${
                    showProfileModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setShowProfileModal(false)}
            >
                {/* Bottom Sheet Container */}
                <div
                    className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300 ease-out shadow-2xl max-h-[85vh] ${
                        showProfileModal ? 'translate-y-0' : 'translate-y-full'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
 
                    

                    {/* Header */}
                    <div className="flex justify-between items-center px-6 pb-4 mt-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Profile</h3>
                            {user && (
                                <p className="text-sm text-gray-500 mt-1">Welcome back, {user.firstName || user.email}</p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowProfileModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-8 overflow-y-auto">
                        {user ? (
                            <>
                                {/* User Info Card */}
                                <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 rounded-2xl mb-6 text-white">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h4 className="font-semibold">{user.firstName || 'User'}</h4>
                                            <p className="text-sm opacity-90">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="space-y-2">
                                    {menuItems.map((item, index) => (
                                        <NavLink
                                            key={index}
                                            to={item.path}
                                            onClick={() => setShowProfileModal(false)}
                                            className="w-full flex items-center px-4 py-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 group"
                                        >
                                            <div className="mr-4">
                                                {item.icon}
                                            </div>
                                            <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                                                {item.label}
                                            </span>
                                            <svg 
                                                className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gray-600" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </NavLink>
                                    ))}
                                </div>

                                {/* Logout Button */}
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center px-4 py-4 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors duration-200 group"
                                    >
                                        <svg className="w-5 h-5 text-red-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span className="text-red-600 group-hover:text-red-700 font-medium">
                                            Logout
                                        </span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Login State */
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">Welcome!</h4>
                                <p className="text-gray-500 mb-6">Sign in to access your profile and orders</p>
                                
                                <NavLink
                                    to="/login"
                                    onClick={() => setShowProfileModal(false)}
                                    className="w-full flex items-center justify-center px-6 py-4 bg-orange-500 text-black rounded-xl hover:bg-orange-600  transition-colors duration-200 font-medium"
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Sign In
                                </NavLink>
                                
                                {/* Guest Options */}
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500 mb-4">Or browse as guest</p>
                                    <div className="space-y-2">
                                        <NavLink
                                            to="/about"
                                            onClick={() => setShowProfileModal(false)}
                                            className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <img src={assets.logoMark} className="h-5 w-5 mr-4" />
                                            <span className="text-gray-700">About us</span>
                                        </NavLink>
                                        <NavLink
                                            to="/contact"
                                            onClick={() => setShowProfileModal(false)}
                                            className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <GrContact className="w-4 h-4 mr-4" />
                                            <span className="text-gray-700">Contact us</span>
                                        </NavLink>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="sm:hidden">
            {/* Modals */}
            <CollectionsModal />
            <ProfileModal />

            {/* Bottom Navigation Bar */}
            <div className={`fixed bottom-1 left-4 right-4 z-40 flex justify-center ${searching ? "invisible" : ""}`}>
                <div className="bg-gray-800/90 backdrop-blur-lg rounded-full px-6 py-3 shadow-2xl border border-gray-700/10">
                    <div className="flex items-center justify-center space-x-2">

                        {/* Home */}
                        <NavLink
                            to="/"
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive('/')
                                ? 'bg-orange-500 text-black shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </NavLink>

                        {/* Search */}
                        <SiteSearch
                            onPhone
                            onOpenChange={setSearching}
                            triggerClassName={(active) =>
                                `flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${active
                                    ? 'bg-orange-500 text-black shadow-lg'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`
                            }
                        />

                        {/* Collections */}
                        <button
                            onClick={() => setShowCollectionsModal(!showCollectionsModal)}
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${showCollectionsModal
                                ? 'bg-orange-500 text-black shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </button>

                        {/* Profile/Menu */}
                        <button
                            onClick={() => setShowProfileModal(!showProfileModal)}
                            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${showProfileModal
                                ? 'bg-orange-500 text-black shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            {user ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            )}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default BottomNavBar;