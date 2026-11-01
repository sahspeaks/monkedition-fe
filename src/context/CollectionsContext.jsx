// CollectionsContext.js
import React, { createContext, useState, useContext, useCallback, useRef } from "react";
import * as catalog from "../api/catalog";

const CollectionsContext = createContext({
  CollectionsData: {},
  isLoading: false,
  error: null,
  fetchProductColorImages: () => {},
  fetchAllProductColorImages: () => {},
  getProductAvailableColors: () => {},
  getColorImageCount: () => {},
  getProductColorMappings: () => {},
  fetchCollections: () => {},
  fetchAllProducts: () => {},
  fetchProducts: () => {},
  fetchSpecificProduct: () => {},
  calculateReview: () => {},
});

export const useCollections = () => {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
};

export const colorMap = {
  Yl: "bg-[#facc15]",
  Wh: "bg-[#ffffff]",
  BB: "bg-[#87CEEB]",
  SG: "bg-[#9ca3af]",
  Sb: "bg-[#38bdf8]",
  Rb: "bg-[#2563eb]",
  Rd: "bg-[#ef4444]",
  Pu: "bg-[#a855f7]",
  pb: "bg-[#0C5678]",
  Ph: "bg-[#fed7aa]",
  or: "bg-[#f97316]",
  OG: "bg-[#3d550c]", // olive alternative
  NYI: "bg-[#fde047]",
  Nb: "bg-[#1e40af]",
  MYI: "bg-[#ca8a04]",
  Mh: "bg-[#a8a29e]",
  Mnt: "bg-[#bbf7d0]",
  Mn: "bg-[#7f1d1d]",
  LBp: "bg-[#fbcfe8]",
  Lv: "bg-[#e9d5ff]",
  Jd: "bg-[#34d399]",
  Gm: "bg-[#d1d5db]",
  GYI: "bg-[#f59e0b]",
  Fgn: "bg-[#16a34a]",
  Cor: "bg-[#f08080]",
  Cop: "bg-[#d97706]",
  bn: "bg-[#431407]", // brown alternative
  Cm: "bg-[#4b5563]",
  BRd: "bg-[#b91c1c]",
  Gn: "bg-[#065f46]",
  Bk: "bg-[#000000]",
  Be: "bg-[#fef3c7]",
  Fl: "bg-[#ec4899]",
};

export const CollectionsProvider = ({ children }) => {
  const [CollectionsData, setCollectionsData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // const [search, setSearch] = useState("");
  // const [showSearch, setShowSearch] = useState(false);

  // Catalog data comes from /api/v2 through src/api/catalog.js, which returns
  // the v1 shapes these pages were written against (P1-23).
  const collectionsLoaded = useRef(false);
  const fetchCollections = useCallback(async () => {
    // Many components ask; a new object for each would re-render them all.
    if (collectionsLoaded.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await catalog.getCollectionsData();
      if (collectionsLoaded.current) return;
      collectionsLoaded.current = true;
      setCollectionsData(data);
    } catch (err) {
      console.error("Error in fetchCollections:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (category, subCategory) => {
    try {
      return await catalog.getProductsInSubcategory(category, subCategory);
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }, []);

  const fetchProductColorImages = async (productId, colorCode) => {
    try {
      return await catalog.getColourImages(productId, colorCode);
    } catch (error) {
      console.error("Error while fetching color images:", error);
      return { success: false, message: error.message };
    }
  };

  const fetchAllProductColorImages = async (productId) => {
    try {
      return await catalog.getAllColourImages(productId);
    } catch (error) {
      console.error("Error while fetching all color images:", error);
      return { success: false, message: error.message };
    }
  };

  const fetchSpecificProduct = async (productID) => {
    try {
      return await catalog.getProduct(productID);
    } catch (error) {
      console.error("Error while fetching product data:", error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      return await catalog.getAllProducts();
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Helper function to get available colors for a product
  const getProductAvailableColors = (product) => {
    if (product.colorImages && Array.isArray(product.colorImages)) {
      return product.colorImages.map((entry) => entry.color);
    }
    return product.color || []; // Fallback to the main color field
  };

  // Helper function to get image count for a specific color
  const getColorImageCount = (product, colorCode) => {
    if (product.colorImageCounts) {
      return product.colorImageCounts[colorCode] || 0;
    }

    // Fallback: count from colorImages array
    if (product.colorImages && Array.isArray(product.colorImages)) {
      const colorEntry = product.colorImages.find(
        (entry) => entry.color === colorCode
      );
      return colorEntry ? colorEntry.images.length : 0;
    }

    return 0;
  };

  // Helper function to get all color-image mappings from a product
  const getProductColorMappings = (product) => {
    if (product.colorImages && Array.isArray(product.colorImages)) {
      const mappings = {};
      product.colorImages.forEach((entry) => {
        mappings[entry.color] = entry.images;
      });
      return mappings;
    }
    return {};
  };

  const calculateReview = (product) => {
    if (!product?.reviews?.length) return [0, 5];
    let totalReviews = 0; // Use let instead of const
    for (let i = 0; i < product.reviews.length; i++) {
      totalReviews += product.reviews[i].rating;
    }

    const review = Number(totalReviews / product.reviews.length);
    return [review, 5 - review];
  };

  const value = {
    CollectionsData,
    isLoading,
    error,
    fetchCollections,
    fetchProducts,
    fetchAllProducts,
    fetchSpecificProduct,
    fetchProductColorImages,
    fetchAllProductColorImages,
    getProductAvailableColors,
    getColorImageCount,
    getProductColorMappings,
    calculateReview,
    
    colorMap,
  };

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
};
