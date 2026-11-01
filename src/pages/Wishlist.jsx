import React, { useState, useCallback } from "react";
import { Title } from "../components/Title";
import { ProductItem } from "../components/ProductItem";
import { useWishlist } from "../context/WhislistContext";
import { useAuth } from "../context/NewAuthContext";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Wishlist = () => {
  const { wishlistItems, loading, error, removeFromWishlist, fetchWishlist } =
    useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Local state to handle optimistic updates
  const [removingItems, setRemovingItems] = useState(new Set());

  // Get current valid items excluding ones being removed
  const getCurrentItems = useCallback(() => {
    return (wishlistItems || []).filter(
      (item) => item?.product?._id && !removingItems.has(item.product._id)
    );
  }, [wishlistItems, removingItems]);

  if (loading) {
    return (
      <div className="px-10 min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-10 min-h-[400px] flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Oops! Something went wrong</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-10 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">
            Please login to view your wishlist
          </p>
        </div>
      </div>
    );
  }

  const currentItems = getCurrentItems();

  const handleLikeClick = async (e, productId) => {
    e.preventDefault();

    // Optimistically update UI
    setRemovingItems((prev) => new Set([...prev, productId]));

    try {
      await removeFromWishlist(productId);
      toast.success("Item removed from wishlist");
      // On success, refresh the wishlist
      // await fetchWishlist(user);
      // toast.success("Wishlist updated");
    } catch (error) {
      console.error("Failed to remove item from wishlist:", error);
      // On error, revert the optimistic update
      setRemovingItems((prev) => {
        const newSet = new Set([...prev]);
        newSet.delete(productId);
        return newSet;
      });
    }
  };
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };
  if (currentItems.length === 0) {
    return (
      <div className="px-10 min-h-[400px]">
        <div className="flex justify-between items-center mb-8 text-2xl">
          <Title text1="Wish" text2=" List" />
          <div className="w-8 h-8 bg-black rounded-full text-white text-sm flex items-center justify-center">
            <p>0</p>
          </div>
        </div>
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">Your wishlist is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10">
      <div className="flex justify-between items-center mb-8 text-2xl">
        <Title text1="Wish" text2=" List" />
        <div className="w-8 h-8 bg-black rounded-full text-white text-sm flex items-center justify-center">
          <p>{currentItems.length}</p>
        </div>
      </div>
      <ToastContainer />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 justify-items-center">
        {currentItems.map((item) => (
          <ProductItem
            key={item.product._id}
            id={item.product._id}
            name={item.product.name || ""}
            image={item.product.image || ""}
            price={item.product.price || 0}
            like={true}
            fromWishlist={true}
            reduceIconSize={true}
            onLikeClick={(e) => handleLikeClick(e, item.product._id)}
            onClick={() => handleProductClick(item.product._id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
