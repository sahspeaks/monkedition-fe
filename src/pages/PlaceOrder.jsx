// import React, { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/NewAuthContext";
// import { useCartContext } from "../context/CartContext";
// import { colorMap } from "../context/CollectionsContext";

// import { Loader2 } from "lucide-react";
// import { Title } from "../components/Title";
// import { assets } from "../assets/assets";
// import { BASE_URL } from "../server/server";
// import ProfileInputTile from "../components/ProfileInputTile";

// const PlaceOrder = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const { clearCart, extraCharge } = useCartContext();
//   const cartSummary = location.state?.cartSummary;
//   const isBuyNow = location.state?.isBuyNow;

//   const [paymentMethod, setPaymentMethod] = useState("COD");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
//   const [shippingfee, setShippingFee] = useState(50);

//   const total = cartSummary?.summary.totalAmount;
//   const totalNoOfItems = cartSummary?.summary.noOfItems;
//   const totalDiscount = extraCharge * totalNoOfItems;
//   const originalPrice = total + totalDiscount;
//   const discountPercentage =
//     originalPrice > 0 ? Math.round((totalDiscount / originalPrice) * 100) : 0;

//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     doorNo: "",
//     address: "",
//     city: "",
//     state: "",
//     pincode: "",
//     country: "",
//   });

//   // useEffect(() => {
//   //   const loadRazorpay = async () => {
//   //     if (window.Razorpay) {
//   //       setIsRazorpayLoaded(true);
//   //       return;
//   //     }

//   //     const script = document.createElement("script");
//   //     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//   //     script.async = true;
//   //     script.onload = () => setIsRazorpayLoaded(true);
//   //     script.onerror = () => {
//   //       setError("Failed to load payment gateway. Please try again later.");
//   //     };
//   //     document.body.appendChild(script);
//   //   };

//   //   loadRazorpay();

//   //   return () => {
//   //     const script = document.querySelector(
//   //       'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
//   //     );
//   //     if (script) {
//   //       document.body.removeChild(script);
//   //     }
//   //   };
//   // }, []);
//   function loadScript(src) {
//     return new Promise((resolve) => {
//       const script = document.createElement("script");
//       script.src = src;
//       script.onload = () => {
//         resolve(true);
//       };
//       script.onerror = () => {
//         resolve(false);
//       };
//       document.body.appendChild(script);
//     });
//   }

//   useEffect(() => {
//     if (!cartSummary) {
//       navigate("/");
//       return;
//     }

//     if (user?.address) {
//       setFormData({
//         firstName: user.firstName || "",
//         lastName: user.lastName || "",
//         email: user.email || "",
//         phone: user.phone || "",
//         doorNo: user.address.doorNo || "",
//         address: user.address.street || "",
//         city: user.address.city || "",
//         state: user.address.state || "",
//         pincode: user.address.pincode || "",
//         country: user.address.country || "",
//       });
//     }
//   }, [user, cartSummary]);

//   const handleInputChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const createOrderPayload = () => {
//     const orderItems = cartSummary.items.map((item) => ({
//       productId: item.id,
//       size: item.size,
//       quantity: item.quantity.toString(),
//       color: item.color,
//     }));

//     return {
//       orderItems,
//       deliveryAddress: {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         email: formData.email,
//         phone: formData.phone,
//         doorNo: formData.doorNo,
//         address: formData.address,
//         city: formData.city,
//         state: formData.state,
//         pincode: formData.pincode,
//       },
//       customerId: user?._id,
//       customerName: `${formData.firstName} ${formData.lastName}`,
//       totalAmount: cartSummary.summary.finalTotal + shippingfee,
//       gateway: paymentMethod,
//       gift_wrap: 0,
//       rush_order: 0,
//       orderType: isBuyNow ? "BUY_NOW" : "CART_CHECKOUT",
//     };
//   };

//   const handleCODPayment = async (orderPayload) => {
//     try {
//       const response = await fetch(`${BASE_URL}/api/v1/qikink/order`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(orderPayload),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to create order");
//       }
//       if (!isBuyNow) {
//         clearCart();
//       }
//       navigate(`/successPage/${data.qikinkOrderId}`, {
//         state: { orderDetails: data },
//       });
//     } catch (error) {
//       setError(error.message || "An error occurred. Please try again.");
//     } finally {
//       if (paymentMethod === "COD") {
//         setIsLoading(false);
//       }
//     }
//   };
//   const createRazorpayOrder = async (orderPayload) => {
//     try {
//       //load razorpay script
//       const razorpayScriptLoaded = await loadScript(
//         "https://checkout.razorpay.com/v1/checkout.js"
//       );
//       if (!razorpayScriptLoaded) {
//         throw new Error("Failed to load Razorpay script");
//       }
//       //step 1 initiate payment
//       const initResponse = await fetch(
//         `${BASE_URL}/api/v1/razorpay/initiate-payment`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ amount: orderPayload.totalAmount }),
//         }
//       );
//       const { razorpayOrderId } = await initResponse.json();
//       // console.log("Razorpay Order ID:", razorpayOrderId);
//       //step 2 open razorpay payment window
//       const options = {
//         key: import.meta.env.VITE_RAZORPAY_KEY_ID,
//         amount: (orderPayload.totalAmount * 100).toString(),
//         currency: "INR",
//         name: "Monkedition",
//         description: "Order Payment",
//         image:
//           "https://res.cloudinary.com/dra8tbz4z/image/upload/v1749202863/MF/L_pqzxzz.png",
//         order_id: razorpayOrderId,
//         handler: async (response) => {
//           try {
//             // console.log("Inside handler Razorpay response:", response);
//             const paymentCompleteResponse = await fetch(
//               `${BASE_URL}/api/v1/razorpay/process-order`,
//               {
//                 method: "POST",
//                 headers: {
//                   Authorization: `Bearer ${localStorage.getItem(
//                     "accessToken"
//                   )}`,
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                   ...orderPayload,
//                   paymentId: response.razorpay_payment_id,
//                   razorpayOrderId: razorpayOrderId,
//                   razorpaySignature: response.razorpay_signature,
//                 }),
//               }
//             );
//             if (!paymentCompleteResponse.ok) {
//               throw new Error("Failed to verify payment");
//             }
//             const data = await paymentCompleteResponse.json();
//             // console.log("Payment Complete Response:", data);
//             if (!isBuyNow) {
//               clearCart();
//             }
//             // console.log("Payment Complete Response: Next Navigate", data);
//             navigate(`/successPage/${data.qikinkOrderId}`, {
//               state: { orderDetails: data },
//             });
//           } catch (error) {
//             setError("Payment verification failed. Please contact support.");
//             setIsLoading(false);
//           } finally {
//             setIsLoading(false);
//           }
//         },
//         prefill: {
//           name: `${formData.firstName} ${formData.lastName}`,
//           email: formData.email,
//           contact: formData.phone,
//         },
//         notes: {
//           address: `${formData.doorNo}, ${formData.address}, ${formData.city}, ${formData.state}, ${formData.pincode}`,
//         },
//         theme: {
//           color: "#FDBA74",
//         },
//       };
//       const razorpayInstance = new window.Razorpay(options);
//       razorpayInstance.open();
//     } catch (error) {
//       setError(error.message || "An error occurred. Please try again.");
//       setIsLoading(false);
//     } finally {
//       setIsLoading(false);
//     }
//   };
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setIsLoading(true);
//     const orderPayload = createOrderPayload();
//     try {
//       if (paymentMethod === "COD") {
//         handleCODPayment(orderPayload);
//         return;
//       }
//       if (paymentMethod === "Prepaid") {
//         createRazorpayOrder(orderPayload);
//       }
//     } catch (error) {
//       setError(error.message || "An error occurred. Please try again.");
//       setIsLoading(false);
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//     }).format(amount);
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="flex flex-col md:flex-row justify-between gap-4 p-5 md:p-10"
//     >
//       <div className="flex flex-col gap-4 w-full lg:w-1/2">
//         <div className="text-2xl">
//           <Title text1={"Checkout"} text2={"  Details"} />
//         </div>

//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
//             <strong className="font-bold">Error!</strong>
//             <span className="block sm:inline">{error}</span>
//           </div>
//         )}

//         <div className="bg-white rounded-lg border border-gray-200 p-5">
//           <Title text1="Contact" text2={" Information"} />
//           {/* Contact form fields */}
//           <div className="flex flex-col gap-4">
//             <div className="flex flex-col md:flex-row gap-4">
//               <ProfileInputTile
//                 name="firstName"
//                 value={formData.firstName}
//                 handleInputChange={handleInputChange}
//                 title="First Name"
//                 placeholder="First Name"
//                 required
//               />

//               <ProfileInputTile
//                 title="Last Name"
//                 name="lastName"
//                 value={formData.lastName}
//                 handleInputChange={handleInputChange}
//                 placeholder="Last Name"
//                 required
//               />
//             </div>
//             <div className="flex flex-col md:flex-row gap-4">
//               <ProfileInputTile
//                 title="Email"
//                 name="email"
//                 value={formData.email}
//                 handleInputChange={handleInputChange}
//                 type="email"
//                 placeholder="Email"
//                 required
//               />
//               <ProfileInputTile
//                 title={"Phone"}
//                 name="phone"
//                 value={formData.phone}
//                 handleInputChange={handleInputChange}
//                 type="tel"
//                 placeholder="Phone"
//                 required
//               />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border border-gray-200 p-5">
//           <Title text1={"Shipping"} text2={" Address"} />
//           {/* Address form fields */}
//           <div className="flex  flex-col gap-4">
//             <div className="flex flex-col md:flex-row gap-4">
//               <ProfileInputTile
//                 title="Door No"
//                 name="doorNo"
//                 value={formData.doorNo}
//                 handleInputChange={handleInputChange}
//                 placeholder="Door No"
//                 required
//               />
//               <ProfileInputTile
//                 title={"Address"}
//                 name="address"
//                 value={formData.address}
//                 handleInputChange={handleInputChange}
//                 placeholder="Street Address"
//                 required
//               />
//             </div>

//             <div className="flex flex-col md:flex-row gap-4">
//               <ProfileInputTile
//                 title={"City"}
//                 name="city"
//                 value={formData.city}
//                 handleInputChange={handleInputChange}
//                 placeholder="City"
//                 required
//               />
//               <ProfileInputTile
//                 title={"State"}
//                 name="state"
//                 value={formData.state}
//                 handleInputChange={handleInputChange}
//                 placeholder="State"
//                 required
//               />
//             </div>
//             <div className="flex flex-col md:flex-row gap-4">
//               <ProfileInputTile
//                 title={"PIN Code"}
//                 name="pincode"
//                 value={formData.pincode}
//                 handleInputChange={handleInputChange}
//                 placeholder="PIN Code"
//                 required
//               />
//               <ProfileInputTile
//                 title={"Country"}
//                 name="country"
//                 value={formData.country}
//                 handleInputChange={handleInputChange}
//                 placeholder="Country"
//                 required
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="w-full lg:w-2/5">
//         <div className="bg-white rounded-lg border border-gray-200 p-6">
//           <div className="text-xl">
//             <Title text1={"Order"} text2={" Summary"} />
//           </div>
//           <div className="flex flex-col gap-4">
//             <div className="max-h-60 overflow-y-auto">
//               {cartSummary?.items.map((item, index) => (
//                 <div key={index} className="flex gap-4 py-4 border-b">
//                   <img
//                     src={item.image}
//                     alt={item.name}
//                     className="w-20 h-20 object-cover rounded"
//                   />
//                   <div className="flex flex-col">
//                     <p className="font-medium">{item.name}</p>
//                     <p className="text-sm text-gray-500">Size: {item.size}</p>
//                     <p className="text-sm text-gray-500">
//                       Qty: {item.quantity}
//                     </p>
//                     <p className="text-sm">₹{item.price}</p>
//                     <div className="flex items-center gap-2">
//                       <p className="text-sm text-gray-500">Color:</p>
//                       <div
//                         className={`w-5 h-5 rounded-full border border-gray-300 ${
//                           colorMap[item.color]
//                         }`}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="flex flex-col gap-2 mt-4">
//               {totalDiscount > 0 && (
//                 <div className="flex justify-between">
//                   <p className="font-medium">Original Price</p>
//                   <p className="line-through text-gray-500">
//                     {formatCurrency(originalPrice)}
//                   </p>
//                 </div>
//               )}

//               {totalDiscount > 0 && (
//                 <div className="flex justify-between">
//                   <p className="font-medium">
//                     Discount{" "}
//                     <span className="text-green-600 text-xs">
//                       ({discountPercentage}%)
//                     </span>
//                   </p>
//                   <p className="text-green-600">
//                     -{formatCurrency(totalDiscount)}
//                   </p>
//                 </div>
//               )}
//               <div className="flex justify-between">
//                 <span>Subtotal</span>
//                 <span>₹{cartSummary?.summary.totalAmount}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Shipping</span>
//                 <span>₹{shippingfee}</span>
//               </div>
//               <div className="flex justify-between font-bold mt-2 pt-2 border-t">
//                 <span>Total</span>
//                 <span>₹{cartSummary?.summary.finalTotal + shippingfee}</span>
//               </div>
//             </div>

//             <div className="mt-6">
//               <p className="font-medium mb-4">Payment Method</p>
//               <div className="flex gap-4">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setPaymentMethod("Prepaid");
//                     setShippingFee(0);
//                   }}
//                   className={`border p-4 rounded flex-1 ${
//                     paymentMethod === "Prepaid" ? "border-orange-300" : ""
//                   }`}
//                 >
//                   Online
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setPaymentMethod("COD");
//                     setShippingFee(50);
//                   }}
//                   className={`border p-4 rounded flex-1 ${
//                     paymentMethod === "COD" ? "border-orange-300" : ""
//                   }`}
//                 >
//                   Cash on Delivery
//                 </button>
//               </div>
//             </div>

//             <div className="flex justify-center items-center ">
//               <img src={assets.payments_options} alt="" className="h-20 w-40" />
//             </div>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full flex justify-center items-center gap-2 bg-orange-300 text-black py-3 rounded-md  font-medium disabled:bg-orange-200"
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 "Place Order"
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </form>
//   );
// };

// export default PlaceOrder;

import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toLocalMobile } from "../utils/phone";
import { useAuth } from "../context/NewAuthContext";
import { api } from "../api/client";
import { requestEmailOtp, verifyEmailOtp } from "../api/auth";
import { rupees } from "../api/adapters";
import {
  checkoutErrorMessage,
  checkoutV2Enabled,
  confirmPayment,
  ensureAddress,
  placeOrder,
  promoErrorMessage,
  quoteItems,
} from "../api/checkout";
import { useCartContext } from "../context/CartContext";
import { colorMap } from "../context/CollectionsContext";

import { Loader2, MapPin } from "lucide-react";
import { Title } from "../components/Title";
import { assets } from "../assets/assets";
import ProfileInputTile from "../components/ProfileInputTile";
import {
  ProfileSelectTile,
  INDIAN_STATES,
} from "../components/ProfileSelectTile";
import {
  fetchLocationByPincode,
  validatePincode as servicePincodeValidation,
} from "../context/LocationService";
import CartTotal from "../components/CartTotal";

const PlaceOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  const { clearCart } = useCartContext();
  const cartSummary = location.state?.cartSummary;
  const isBuyNow = location.state?.isBuyNow;
  const [shippingCost, setShippingCost] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [CODFee, setCODFee] = useState(50);
  const [checkoutV2, setCheckoutV2] = useState(false);
  const [otp, setOtp] = useState(null); // null, or { code, sent, busy, error }
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoError, setPromoError] = useState(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const total = cartSummary?.summary.totalAmount;
  const totalNoOfItems = cartSummary?.summary.noOfItems;
  const totalDiscount =
    cartSummary?.summary.originalAmount - cartSummary?.summary.totalAmount;
  const originalPrice = total + totalDiscount;
  const discountPercentage =
    originalPrice > 0 ? Math.round((totalDiscount / originalPrice) * 100) : 0;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    doorNo: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });
  // New state for PIN code location fetching
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/; // Indian pincode format
    return pincodeRegex.test(pincode);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z0-9\s]{2,30}$/;
    return nameRegex.test(name.trim());
  };

  const validateAddress = (address) => {
    return address.trim().length >= 5 && address.trim().length <= 200;
  };

  const validateCity = (city) => {
    const cityRegex = /^[a-zA-Z\s]{2,50}$/;
    return cityRegex.test(city.trim());
  };

  const validateState = (state) => {
    return INDIAN_STATES.includes(state);
  };

  const validateDoorNo = (doorNo) => {
    return doorNo.trim().length >= 1 && doorNo.trim().length <= 20;
  };

  const validateCountry = (country) => {
    const countryRegex = /^[a-zA-Z\s]{2,50}$/;
    return countryRegex.test(country.trim());
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          error = "First name is required";
        } else if (!validateName(value)) {
          error = "First name should be 2-30 characters long";
        }
        break;

      case "lastName":
        if (!value.trim()) {
          error = "Last name is required";
        } else if (!validateName(value)) {
          error = "Last name should be 2-30 characters long";
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!validateEmail(value)) {
          error = "Please enter a valid email address";
        }
        break;

      case "phone":
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (!validatePhone(value)) {
          error = "Please enter a valid 10-digit Indian mobile number";
        }
        break;

      case "doorNo":
        if (!value.trim()) {
          error = "Door number is required";
        } else if (!validateDoorNo(value)) {
          error = "Door number should be 1-20 characters long";
        }
        break;

      case "address":
        if (!value.trim()) {
          error = "Address is required";
        } else if (!validateAddress(value)) {
          error = "Address should be 5-200 characters long";
        }
        break;

      case "city":
        if (!value.trim()) {
          error = "City is required";
        } else if (!validateCity(value)) {
          error =
            "City should contain only letters and be 2-50 characters long";
        }
        break;

      case "state":
        if (!value.trim()) {
          error = "State is required";
        } else if (!validateState(value)) {
          error =
            "State should contain only letters and be 2-50 characters long";
        }
        break;

      case "pincode":
        if (!value.trim()) {
          error = "PIN code is required";
        } else if (!validatePincode(value)) {
          error = "Please enter a valid 6-digit PIN code";
        }
        break;

      case "country":
        if (!value.trim()) {
          error = "Country is required";
        } else if (!validateCountry(value)) {
          error =
            "Country should contain only letters and be 2-50 characters long";
        }
        break;

      default:
        break;
    }

    return error;
  };

  // Validate all fields
  const validateAllFields = () => {
    const errors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
      }
    });
    return errors;
  };
  // Fetch city and state based on PIN code
  const handlePincodeLocationFetch = async (pincode) => {
    if (!validatePincode(pincode)) {
      return;
    }

    setIsPincodeLoading(true);
    setLocationDetected(false);

    try {
      const result = await fetchLocationByPincode(pincode);
      // console.log(result);

      if (result.success) {
        // Update form data with fetched city and state
        setFormData((prev) => ({
          ...prev,
          city: result.data.division,
          state: result.data.state,
        }));

        // Clear any existing validation errors for city and state
        setValidationErrors((prev) => ({
          ...prev,
          city: "",
          state: "",
          pincode: "",
        }));

        setLocationDetected(true);
        console.log(result.message);
      } else {
        // If PIN code is not found, show error
        setValidationErrors((prev) => ({
          ...prev,
          pincode: result.error,
        }));
        setLocationDetected(false);
      }
    } catch (error) {
      console.error("Error in handlePincodeLocationFetch:", error);
      setValidationErrors((prev) => ({
        ...prev,
        pincode: "Unable to fetch location. Please enter manually.",
      }));
      setLocationDetected(false);
    } finally {
      setIsPincodeLoading(false);
    }
  };

  function loadScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  useEffect(() => {
    if (!cartSummary) {
      navigate("/");
      return;
    }

    if (user?.address) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: toLocalMobile(user.phone),
        doorNo: user.address.doorNo || "",
        address: user.address.street || "",
        city: user.address.city || "",
        state: user.address.state || "",
        pincode: user.address.pincode || "",
        country: user.address.country || "",
      });
    }
  }, [user, cartSummary]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Real-time validation for specific fields
    let processedValue = value;

    // Process phone number (remove spaces and special characters)
    if (name === "phone") {
      processedValue = value.replace(/\D/g, ""); // Keep only digits
      if (processedValue.length > 10) {
        processedValue = processedValue.slice(0, 10);
      }
    }

    // Process pincode (keep only digits)
    if (name === "pincode") {
      processedValue = value.replace(/\D/g, "");
      if (processedValue.length > 6) {
        processedValue = processedValue.slice(0, 6);
      }
      // Auto-fetch location when pincode is complete (6 digits)
      if (processedValue.length === 6) {
        handlePincodeLocationFetch(processedValue);
      } else {
        setLocationDetected(false);
      }
    }

    // Process names (remove numbers and special characters)
    if (name === "city" || name === "state" || name === "country") {
      processedValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });

    // Real-time validation
    const error = validateField(name, processedValue);
    if (error) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const createOrderPayload = () => {
    const orderItems = cartSummary.items.map((item) => ({
      productId: item.id,
      size: item.size,
      quantity: item.quantity.toString(),
      color: item.color,
    }));

    return {
      orderItems,
      deliveryAddress: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        doorNo: formData.doorNo.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      },
      customerId: user?._id,
      customerName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      totalAmount: cartSummary.summary.finalTotal + CODFee,
      qikinkValue:
        paymentMethod === "RAZORPAY"
          ? Math.round(
              cartSummary.summary.finalTotal +
                shippingCost +
                shippingCost * 0.18 +
                cartSummary.summary.finalTotal * 0.05
            )
          : Math.round(
              cartSummary.summary.finalTotal +
                shippingCost +
                shippingCost * 0.18 +
                cartSummary.summary.finalTotal * 0.05
            ) + 40,
      gateway: paymentMethod,
      gift_wrap: 0,
      rush_order: 0,
      orderType: isBuyNow ? "BUY_NOW" : "CART_CHECKOUT",
    };
  };

  const handleCODPayment = async (orderPayload) => {
    try {
      // Through the shared client, so an expired session is refreshed.
      const data = await api.post("/api/v1/qikink/order", orderPayload);
      if (!isBuyNow) {
        clearCart();
      }
      // qikinkOrderId is null while Qikink confirmation is pending.
      navigate(`/successPage/${data.qikinkOrderId || data.orderId}`, {
        state: { orderDetails: data },
      });
    } catch (error) {
      // v1 checkout has been switched off for this customer: use v2.
      if (error.status === 410) return await placeOnV2();
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      if (paymentMethod === "COD") {
        setIsLoading(false);
      }
    }
  };

  const createRazorpayOrder = async (orderPayload) => {
    try {
      //load razorpay script
      const razorpayScriptLoaded = await loadScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );
      if (!razorpayScriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }
      //step 1 initiate payment
      // The full payload (not just the amount) lets the server create the
      // order from Razorpay's webhook if this tab closes after paying.
      const { razorpayOrderId } = await api.post(
        "/api/v1/razorpay/initiate-payment",
        orderPayload
      );
      // console.log("Razorpay Order ID:", razorpayOrderId);
      //step 2 open razorpay payment window
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID.toString(),
        amount: (orderPayload.totalAmount * 100).toString(),
        currency: "INR",
        name: "Monkedition",
        description: "Order Payment",
        image:
          "https://res.cloudinary.com/dra8tbz4z/image/upload/v1749202863/MF/L_pqzxzz.png",
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            // console.log("Inside handler Razorpay response:", response);
            const data = await api.post("/api/v1/razorpay/process-order", {
              ...orderPayload,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: razorpayOrderId,
              razorpaySignature: response.razorpay_signature,
            });
            // console.log("Payment Complete Response:", data);
            if (!isBuyNow) {
              clearCart();
            }
            // console.log("Payment Complete Response: Next Navigate", data);
            navigate(`/successPage/${data.qikinkOrderId || data.orderId}`, {
              state: { orderDetails: data },
            });
          } catch {
            // The payment went through; the server finishes the order from
            // Razorpay's webhook even if this call failed.
            setError(
              "We received your payment but could not confirm the order here. It will appear in My Orders within a few minutes; contact support if it does not."
            );
            setIsLoading(false);
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: `${formData.doorNo}, ${formData.address}, ${formData.city}, ${formData.state}, ${formData.pincode}`,
        },
        theme: {
          color: "#FDBA74",
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.open();
    } catch (error) {
      if (error.status === 410) return await placeOnV2();
      setError(error.message || "An error occurred. Please try again.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // --- checkout v2 (P3-12) -----------------------------------------------------
  // The server prices the order from a quote, and Razorpay opens for the
  // server's amount, never the page's.

  useEffect(() => {
    checkoutV2Enabled().then(setCheckoutV2);
  }, []);

  // COD needs a verified email: the code proves it once for the account.
  const sendOtp = async () => {
    setOtp((current) => ({ ...current, busy: true, error: "" }));
    try {
      const { alreadyVerified } = await requestEmailOtp();
      if (alreadyVerified) {
        await fetchUser();
        setOtp(null);
        return;
      }
      setOtp((current) => ({ ...current, busy: false, sent: true }));
    } catch (error) {
      setOtp((current) => ({ ...current, busy: false, error: error.message || "Could not send the code." }));
    }
  };

  const confirmOtp = async () => {
    setOtp((current) => ({ ...current, busy: true, error: "" }));
    try {
      await verifyEmailOtp(otp.code.trim());
      await fetchUser();
      setOtp(null);
      setError(null);
    } catch (error) {
      const invalid = error.body?.errors?.[0]?.path === "code";
      setOtp((current) => ({
        ...current,
        busy: false,
        error: invalid ? "That code is wrong or has expired." : error.message || "Could not check the code.",
      }));
    }
  };

  const applyPromo = async () => {
    setPromoError(null);
    if (!formData.pincode.trim()) {
      setPromoError("Please enter your delivery PIN code first.");
      return;
    }
    setApplyingPromo(true);
    try {
      const quote = await quoteItems(
        cartSummary.items,
        paymentMethod === "COD" ? "COD" : "PREPAID",
        { pincode: formData.pincode.trim(), state: formData.state.trim() },
        promoInput.trim(),
      );
      if (quote.discount?.code) {
        setPromo({ code: quote.discount.code, discount: rupees(quote.discount.amount) });
      } else {
        setPromo(null);
        setPromoError(promoErrorMessage(quote.discount?.rejectedReason));
      }
    } catch (error) {
      setPromoError(checkoutErrorMessage(error));
    } finally {
      setApplyingPromo(false);
    }
  };

  const finishOrder = (order) => {
    if (!isBuyNow) clearCart();
    setIsLoading(false);
    navigate(`/successPage/${order.orderNumber}`, { state: { orderDetails: order } });
  };

  const placeOnV2 = async () => {
    const method = paymentMethod === "COD" ? "COD" : "PREPAID";
    if (method === "COD" && user?.emailVerified === false) {
      setOtp({ code: "", sent: false, busy: false, error: "" });
      setIsLoading(false);
      return;
    }
    try {
      const addressId = await ensureAddress(formData);
      const quote = await quoteItems(
        cartSummary.items,
        method,
        { pincode: formData.pincode.trim(), state: formData.state.trim() },
        promo?.code,
      );
      const total = rupees(quote.grandTotal);
      const shown =
        cartSummary.summary.finalTotal + (method === "COD" ? CODFee : 0) - (promo?.discount ?? 0);
      if (
        Math.abs(total - shown) >= 1 &&
        !window.confirm(
          `The total for this order is ₹${total} (this page showed ₹${shown}). Place the order?`,
        )
      ) {
        setIsLoading(false);
        return;
      }
      const order = await placeOrder({ quoteId: quote.quoteId, addressId, paymentMethod: method });
      if (method === "COD") {
        finishOrder(order);
        return;
      }

      if (!(await loadScript("https://checkout.razorpay.com/v1/checkout.js"))) {
        throw new Error("Could not load the payment window. Please check your connection and try again.");
      }
      const razorpay = new window.Razorpay({
        key: order.payment.keyId,
        amount: String(order.payment.amount.amount),
        currency: "INR",
        order_id: order.payment.gatewayOrderId,
        name: "Monkedition",
        description: `Order ${order.orderNumber}`,
        image: "https://res.cloudinary.com/dra8tbz4z/image/upload/v1749202863/MF/L_pqzxzz.png",
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#FDBA74" },
        handler: async (response) => {
          try {
            await confirmPayment({
              orderNumber: order.orderNumber,
              gatewayOrderId: response.razorpay_order_id,
              gatewayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          } catch {
            // Paid: Razorpay's webhook confirms the order even if this call failed.
          }
          finishOrder(order);
        },
        modal: {
          // The order exists and holds its stock until the payment window ends,
          // so it is finished from My Orders; placing it again would duplicate it.
          ondismiss: () => {
            if (!isBuyNow) clearCart();
            setIsLoading(false);
            navigate("/orders", {
              state: {
                notice: `Your order ${order.orderNumber} is waiting for payment. Open it and choose "Pay now" within 15 minutes, or it will be cancelled.`,
              },
            });
          },
        },
      });
      razorpay.open();
    } catch (error) {
      if (error.code === "COD_EMAIL_NOT_VERIFIED") {
        setOtp({ code: "", sent: false, busy: false, error: "" });
      } else {
        setError(checkoutErrorMessage(error));
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate all fields before submission
    const errors = validateAllFields();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please fix the errors in the form before submitting.");
      return;
    }

    // Additional business logic validations
    if (!cartSummary || !cartSummary.items || cartSummary.items.length === 0) {
      setError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    if (!user?._id) {
      setError("Please log in to place an order.");
      return;
    }

    setIsLoading(true);
    if (await checkoutV2Enabled()) {
      placeOnV2();
      return;
    }
    const orderPayload = createOrderPayload();

    try {
      if (paymentMethod === "COD") {
        handleCODPayment(orderPayload);
        return;
      }
      if (paymentMethod === "Prepaid") {
        createRazorpayOrder(orderPayload);
      }
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const calculateShippingCost = () => {
    if (!Array.isArray(cartSummary?.items)) return;

    // Calculate total weight - weight is directly on item, not item.product
    const weight = cartSummary.items.reduce((total, item) => {
      const itemWeight = item.weight ?? 0; // Use item.weight instead of item.product?.weight
      return total + item.quantity * itemWeight;
    }, 0);

    const calculatedShippingCost = Math.ceil(weight / 500) * 54;

    setShippingCost(calculatedShippingCost);
  };

  useEffect(() => {
    calculateShippingCost();
  }, [cartSummary]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row justify-between gap-4 p-5 md:p-10"
    >
      <div className="flex flex-col gap-4 w-full lg:w-1/2">
        <div className="text-2xl">
          <Title text1={"Checkout"} text2={"  Details"} />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <Title text1="Contact" text2={" Information"} />
          {/* Contact form fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <ProfileInputTile
                  name="firstName"
                  value={formData.firstName}
                  handleInputChange={handleInputChange}
                  title="First Name"
                  placeholder="First Name"
                  required
                />
                {validationErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.firstName}
                  </p>
                )}
              </div>

              <div className="flex-1">
                <ProfileInputTile
                  title="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  handleInputChange={handleInputChange}
                  placeholder="Last Name"
                  required
                />
                {validationErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <ProfileInputTile
                  title="Email"
                  name="email"
                  value={formData.email}
                  handleInputChange={handleInputChange}
                  type="email"
                  placeholder="Email"
                  required
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.email}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <ProfileInputTile
                  title={"Phone"}
                  name="phone"
                  value={formData.phone}
                  handleInputChange={handleInputChange}
                  type="tel"
                  placeholder="10-digit mobile number"
                  required
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <Title text1={"Shipping"} text2={" Address"} />
          {/* Address form fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <ProfileInputTile
                  title="Door No"
                  name="doorNo"
                  value={formData.doorNo}
                  handleInputChange={handleInputChange}
                  placeholder="Door No"
                  required
                />
                {validationErrors.doorNo && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.doorNo}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <ProfileInputTile
                  title={"Address"}
                  name="address"
                  value={formData.address}
                  handleInputChange={handleInputChange}
                  placeholder="Street Address"
                  required
                />
                {validationErrors.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.address}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <ProfileInputTile
                  title={"City"}
                  name="city"
                  value={formData.city}
                  handleInputChange={handleInputChange}
                  placeholder="City"
                  required
                />
                {validationErrors.city && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.city}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <ProfileSelectTile
                  title={"State"}
                  name="state"
                  value={formData.state}
                  handleInputChange={handleInputChange}
                  options={INDIAN_STATES}
                  placeholder="Select State"
                  required
                />
                {validationErrors.state && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.state}
                  </p>
                )}
              </div>
            </div>
            {/* PIN CODE With auto detection */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <ProfileInputTile
                    title={"PIN Code"}
                    name="pincode"
                    value={formData.pincode}
                    handleInputChange={handleInputChange}
                    placeholder="6-digit PIN code"
                    required
                  />
                  {isPincodeLoading && (
                    <div className="absolute right-3 top-9 flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    </div>
                  )}
                  {locationDetected && !isPincodeLoading && (
                    <div className="absolute right-3 top-9 flex items-center">
                      <MapPin className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
                {validationErrors.pincode && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.pincode}
                  </p>
                )}
                {locationDetected && !validationErrors.pincode && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location auto-detected
                  </p>
                )}
              </div>
              <div className="flex-1">
                <ProfileInputTile
                  title={"Country"}
                  name="country"
                  value={formData.country}
                  handleInputChange={handleInputChange}
                  placeholder="Country"
                  required
                />
                {validationErrors.country && (
                  <p className="text-red-500 text-sm mt-1">
                    {validationErrors.country}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-2/5">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-xl">
            <Title text1={"Order"} text2={" Summary"} />
          </div>
          <div className="flex flex-col gap-4">
            <div className="max-h-60 overflow-y-auto">
              {cartSummary?.items.map((item, index) => (
                <div key={index} className="flex gap-4 py-4 border-b">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex flex-col">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Size: {item.size}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm">₹{item.price}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Color:</p>
                      <div
                        className={`w-5 h-5 rounded-full border border-gray-300 ${
                          colorMap[item.color]
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {totalDiscount > 0 && (
                <div className="flex justify-between">
                  <p className="font-medium">Original Price</p>
                  <p className=" text-gray-800">
                    {formatCurrency(originalPrice)}
                  </p>
                </div>
              )}

              {totalDiscount > 0 && (
                <div className="flex justify-between">
                  <p className="font-medium">
                    Discount{" "}
                    <span className="text-green-600 text-xs">
                      ({discountPercentage}%)
                    </span>
                  </p>
                  <p className="text-red-600">
                    -{formatCurrency(totalDiscount)}
                  </p>
                </div>
              )}
              <div className="flex justify-between">
                <p className="font-medium">Shipping Cost</p>
                <p className="text-red-600">-{formatCurrency(shippingCost)}</p>
              </div>

              <hr />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartSummary?.summary.totalAmount}</span>
              </div>

              {paymentMethod === "COD" ? (
                <div className="flex justify-between">
                  <span>Extra Charges</span>
                  <span>₹{CODFee}</span>
                </div>
              ) : (
                ""
              )}
              <hr />
              <div className="flex justify-between text-green-600">
                <span>You Saved : </span>
                <span>₹{Math.round(totalDiscount + shippingCost)}</span>
              </div>

              {promo && (
                <div className="flex justify-between text-green-700">
                  <span>Promo {promo.code}</span>
                  <span>-₹{promo.discount}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold mt-2 pt-2 border-t text-xl">
                <span>Total</span>
                <span>₹{cartSummary?.summary.finalTotal + CODFee - (promo?.discount ?? 0)}</span>
              </div>
            </div>

            {checkoutV2 && (
              <div className="mt-6">
                <p className="font-medium mb-2">Promo code</p>
                {promo ? (
                  <div className="flex justify-between items-center text-sm">
                    <span>
                      <strong>{promo.code}</strong> applied
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPromo(null);
                        setPromoInput("");
                      }}
                      className="text-orange-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Promo code"
                      value={promoInput}
                      maxLength={40}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={applyingPromo || !promoInput.trim()}
                      onClick={applyPromo}
                      className="px-4 py-2 rounded bg-orange-300 text-black text-sm disabled:opacity-50"
                    >
                      {applyingPromo ? "Applying..." : "Apply"}
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
              </div>
            )}

            <div className="mt-6">
              <p className="font-medium mb-4">Payment Method</p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("Prepaid");
                    setCODFee(0);
                  }}
                  className={`border p-4 rounded flex-1 transition-colors ${
                    paymentMethod === "Prepaid"
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("COD");
                    setCODFee(50);
                  }}
                  className={`border p-4 rounded flex-1 transition-colors ${
                    paymentMethod === "COD"
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Cash on Delivery
                </button>
              </div>
            </div>

            <div className="flex justify-center items-center ">
              <img src={assets.payments_options} alt="" className="h-20 w-40" />
            </div>

            {otp && paymentMethod === "COD" && (
              <div className="mt-4 p-4 border border-orange-200 bg-orange-50 rounded-lg space-y-2 text-sm">
                <p className="font-medium text-gray-900">Verify your email to pay on delivery</p>
                {!otp.sent ? (
                  <>
                    <p className="text-gray-700">We will email a 6-digit code to {user?.email}. You only need to do this once.</p>
                    <button type="button" disabled={otp.busy} onClick={sendOtp} className="px-4 py-2 rounded bg-orange-300 text-black disabled:opacity-50">
                      {otp.busy ? "Sending..." : "Send code"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700">Enter the code we emailed to {user?.email}. Check your spam folder if you do not see it.</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        aria-label="Verification code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otp.code}
                        onChange={(e) => setOtp({ ...otp, code: e.target.value.replace(/\D/g, "") })}
                        className="w-32 border border-gray-300 rounded px-3 py-2"
                      />
                      <button type="button" disabled={otp.busy || otp.code.length !== 6} onClick={confirmOtp} className="px-4 py-2 rounded bg-orange-300 text-black disabled:opacity-50">
                        Verify
                      </button>
                      <button type="button" disabled={otp.busy} onClick={sendOtp} className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50">
                        Send again
                      </button>
                    </div>
                  </>
                )}
                {otp.error && <p role="alert" className="text-xs text-red-600">{otp.error}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-orange-300 text-black py-3 rounded-md font-medium disabled:bg-orange-200 disabled:cursor-not-allowed transition-colors hover:bg-orange-400 disabled:hover:bg-orange-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
