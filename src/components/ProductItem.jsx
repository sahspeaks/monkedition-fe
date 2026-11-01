import { Link } from "react-router-dom";
import { ProductTitle } from "./Title";
import { IconButton } from "./icons";
import { assets } from "../assets/assets";
import { useCartContext } from "../context/CartContext";
import { colorMap } from "../context/CollectionsContext";

export function ProductItem({
  id,
  name,
  image,
  mrp,
  price,
  like,
  onLikeClick,
  className = "",
  onClick,
  colors,
  reduceIconSize = false,
  fromWishlist = false,
}) {
  const discountPercentage = Math.round(((mrp - price) / mrp) * 100);

  return (
    <div
      className={`group relative ${className} cursor-pointer w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300  `}
      onClick={onClick}
      id={id}
    >
      {/* Image Container */}
      <div className="relative w-full overflow-hidden bg-gray-50">
        <img
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          src={image}
          alt={name}
        />
        
   
        {/* Color Variants */}
        {colors?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-white/20">
            {colors.slice(0, 3).map((code, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${colorMap[code]} transition-transform hover:scale-125`}
              />
            ))}
            {colors.length > 3 && (
              <span className="text-xs text-gray-700 font-medium ml-1">
                +{colors.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Wishlist Button */}
        <div className="absolute top-3 right-3 transition-all duration-300">
          <button
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
              like 
                ? "bg-red-500/90 hover:bg-red-600/90" 
                : "bg-white/90 hover:bg-white"
            } shadow-lg border border-white/20`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLikeClick(e);
            }}
          >
            <img
              src={like ? (fromWishlist ? assets.cancel : assets.like) : assets.unLike}
              alt="wishlist"
              className={`transition-all duration-300 ${
                reduceIconSize ? "w-4 h-4" : "w-5 h-5"
              } ${like ? "brightness-0 invert" : ""}`}
            />
          </button>
        </div>

        {/* Overlay for additional interactivity */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
      </div>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
          {name}
        </h3>

        {/* Pricing Section */}
        <div className="space-y-2">
          {/* Main Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">
              ₹{price?.toLocaleString()}
            </span>
            {mrp > price && (
              <span className="text-sm text-gray-500 line-through">
                ₹{mrp?.toLocaleString()}
              </span>
            )}
          </div>

          {/* Savings Info */}
          {discountPercentage > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Save ₹{(mrp - price)?.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">
                ({discountPercentage}% off)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
}

export function ProductItemDesign2({
  id,
  name,
  image,
  price,
  like,
  onLikeClick,
}) {
  // Remove the local liked state - we'll use the prop directly

  return (
    <Link to={`/product/${id}`}>
      <div className="w-52 sm:w-64 lg:w-72 rounded-lg group relative flex-shrink-1 overflow-hidden">
        <img
          src={image}
          alt=""
          className="rounded-lg group-hover:scale-110 transition ease-in-out overflow-hidden"
        />
        <div className="flex justify-between absolute top-4 left-5 right-5">
          <IconButton
            iconPath={like ? assets.like : assets.unLike}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLikeClick(e);
            }}
          />
        </div>
      </div>
      <ProductTitle name={name} price={price} />
    </Link>
  );
}
export function CollectionCategoryItem({ title, img, onClick }) {
  return (
    <div>
      <div
        onClick={onClick}
        className="relative aspect-square group bg-gray-300 rounded-lg flex-shrink-0 hover:ring-2 hover:ring-gray-300 transition-all cursor-pointer"
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg">
          <img
            src={img}
            alt={title}
            className="object-cover h-full w-full group-hover:scale-125 transition ease-in-out"
          />
        </div>
      </div>
      <p className="text-sm md:text-lg text-gray mt-2">{title}</p>
    </div>
  );
}
