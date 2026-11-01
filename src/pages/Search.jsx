import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { assets } from "../assets/assets";
import { searchProducts } from "../api/catalog";
import PriceRangeSelector from "../components/Buttons/PriceRangeSelector";
import SizeSelector from "../components/Buttons/SizeSelector";
import { ProductItem } from "../components/ProductItem";
import { useWishlist } from "../context/WhislistContext";
import {
  filterProducts,
  formatPrice,
  parsePrice,
  sizesIn,
  withFilters,
} from "../utils/collectionFilters";

const RAW_PRICES = [0, 499, 500, 999, 1000, 1499, 1500, 1999, 2000, 2499, 2500];

const Skeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 w-full">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-square bg-gray-200 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { wishlistItems = [], addToWishlist, removeFromWishlist } = useWishlist() || {};
  const q = (params.get("q") ?? "").trim();
  const size = params.get("size") || null;
  const price = parsePrice(params.get("price"));

  const [showFilter, setShowFilter] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(q));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!q) {
      setProducts([]);
      setLoading(false);
      setFailed(false);
      return undefined;
    }
    let stale = false;
    setLoading(true);
    setFailed(false);
    searchProducts(q)
      .then((items) => {
        if (!stale) setProducts(items);
      })
      .catch(() => {
        if (!stale) {
          setProducts([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [q, attempt]);

  // The server already matched the words, so only size and price apply here.
  const visible = useMemo(() => filterProducts(products, { size, price }), [products, size, price]);
  const sizes = useMemo(() => sizesIn(products, size), [products, size]);
  const hasFilters = Boolean(size || price);

  const update = (changes) =>
    setParams(withFilters(new URLSearchParams(window.location.search), changes), { replace: true });

  const isLiked = (id) => wishlistItems?.some((item) => item?.product?._id === id) || false;
  const toggleLike = async (e, id) => {
    e.preventDefault();
    try {
      if (isLiked(id)) {
        await removeFromWishlist(id);
        toast.success("Item removed from wishlist");
      } else {
        await addToWishlist(id);
        toast.success("Item added to wishlist");
      }
    } catch {
      toast.error("Please check if you are logged in.");
    }
  };

  const action = (label, onClick) => (
    <button type="button" onClick={onClick} className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-400 text-black">
      {label}
    </button>
  );
  const notice = (message, button) => (
    <div className="flex flex-col items-center justify-center gap-3 h-64 w-full text-center">
      <p className="text-gray-500 text-lg">{message}</p>
      {button}
    </div>
  );

  const results = () => {
    if (!q) return notice("Use the search button to find products.");
    if (loading) return <Skeleton />;
    if (failed) return notice("We could not search right now.", action("Try again", () => setAttempt((n) => n + 1)));
    if (products.length === 0) {
      return notice(`No products found for “${q}”. Try a shorter or different word.`, action("Back to home", () => navigate("/")));
    }
    if (visible.length === 0) {
      return notice("No results match your filters.", action("Clear filters", () => update({ size: null, price: null })));
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-6">
        {visible.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            name={item.name}
            image={item.image}
            mrp={item.mrp}
            price={item.price}
            colors={item.color || []}
            like={isLiked(item._id)}
            onLikeClick={(e) => toggleLike(e, item._id)}
            onClick={() => navigate(`/product/${item._id}`)}
          />
        ))}
      </div>
    );
  };

  const box = `border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? "" : "hidden"} sm:block`;

  return (
    <div className="min-h-screen flex flex-col sm:flex-row gap-1 sm:gap-10 border-t p-5">
      <ToastContainer />
      {products.length > 0 && (
        <div className="min-w-60 sm:w-[28%]">
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            aria-expanded={showFilter}
            className="my-2 text-xl flex items-center cursor-pointer gap-2"
          >
            FILTERS
            <img className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`} src={assets.dropdown_icon} alt="" />
          </button>
          {hasFilters && (
            <button type="button" onClick={() => update({ size: null, price: null })} className="block text-sm text-orange-700 hover:underline">
              Clear filters
            </button>
          )}
          <div className={box}>
            <p className="mb-3 text-sm font-medium">CHOOSE SIZE</p>
            <SizeSelector sizes={sizes} selectedSize={size} onSelect={(value) => update({ size: value })} />
          </div>
          <div className={box}>
            <p className="mb-3 text-sm font-medium">PRICE RANGE</p>
            <PriceRangeSelector rawPrices={RAW_PRICES} selectedRange={price} onSelect={(range) => update({ price: formatPrice(range) })} />
          </div>
        </div>
      )}

      <div className="w-full">
        {q && (
          <h1 className="text-lg text-gray-800 mb-6">
            {loading || failed
              ? `Searching for “${q}”`
              : `${visible.length} ${visible.length === 1 ? "result" : "results"} for “${q}”`}
          </h1>
        )}
        {results()}
      </div>
    </div>
  );
}

export default Search;
