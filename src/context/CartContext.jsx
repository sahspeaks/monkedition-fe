import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as cartApi from "../api/cart";
import { rupees } from "../api/adapters";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./NewAuthContext";

const CartContext = createContext({
  cart: {},
  setCart: () => {},
  addToCart: () => {},
  isLoading: false,
  extraCharge:0,
  error: null,
  getCartCount: 0,
  updateQuantity: () => {},
  navigate: () => {},
  getCartAmount: () => 0,
  removeCartItem: () => {},
  getCartOriginalAmount:()=>0,
  clearCart: () => {},
  getCartTotalWeight:()=>0,

});

// Helper function to get storage key for a user
const getStorageKey = (userId) => {
  return userId ? `cart_${userId}` : "anonymous_cart";
};

const loadCartFromStorage = (userId) => {
  const storageKey = getStorageKey(userId);
  try {
    const savedCart = localStorage.getItem(storageKey);
    return savedCart ? JSON.parse(savedCart) : {};
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
    return {};
  }
};

// The original browser-only cart. Used when CART_V2 is off, and as the
// rollback when it is switched off again.
const useLocalCart = (user, navigate) => {
  const [carts, setCarts] = useState({}); // Store all carts
  const [cart, setCart] = useState({}); // Current user's cart
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all carts from localStorage on mount
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedCarts = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cart_")) {
          const cartData = localStorage.getItem(key);
          if (cartData) {
            loadedCarts[key] = JSON.parse(cartData);
          }
        }
      }
      setCarts(loadedCarts);
    } catch (error) {
      console.error("Error loading cart:", error);
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch cart when user changes
  useEffect(() => {
    const storageKey = getStorageKey(user?._id);
    const savedCart = carts[storageKey] || {};
    setCart(savedCart);
  }, [user, carts]);

  // Save cart to localStorage whenever it changes
  const saveCart = (newCart) => {
    setError(null);
    const storageKey = getStorageKey(user?._id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newCart));
      setCarts((prev) => ({
        ...prev,
        [storageKey]: newCart,
      }));
    } catch (error) {
      console.error("Error saving cart:", error);
      setError("Failed to save cart");
      throw error;
    }
  };

  const addToCart = (id, size, color, product) => {
    try {
      setError(null);
      let copyCart = structuredClone(cart);
      // console.log("Product", id, product);
      if (copyCart[id]) {
        // Check if item with same size AND color combination exists
        const existingItem = copyCart[id].find(
          (item) => item.size === size && item.color === color
        );

        if (existingItem) {
          // If same size and color combination exists, increment quantity
          existingItem.quantity += 1;
        } else {
          // If combination doesn't exist, add new item
          copyCart[id].push({
            size,
            quantity: 1,
            color,
            product,
          });
        }
      } else {
        // If product id doesn't exist in cart, create new array with item
        copyCart[id] = [
          {
            size,
            quantity: 1,
            color,
            product,
          },
        ];
      }

      setCart(copyCart);
      saveCart(copyCart);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError(error.message || "Failed to add item to cart");
      return false;
    }
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((total, items) => {
      return (
        total +
        items.reduce((itemTotal, item) => {
          return itemTotal + item.quantity;
        }, 0)
      );
    }, 0);
  };

  const updateQuantity = async (itemId, size, color, quantity) => {
    try {
      let copyCart = structuredClone(cart);
      if (!copyCart[itemId]) {
        throw new Error("Product not found in cart");
      }
      copyCart[itemId].map((item) => {
        if (item.size === size && item.color === color) {
          item.quantity = quantity;
        }
      });

      setCart(copyCart);
      saveCart(copyCart);
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError(error.message || "Failed to update quantity");
      return false;
    }
  };

  const removeCartItem = (id, size, color) => {
    try {
      let copyCart = structuredClone(cart);

      if (!copyCart[id]) {
        throw new Error("Product not found in cart");
      }

      copyCart[id] = copyCart[id].filter(
        (item) => item.size !== size || item.color !== color
      );
      setCart(copyCart);
      saveCart(copyCart);
    } catch (error) {
      console.error("Error removing item:", error);
      setError(error.message || "Failed to remove item");
      return false;
    }
  };

  const getCartOriginalAmount = async () => {
    return Object.values(cart).reduce((total, items) => {
      return (
        total +
        items.reduce((subTotal, item) => {
          return (subTotal += item.quantity * item.product?.mrp);
        }, 0)
      );
    }, 0);
  };

   const getCartAmount = async () => {
    return Object.values(cart).reduce((total, items) => {
      return (
        total +
        items.reduce((subTotal, item) => {
          return (subTotal += item.quantity * item.product?.price);
        }, 0)
      );
    }, 0);
  };

   const getCartTotalWeight = async () => {
    return Object.values(cart).reduce((total, items) => {
      return (
        total +
        items.reduce((subTotal, item) => {
          return (subTotal += item.quantity * item.product?.weight);
        }, 0)
      );
    }, 0);
  };

  const clearCart = () => {
    try {
      setError(null);
      setCart({});
      saveCart({});
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      setError("Failed to clear cart");
      return false;
    }
  };
  // Function to merge anonymous cart with user cart on login
  const mergeAnonymousCart = () => {
    const anonymousKey = getStorageKey();
    const anonymousCart = loadCartFromStorage();

    if (Object.keys(anonymousCart).length > 0) {
      // Merge items from anonymous cart into user's cart
      Object.entries(anonymousCart).forEach(([productId, items]) => {
        items.forEach((item) => {
          addToCart(productId, item.size, item.color, item.product);
        });
      });

      // Clear anonymous cart
      localStorage.removeItem(anonymousKey);
    }
  };

  // Handle cart merging when user logs in
  useEffect(() => {
    if (user?._id) {
      mergeAnonymousCart();
    }
  }, [user?._id]);

  const value = {
    addToCart,
    getCartCount,
    updateQuantity,
    navigate,
    getCartAmount,
    removeCartItem,
    cart,
    getCartTotalWeight,
    getCartOriginalAmount,
    extraCharge:300,
    clearCart,
  };
  return value;
};

// The server cart (P2-10, CART_V2): prices, stock and totals come from
// /api/v2/cart, so what the customer sees is what the server will charge.
const useServerCart = (user, navigate, enabled) => {
  const [view, setView] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const userId = user?._id ?? null;
  const previousUser = useRef(userId);

  const apply = useCallback(async (request) => {
    try {
      setError(null);
      setView(await request);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || "Could not update your cart" };
    }
  }, []);

  // Load on start and whenever the signed-in user changes. Signing in folds
  // the guest cart into the user's first.
  useEffect(() => {
    if (!enabled) return;
    const signedIn = userId && !previousUser.current;
    previousUser.current = userId;
    setIsLoading(true);
    (async () => {
      try {
        if (signedIn) await cartApi.mergeGuestCart().catch(() => null);
        setView(await cartApi.fetchCart());
        setError(null);
      } catch (err) {
        setError({ message: err.message || "Could not load your cart" });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [enabled, userId]);

  const lines = view?.lines ?? [];
  const skuOf = (productId, size, color) =>
    lines.find(
      (line) =>
        line.productId === productId &&
        String(line.size) === String(size).toUpperCase() &&
        line.colour?.code === color,
    )?.sku;
  const buyable = lines.filter((line) => !line.issue);
  const sum = (pick) => buyable.reduce((total, line) => total + pick(line) * line.quantity, 0);

  /** Adds one unit. Returns { ok: false, message } when the server refuses. */
  const addToCart = async (id, size, color, product) => {
    const wanted = `${color}-${String(size).toUpperCase()}`;
    const sku =
      product?.skus?.find((entry) => entry.colorSize === wanted)?.sku ??
      product?.variants?.find((v) => v.colour?.code === color && v.size === String(size).toUpperCase())?.sku;
    if (!sku) return { ok: false, message: "This colour and size is not available" };
    return apply(cartApi.addLine(sku, 1));
  };

  const updateQuantity = async (itemId, size, color, quantity) => {
    const sku = skuOf(itemId, size, color);
    if (!sku) return { ok: false, message: "Item not in cart" };
    return apply(quantity > 0 ? cartApi.setLineQuantity(sku, quantity) : cartApi.removeLine(sku));
  };

  const removeCartItem = async (id, size, color) => {
    const sku = skuOf(id, size, color);
    return sku ? apply(cartApi.removeLine(sku)) : { ok: true };
  };

  return {
    addToCart,
    getCartCount: () => view?.itemCount ?? 0,
    updateQuantity,
    navigate,
    // Totals over the lines that can be bought, priced by the server.
    getCartAmount: async () => rupees(view?.totals?.subtotal) ?? 0,
    getCartOriginalAmount: async () => sum((line) => rupees(line.listPrice) ?? rupees(line.unitPrice) ?? 0),
    getCartTotalWeight: async () => sum((line) => line.weightGrams ?? 0),
    removeCartItem,
    cart: cartApi.toLegacyCart(view),
    extraCharge: 300,
    clearCart: () => apply(cartApi.clearCart()),
    isLoading,
    error,
    checkoutBlockedReason: cartApi.checkoutBlockedReason(view),
    serverCart: true,
  };
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // null until the server says which cart this visitor has.
  const [cartV2, setCartV2] = useState(null);
  const flags = useRef(null);

  useEffect(() => {
    let stale = false;
    const request = cartApi.getFlags();
    flags.current = request;
    request.then((result) => {
      if (!stale) setCartV2(Boolean(result.cartV2));
    });
    return () => {
      stale = true;
    };
  }, [user?._id]);

  // Both hooks always run (rules of hooks); only one backs the context.
  const local = useLocalCart(user, navigate);
  const server = useServerCart(user, navigate, cartV2 === true);
  const carts = useRef({ local, server });
  carts.current = { local, server };

  // Until then the shop shows the server cart as loading, and an item added in
  // that moment waits for the answer instead of going into the wrong cart.
  const value = cartV2 === false ? local : server;
  const addToCart = async (...item) => {
    const { cartV2: isServerCart } = await flags.current;
    return carts.current[isServerCart ? "server" : "local"].addToCart(...item);
  };

  return (
    <CartContext.Provider
      value={{ ...value, addToCart, isLoading: cartV2 === null || value.isLoading }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  return useContext(CartContext);
};
