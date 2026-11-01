import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { getFeaturedProducts } from "../api/catalog";
import { useWishlist } from "../context/WhislistContext";
import { ProductItem } from "./ProductItem";
import { BoldTitle } from "./Title";

const PLACEHOLDERS = 8;
// One row that swipes sideways, with no scrollbar showing.
const ROW =
  "flex gap-4 overflow-x-auto snap-x snap-mandatory max-w-6xl mx-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const CARD = "shrink-0 snap-start w-[45%] sm:w-[30%] lg:w-[calc(25%-12px)]";

function FeaturedProducts() {
  const navigate = useNavigate();
  const { wishlistItems = [], addToWishlist, removeFromWishlist } = useWishlist() || {};
  const [products, setProducts] = useState(null);

  useEffect(() => {
    let current = true;
    getFeaturedProducts()
      .then((items) => current && setProducts(items))
      // The home page works without this section, so a failure just leaves it out.
      .catch(() => current && setProducts([]));
    return () => {
      current = false;
    };
  }, []);

  const isItemInWishlist = (itemId) =>
    wishlistItems?.some((wishlistItem) => wishlistItem?.product?._id === itemId) || false;

  const handleLikeClick = async (e, itemId) => {
    e.preventDefault();
    try {
      if (isItemInWishlist(itemId)) {
        await removeFromWishlist(itemId);
        toast.success("Item removed from wishlist");
      } else {
        await addToWishlist(itemId);
        toast.success("Item added to wishlist");
      }
    } catch (error) {
      console.error("Wishlist operation failed:", error);
      toast.error("Please check if you are logged in.");
    }
  };

  if (products?.length === 0) return null;

  return (
    <section className="bg-canvas">
      <ToastContainer />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <BoldTitle text1="Featured" text2="Products" />
        {products ? (
          <div className={ROW}>
            {products.map((item) => (
              <div key={item._id} className={CARD}>
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
                  className="h-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className={ROW} aria-hidden="true">
            {Array.from({ length: PLACEHOLDERS }, (_, i) => (
              <div key={i} className={`${CARD} animate-pulse`}>
                <div className="aspect-square bg-gray-200 rounded-2xl mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;
