import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useCollections } from "../../context/CollectionsContext";
import { useAuth } from "../../context/NewAuthContext";

function SlidBarMenu({ menuVisible, setMenuVisible }) {
  const [visibleCollections, setVisibleCollections] = useState(false);
  const [expandedSubcategories, setExpandedSubcategories] = useState({});
  const { CollectionsData, isLoading, error, fetchCollections } =
    useCollections();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    setMenuVisible(false);
  };
  const handleLogout = () => {
    logout();
    () => setMenuVisible(false);
  };
  return (
    <div
      className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white transition-all duration-500 ${
        menuVisible ? "w-80" : "w-0"
      }`}
    >
      <div className="sticky top-0 z-10 bg-white">
        <div
          onClick={() => setMenuVisible(false)}
          className="w-10 h-10 bg-orange-500 cursor-pointer gap-4 flex items-center justify-center group rounded-r-full my-2"
        >
          <img
            src={assets.cancel}
            alt=""
            className="h-3 group-hover:rotate-90 duration-300"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white text-center text-gray-400">
          <NavLink
            onClick={() => setMenuVisible(false)}
            className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500"
            to="/"
          >
            HOME
          </NavLink>

          <div className="flex flex-col">
            <div
              onClick={() => setVisibleCollections(!visibleCollections)}
              className={`flex flex-row justify-between px-5 hover:bg-gray-100 hover:text-black cursor-pointer ${
                visibleCollections ? "bg-gray-100 text-black" : "bg-gray-50"
              } p-2 my-1 transition-colors duration-500 select-none`}
            >
              <p>COLLECTIONS</p>
              <p>{visibleCollections ? "-" : "+"}</p>
            </div>

            <div
              className={`transition-all duration-500 ${
                visibleCollections ? "block" : "hidden"
              }`}
            >
              {isLoading || error != null
                ? Array(4)
                    .fill(0)
                    .map((_, index) => <SkeletonItem key={index} />)
                : CollectionsData &&
                  Object.entries(CollectionsData).map(
                    ([category, items], index) => (
                      <div key={category}>
                        <div
                          onClick={() => toggleSubcategories(category)}
                          className={`flex flex-row justify-between px-5 cursor-pointer hover:bg-gray-100 hover:text-black ${
                            expandedSubcategories[category]
                              ? "bg-gray-100 text-black"
                              : "bg-gray-50"
                          } p-2 transition-colors duration-500 select-none`}
                        >
                          <p>{category}</p>
                          <img
                            src={assets.arrow_right}
                            height="10px"
                            width="20px"
                            alt="arrow"
                            className={`transition-transform duration-300 ${
                              expandedSubcategories[category] ? "rotate-90" : ""
                            }`}
                          />
                        </div>

                        <div
                          className={`transition-all duration-500 ${
                            expandedSubcategories[category]
                              ? "max-h-screen opacity-100"
                              : "max-h-0 opacity-0"
                          } overflow-hidden`}
                        >
                          {items.map((item, subindex) => (
                            <div
                              key={subindex}
                              onClick={() =>
                                handleSubcategoryClick(category, item)
                              }
                              className="flex flex-row items-center px-2 m-2 mx-5 rounded-full hover:bg-gray-100 hover:text-black bg-gray-50 p-2 transition-colors duration-500 select-none cursor-pointer"
                            >
                              <img
                                src={item.thumbnail || assets.p_img1}
                                alt=""
                                className="h-8 w-8 rounded-full mr-4"
                              />
                              <p className="line-clamp-1">{item.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
            </div>
          </div>

          <NavLink
            onClick={() => setMenuVisible(false)}
            className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500"
            to="/about"
          >
            ABOUT
          </NavLink>
          <NavLink
            onClick={() => setMenuVisible(false)}
            className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500"
            to="/contact"
          >
            CONTACT
          </NavLink>
          {user ? (
            // Render these links only when user is logged in
            <>
              <NavLink
                onClick={() => setMenuVisible(false)}
                className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500"
                to="/wishlist"
              >
                Wishlist
              </NavLink>
              <NavLink
                onClick={() => setMenuVisible(false)}
                className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500"
                to="/orders"
              >
                My Orders
              </NavLink>
              <NavLink
                onClick={() => setMenuVisible(false)}
                className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500"
                to="/profile"
              >
                My Profile
              </NavLink>
              <div
                onClick={handleLogout}
                className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500 cursor-pointer"
              >
                Logout
              </div>
            </>
          ) : (
            // Render login button when user is not logged in
            <NavLink
              onClick={() => setMenuVisible(false)}
              className="block hover:bg-gray-100 hover:text-black bg-gray-50 p-2 my-1 transition-colors duration-500"
              to="/login"
            >
              Login
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
}

export default SlidBarMenu;
