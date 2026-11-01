import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Collection from "./pages/Collection";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Orders from "./pages/Orders";
import Product from "./pages/Product";
import Navbar from "./components/Navbar/Navbar";
import { CollectionsProvider } from "./context/CollectionsContext";
import Footer from "./components/Footer";
import { CartProvider } from "./context/CartContext";
import PlaceOrder from "./pages/PlaceOrder";
import { NewAuthProvider, useAuth } from "./context/NewAuthContext";

import Profile from "./pages/Profile";
import {
  PrivacyPolicy,
  ReturnPolicy,
  ShippingPolicy,
  TermsOfService,
} from "./components/PolicyComponents";

import SuccessPage from "./pages/SuccessPage";
import Search from "./pages/Search";
import Receipt from "./pages/Receipt";
import Unsubscribe from "./pages/Unsubscribe";
import ScrollToTop from "./components/ScrollTop";
import Wishlist from "./pages/Wishlist";
import { WishlistProvider } from "./context/WhislistContext";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

import { GoogleOAuthProvider } from "@react-oauth/google";
import BottomNavBar from "./components/BottomNavbar";

// Staff only, and in its own chunk so customers never download it.
const Dashboard = lazy(() => import("./dashboard/Dashboard"));

// The shop's header and footer, which the dashboard replaces with its own.
const ShopChrome = ({ children }) =>
  /^\/dashboard|\/receipt$/.test(useLocation().pathname) ? null : children;

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return children;
};

const GoogleAuthWrapper = ({ children }) => {
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
  return (
    <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <GoogleAuthWrapper>
        <NewAuthProvider>
          <WishlistProvider>
            <CollectionsProvider>
              <CartProvider>
                <ScrollToTop /> {/* Scroll restoration feature */}
                <ShopChrome>
                  <Navbar />
                  <BottomNavBar/>
                </ShopChrome>
                <Routes>
                  <Route
                    path="/dashboard/*"
                    element={
                      <Suspense fallback={null}>
                        <Dashboard />
                      </Suspense>
                    }
                  />
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route
                    path="/collection/:categoryName/:subCategoryName"
                    element={<Collection />}
                  />
                  <Route path="/contact" element={<Contact />} />

                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route
                    path="/orders/:orderNumber/receipt"
                    element={
                      <ProtectedRoute>
                        <Receipt />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/unsubscribe" element={<Unsubscribe />} />
                  <Route path="/search" element={<Search />} />
                  <Route
                    path="/successPage/:qiKinkOrderId"
                    element={<SuccessPage />}
                  />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route
                    path="/place-order"
                    element={
                      <ProtectedRoute>
                        <PlaceOrder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/product/:productId" element={<Product />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/return" element={<ReturnPolicy />} />
                  <Route path="/shipping" element={<ShippingPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  {/* Define other routes here */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
                    
                <ShopChrome>
                  <Footer />
                </ShopChrome>
                
              </CartProvider>
            </CollectionsProvider>
          </WishlistProvider>
        </NewAuthProvider>
      </GoogleAuthWrapper>
    </BrowserRouter>
  );
}

export default App;
