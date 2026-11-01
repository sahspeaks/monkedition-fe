// The staff dashboard, at /dashboard. It loads as its own chunk, so customers
// never download it, and the API refuses anyone without a staff role anyway.
import { assets } from "../assets/assets";
import { useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  FolderTree,
  Home,
  Images,
  LogOut,
  Mail,
  MessageSquare,
  Menu,
  Package,
  RotateCcw,
  ScrollText,
  Settings as SettingsIcon,
  ShoppingBag,
  Truck,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/NewAuthContext";
import { Spinner } from "./ui";
import Overview from "./pages/Overview";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import QikinkOrders from "./pages/QikinkOrders";
import Products from "./pages/Products";
import ProductEditor from "./pages/ProductEditor";
import Inventory from "./pages/Inventory";
import Categories from "./pages/Categories";
import Sliders from "./pages/Sliders";
import Promotions from "./pages/Promotions";
import People from "./pages/People";
import Returns from "./pages/Returns";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
import Emails from "./pages/Emails";
import Alerts from "./pages/Alerts";
import AuditLog from "./pages/AuditLog";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: Home, end: true },
  { to: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { to: "/dashboard/returns", label: "Returns", icon: RotateCcw },
  { to: "/dashboard/qikink", label: "Qikink orders", icon: Truck },
  { to: "/dashboard/products", label: "Products", icon: Package },
  { to: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { to: "/dashboard/categories", label: "Categories", icon: FolderTree },
  { to: "/dashboard/sliders", label: "Home sliders", icon: Images },
  { to: "/dashboard/promotions", label: "Promo codes", icon: Tag },
  { to: "/dashboard/reviews", label: "Reviews", icon: MessageSquare },
  { to: "/dashboard/people", label: "Customers & staff", icon: Users },
  { to: "/dashboard/emails", label: "Emails", icon: Mail },
  { to: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/dashboard/settings", label: "Cash on delivery", icon: SettingsIcon },
  { to: "/dashboard/audit", label: "Activity log", icon: ScrollText },
];

const STAFF_ROLES = ["ADMIN", "OPS"];

const NoAccess = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
    <div>
      <h1 className="text-xl font-semibold text-gray-900">No dashboard access</h1>
      <p className="mt-2 text-sm text-gray-600">
        This account is not staff. If it was added recently, sign out and sign in again.
      </p>
      <Link to="/" className="mt-4 inline-block text-sm text-orange-600 hover:underline">
        Back to the shop
      </Link>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLoading) return <Spinner />;
  if (!user) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!user.roles?.some((role) => STAFF_ROLES.includes(role))) return <NoAccess />;

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3">
        <img src={assets.logoNameLight} alt="Monkedition" className="h-7" />
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={`${menuOpen ? "block" : "hidden"} md:flex md:flex-col md:w-60 md:shrink-0 md:sticky md:top-0 md:h-screen bg-gray-900 text-gray-300`}
      >
        <div className="hidden md:block px-5 py-5">
          <img src={assets.logoNameLight} alt="Monkedition" className="h-9" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1" aria-label="Dashboard">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isActive ? "bg-orange-300 text-black font-medium" : "hover:bg-gray-800 hover:text-white"}`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800 text-sm">
          <p className="px-3 truncate text-gray-400">{user.email}</p>
          <Link to="/" className="block px-3 py-2 hover:text-white">
            View shop
          </Link>
          <button type="button" onClick={logout} className="flex items-center gap-2 px-3 py-2 hover:text-white">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderNumber" element={<OrderDetail />} />
          <Route path="qikink" element={<QikinkOrders />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="categories" element={<Categories />} />
          <Route path="sliders" element={<Sliders />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="returns" element={<Returns />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
          <Route path="people" element={<People />} />
          <Route path="emails" element={<Emails />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
