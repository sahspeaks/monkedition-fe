import React, { useState, useCallback } from "react";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import SlidBarMenu from "./SlidBarMenu";
import SiteSearch from "./SiteSearch";
import Topbar from "./Topbar";
import { useCartContext } from "../../context/CartContext";
import CartSlider from "./CartSlider";
import { useAuth } from "../../context/NewAuthContext";

function Navbar() {
  const navigate = useNavigate();
  const [menuVisible, setMenuVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const { getCartCount } = useCartContext();
  const { user, logout } = useAuth();

  const openProfile = () => {
    navigate("/profile");
  };
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);
  return (
    <div className=" flex items-center justify-between pt-2 pb-4 font-medium px-10 sticky top-0 bg-white z-50">
      {/* LOGO Icon */}
      <Link to={"/"}>
        <img src={assets.logo} className="h-10" />
      </Link>

      {/* Top Menu Items */}
      <Topbar />

      {/* Right side */}
      <div className="flex items-center gap-6">
        <div className="hidden sm:block">
          <SiteSearch />
        </div>
        {/* Profile Icon with Dropdown - Desktop */}
        <div className="hidden sm:block group relative">
          {user ? (
            <div className="cursor-pointer">
              <img
                src={assets.profile_icon}
                alt="profile"
                className="w-5 cursor-pointer"
              />
            </div>
          ) : (
            <Link
              to="/login"
              className={`block px-4 py-2 text-sm text-gray-500 hover:text-gray-900`}
            >
              Login
            </Link>
          )}

          {/* Profile Dropdown Menu */}
          {user && (
            <div className="absolute z-10 top-4 right-0 w-56 bg-white rounded-md shadow-lg group-hover:block hidden">
              <div className="py-1">
                <div
                  onClick={openProfile}
                  className={`block px-4 py-2 text-sm text-gray-500 hover:bg-orange-50 hover:text-gray-900 cursor-pointer`}
                >
                  My Profile
                </div>
                <Link
                  to="/orders"
                  className={`block px-4 py-2 text-sm text-gray-500 hover:bg-orange-50 hover:text-gray-900`}
                >
                  Orders
                </Link>
                <Link
                  to="/wishlist"
                  className={`block px-4 py-2 text-sm text-gray-500 hover:bg-orange-50 hover:text-gray-900`}
                >
                  Wishlist
                </Link>
                <div
                  onClick={handleLogout}
                  className={`block px-4 py-2 text-sm text-gray-500 hover:bg-orange-50 hover:text-gray-900 cursor-pointer`}
                >
                  Log Out
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cart Icon for desktop */}
        <div
          onClick={() => setCartVisible(true)}
          className="relative cursor-pointer"
        >
          <img src={assets.cart_icon} alt="" className="w-5 min-w-5" />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px] ">
            {getCartCount()}
          </p>
        </div>
        <CartSlider cartVisible={cartVisible} setCartVisible={setCartVisible} />

        {/* SlideBarMenu */}
        {/* <img
          onClick={() => setMenuVisible(true)}
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          alt=""
        />
        <SlidBarMenu
          menuVisible={menuVisible}
          setMenuVisible={setMenuVisible}
        /> */}
      </div>
    </div>
  );
}

export default Navbar;
