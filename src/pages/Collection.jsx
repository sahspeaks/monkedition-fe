import { useEffect, useMemo, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProductItem } from "../components/ProductItem";
import { useCollections } from "../context/CollectionsContext";
import { useWishlist } from "../context/WhislistContext";
import { ToastContainer, toast } from "react-toastify";
import SizeSelector from "../components/Buttons/SizeSelector";
import PriceRangeSelector from "../components/Buttons/PriceRangeSelector";
import { getProductsInSubcategory } from "../api/catalog";
import {
  filterProducts,
  formatPrice,
  readFilters,
  sizesIn,
  slugOf,
  toggleFandom,
  toggleGender,
  uniqueProducts,
  withFilters,
} from "../utils/collectionFilters";

const RAW_PRICES = [0, 499, 500, 999, 1000, 1499, 1500, 1999, 2000, 2499, 2500];
const INITIAL_SUBCATEGORY_COUNT = 6; // Show first 6 subcategories initially

const CategorySkeleton = () => (
  <div className="animate-pulse space-y-2">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    ))}
  </div>
);

const ProductItemSkeleton = () => (
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

const FilterBox = ({ title, show, children }) => (
  <div className={`border border-gray-300 pl-5 py-3 mt-6 ${show ? "" : "hidden"} sm:block`}>
    <p className="mb-3 text-sm font-medium">{title}</p>
    {children}
  </div>
);

const Checkbox = ({ checked, label, onToggle }) => (
  <label className="flex gap-2 cursor-pointer select-none">
    <input type="checkbox" checked={checked} onChange={onToggle} /> {label}
  </label>
);

function Collection() {
  const navigate = useNavigate();
  const { categoryName, subCategoryName } = useParams();
  const [params, setParams] = useSearchParams();
  const { CollectionsData, fetchCollections, error: categoriesError } = useCollections();
  const { wishlistItems = [], addToWishlist, removeFromWishlist } = useWishlist() || {};

  const [showFilter, setShowFilter] = useState(false);
  const [showAllSubCategories, setShowAllSubCategories] = useState(false);
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsFailed, setProductsFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // The URL is the only record of the filters.
  const filters = useMemo(
    () => readFilters(params, categoryName, subCategoryName),
    [params, categoryName, subCategoryName],
  );

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const genderNames = Object.keys(CollectionsData);
  const categoriesReady = genderNames.length > 0;
  const nameOfGender = (slug) => genderNames.find((name) => slugOf(name) === slug);
  const selectedGenderNames = filters.genders.map(nameOfGender).filter(Boolean);
  const availableSubCategories = selectedGenderNames.flatMap((gender) =>
    CollectionsData[gender].map((item) => ({
      ...item,
      key: `${slugOf(gender)}:${slugOf(item.name)}`,
    })),
  );
  const displayedSubCategories = showAllSubCategories
    ? availableSubCategories
    : availableSubCategories.slice(0, INITIAL_SUBCATEGORY_COUNT);
  const routeExists =
    !categoriesReady ||
    (Boolean(nameOfGender(slugOf(categoryName))) &&
      CollectionsData[nameOfGender(slugOf(categoryName))].some(
        (item) => slugOf(item.name) === slugOf(subCategoryName),
      ));

  // Loads the selected fandoms. A newer selection makes older responses
  // irrelevant, however late they arrive.
  const fandomsKey = filters.fandoms.join(",");
  useEffect(() => {
    let stale = false;
    setIsProductsLoading(true);
    setProductsFailed(false);
    const keys = fandomsKey ? fandomsKey.split(",") : [];
    Promise.allSettled(
      keys.map((key) => {
        const [gender, fandom] = key.split(":");
        return getProductsInSubcategory(gender, fandom);
      }),
    ).then((results) => {
      if (stale) return;
      setProducts(
        uniqueProducts(
          results.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
        ),
      );
      setProductsFailed(results.some((result) => result.status === "rejected"));
      setIsProductsLoading(false);
    });
    return () => {
      stale = true;
    };
  }, [fandomsKey, attempt]);

  const visibleProducts = useMemo(() => filterProducts(products, filters), [products, filters]);
  const sizes = useMemo(() => sizesIn(products, filters.size), [products, filters.size]);

  // Read from the address bar itself, so a change never undoes a recent one.
  const updateFilters = (changes) =>
    setParams(withFilters(new URLSearchParams(window.location.search), changes), {
      replace: true,
    });

  const hasRefinements = Boolean(filters.size || filters.price);
  const clearRefinements = () => {
    updateFilters({ size: null, price: null });
  };

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

  const isItemInWishlist = (itemId) =>
    wishlistItems?.some((wishlistItem) => wishlistItem?.product?._id === itemId) || false;

  const renderProducts = () => {
    if (isProductsLoading) return <ProductItemSkeleton />;

    const notice = (message, action) => (
      <div className="flex flex-col items-center justify-center gap-3 h-64 w-full text-center">
        <p className="text-gray-500 text-lg">{message}</p>
        {action}
      </div>
    );
    const button = (label, onClick) => (
      <button type="button" onClick={onClick} className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-400 text-black">
        {label}
      </button>
    );

    if (productsFailed && products.length === 0) {
      return notice(
        "We could not load these products.",
        button("Try again", () => setAttempt((count) => count + 1)),
      );
    }
    if (!routeExists) {
      return notice("We could not find this collection.", button("Back to home", () => navigate("/")));
    }
    if (filters.fandoms.length === 0) return notice("Choose a fandom to see its products.");
    if (products.length === 0) return notice("No products here yet. Please check back soon.");
    if (visibleProducts.length === 0) {
      return notice("No products match your filters.", button("Clear filters", clearRefinements));
    }

    return (
      <>
        {productsFailed && (
          <p role="alert" className="mb-4 text-sm text-red-700">
            Some products could not be loaded.{" "}
            <button type="button" className="underline" onClick={() => setAttempt((count) => count + 1)}>
              Try again
            </button>
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-6">
          {visibleProducts.map((item) => (
            <ProductItem
              key={item._id}
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
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row gap-1 sm:gap-10 border-t p-5">
      {/* Filter Options */}
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
        {hasRefinements && (
          <button type="button" onClick={clearRefinements} className="text-sm text-orange-700 hover:underline">
            Clear filters
          </button>
        )}

        <FilterBox title="GENDER" show={showFilter}>
          {!categoriesReady && !categoriesError && <CategorySkeleton />}
          {categoriesError && !categoriesReady && (
            <button type="button" className="text-sm underline" onClick={fetchCollections}>
              Could not load. Try again
            </button>
          )}
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {genderNames.map((gender) => (
              <Checkbox
                key={gender}
                label={gender}
                checked={filters.genders.includes(slugOf(gender))}
                onToggle={() => updateFilters(toggleGender(filters, slugOf(gender)))}
              />
            ))}
          </div>
        </FilterBox>

        <FilterBox title="YOUR FANDOM" show={showFilter}>
          {!categoriesReady && !categoriesError && <CategorySkeleton />}
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {displayedSubCategories.map((subCategory) => (
              <Checkbox
                key={subCategory.key}
                label={subCategory.name}
                checked={filters.fandoms.includes(subCategory.key)}
                onToggle={() => updateFilters(toggleFandom(filters, subCategory.key))}
              />
            ))}
          </div>
          {availableSubCategories.length > INITIAL_SUBCATEGORY_COUNT && (
            <div className="mt-3 pt-2 mr-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAllSubCategories(!showAllSubCategories)}
                className="text-sm text-black hover:text-gray-900 font-medium hover:font-semibold flex items-center gap-1 transition-colors"
              >
                {showAllSubCategories
                  ? "- Show Less"
                  : `+ ${availableSubCategories.length - INITIAL_SUBCATEGORY_COUNT} more`}
              </button>
            </div>
          )}
        </FilterBox>

        <FilterBox title="CHOOSE SIZE" show={showFilter}>
          <SizeSelector
            sizes={sizes}
            selectedSize={filters.size}
            onSelect={(size) => updateFilters({ size })}
          />
        </FilterBox>

        <FilterBox title="PRICE RANGE" show={showFilter}>
          <PriceRangeSelector
            rawPrices={RAW_PRICES}
            selectedRange={filters.price}
            onSelect={(range) => updateFilters({ price: formatPrice(range) })}
          />
        </FilterBox>
      </div>

      {/* Right side */}
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between mb-2">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
            <button type="button" onClick={() => navigate("/")} className="hover:text-gray-900">
              Home
            </button>
            <span>/</span>
            <span className="hover:text-gray-900 capitalize">{selectedGenderNames.join(" & ")}</span>
          </div>

          <ToastContainer />
        </div>

        <div>{renderProducts()}</div>
      </div>
    </div>
  );
}

export default Collection;
