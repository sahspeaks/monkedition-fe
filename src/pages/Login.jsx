// import React, { useState, useEffect } from "react";
// import { useNavigate, Link, useLocation } from "react-router-dom";
// import { useAuth } from "../context/NewAuthContext";
// import { Title } from "../components/Title";
// import { Loader2 } from "lucide-react";
// import { FcGoogle } from "react-icons/fc";

// function Login() {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [loginAttempts, setLoginAttempts] = useState(0);
//   const [isBlocked, setIsBlocked] = useState(false);
//   const [blockTimer, setBlockTimer] = useState(0);

//   const { login, isLoading, isAuthenticated, googleLogin } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // Get the return URL from query parameters
//   const returnTo = new URLSearchParams(location.search).get("returnTo") || "/";

//   // Redirect if already authenticated
//   useEffect(() => {
//     if (isAuthenticated && !isLoading) {
//       navigate(returnTo, { replace: true });
//     }
//   }, [isAuthenticated, isLoading, navigate, returnTo]);

//   // Handle rate limiting
//   useEffect(() => {
//     if (loginAttempts >= 5) {
//       setIsBlocked(true);
//       setBlockTimer(300); // 5 minutes in seconds
//     }
//   }, [loginAttempts]);

//   // Block timer countdown
//   useEffect(() => {
//     let interval;
//     if (isBlocked && blockTimer > 0) {
//       interval = setInterval(() => {
//         setBlockTimer((prev) => prev - 1);
//       }, 1000);
//     } else if (blockTimer === 0) {
//       setIsBlocked(false);
//       setLoginAttempts(0);
//     }
//     return () => clearInterval(interval);
//   }, [isBlocked, blockTimer]);

//   const validateForm = () => {
//     const newErrors = {};
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!formData.email.trim()) {
//       newErrors.email = "Email is required";
//     } else if (!emailRegex.test(formData.email)) {
//       newErrors.email = "Invalid email format";
//     }

//     if (!formData.password) {
//       newErrors.password = "Password is required";
//     } else if (formData.password.length < 6) {
//       newErrors.password = "Password must be at least 6 characters";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//     // Clear errors when user types
//     if (errors[name]) {
//       setErrors((prev) => ({
//         ...prev,
//         [name]: undefined,
//         form: undefined,
//       }));
//     }
//   };

//   const handleGoogleLogin = async () => {
//     try {
//       googleLogin();
//     } catch (error) {
//       console.error("Google login error:", error);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (isBlocked) {
//       return;
//     }

//     if (!validateForm()) {
//       return;
//     }

//     try {
//       setIsSubmitting(true);
//       setErrors({});

//       await login(formData.email, formData.password);
//       // Reset attempts on successful login
//       setLoginAttempts(0);

//       // Redirect handled by useEffect
//     } catch (err) {
//       setLoginAttempts((prev) => prev + 1);

//       let errorMessage = "Failed to log in. Please check your credentials.";

//       if (!navigator.onLine) {
//         errorMessage = "No internet connection. Please check your network.";
//       } else if (err.message === "User not found") {
//         errorMessage = "No account found with this email.";
//       } else if (err.message === "Invalid password") {
//         errorMessage = "Incorrect password.";
//       } else if (err.message.includes("Too many")) {
//         errorMessage = "Too many login attempts. Please try again later.";
//       }

//       setErrors({ form: errorMessage });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="h-[70vh] flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-orange-700" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12">
//       <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
//         <div className="text-center">
//           <Title text1="SIGN" text2=" IN" />
//         </div>

//         <form onSubmit={handleSubmit} className="mt-8 space-y-6">
//           {errors.form && (
//             <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
//               <p className="text-red-700 text-sm">{errors.form}</p>
//             </div>
//           )}

//           {isBlocked && (
//             <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
//               <p className="text-blue-700 text-sm">
//                 Too many login attempts. Please try again in{" "}
//                 {Math.floor(blockTimer / 60)}:
//                 {String(blockTimer % 60).padStart(2, "0")} minutes.
//               </p>
//             </div>
//           )}

//           <div className="space-y-4">
//             <div>
//               <label htmlFor="email" className="sr-only">
//                 Email Address
//               </label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 disabled={isSubmitting || isBlocked}
//                 className={`appearance-none relative block w-full px-3.5 py-2 border rounded-md focus:outline-none focus:ring-orange-400 focus:border-orange-400 sm:text-sm ${
//                   errors.email ? "border-red-500" : "border-gray-300"
//                 }`}
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Email Address"
//               />
//               {errors.email && (
//                 <p className="mt-1 text-xs text-red-500">{errors.email}</p>
//               )}
//             </div>

//             <div>
//               <label htmlFor="password" className="sr-only">
//                 Password
//               </label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 autoComplete="current-password"
//                 disabled={isSubmitting || isBlocked}
//                 className={`appearance-none relative block w-full px-3.5 py-2 border rounded-md focus:outline-none focus:ring-orange-400 focus:border-orange-400 sm:text-sm ${
//                   errors.password ? "border-red-500" : "border-gray-300"
//                 }`}
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="Password"
//               />
//               {errors.password && (
//                 <p className="mt-1 text-xs text-red-500">{errors.password}</p>
//               )}
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isSubmitting || isBlocked}
//             className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? (
//               <Loader2 className="h-5 w-5 animate-spin" />
//             ) : (
//               "Sign In"
//             )}
//           </button>

//           <div className="text-center mt-4">
//             <Link
//               to="/signup"
//               className="text-sm text-gray-400 hover:text-orange-800"
//               tabIndex={isSubmitting || isBlocked ? -1 : 0}
//             >
//               Create a new account?{" "}
//               <span className="font-medium text-orange-700">Sign Up</span>
//             </Link>
//           </div>
//         </form>
//         {/* Google Sign-In Button */}
//         <div className="mt-4 flex items-center justify-center gap-2 bg-slate-300 rounded-lg p-2 hover:bg-slate-400">
//           <FcGoogle size={22} />
//           <button onClick={handleGoogleLogin}>Sign in with Google</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Login;


// --------------------------------------------------------------------------------------------------------------------------------


import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/NewAuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Title } from "../components/Title";
import { Loader2, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, isAuthenticated, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the return URL from query parameters
  const returnTo = new URLSearchParams(location.search).get("returnTo") || "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, returnTo]);

  // Handle rate limiting
  useEffect(() => {
    if (loginAttempts >= 5) {
      setIsBlocked(true);
      setBlockTimer(300); // 5 minutes in seconds
    }
  }, [loginAttempts]);

  // Block timer countdown
  useEffect(() => {
    let interval;
    if (isBlocked && blockTimer > 0) {
      interval = setInterval(() => {
        setBlockTimer((prev) => prev - 1);
      }, 1000);
    } else if (blockTimer === 0) {
      setIsBlocked(false);
      setLoginAttempts(0);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockTimer]);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
        form: undefined,
      }));
    }
  };

  // Google's own button returns an ID token, which the server verifies was
  // issued for this site (#42).
  const handleGoogleCredential = async ({ credential }) => {
    try {
      setErrors({});
      await googleLogin(credential);
    } catch (error) {
      setErrors({ form: error.message || "Google sign-in failed. Please try again." });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isBlocked) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      await login(formData.email, formData.password);
      // Reset attempts on successful login
      setLoginAttempts(0);

      // Redirect handled by useEffect
    } catch (err) {
      setLoginAttempts((prev) => prev + 1);

      let errorMessage = "Failed to log in. Please check your credentials.";

      if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      } else if (err.message === "User not found") {
        errorMessage = "No account found with this email.";
      } else if (err.message === "Invalid password") {
        errorMessage = "Incorrect password.";
      } else if (err.message.includes("Too many")) {
        errorMessage = "Too many login attempts. Please try again later.";
      }

      setErrors({ form: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center  ">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-700" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex  justify-center bg-canvas px-4 py-8  sm:py-12">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-grey/10   p-6 sm:p-8  bg-gradient-to-br">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mb-2 text-2xl">
              <Title text1="SIGN" text2=" IN" />
            </div>
            <p className="text-gray-600 text-sm">Welcome back! Please sign in to your account</p>
          </div>

          {/* Error Messages */}
          {errors.form && (
            <div className="mb-4 sm:mb-6 flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm leading-relaxed">{errors.form}</p>
            </div>
          )}

          {isBlocked && (
            <div className="mb-4 sm:mb-6 flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-orange-700 flex-shrink-0 mt-0.5" />
              <p className="text-orange-700 text-sm leading-relaxed">
                Too many login attempts. Please try again in{" "}
                {Math.floor(blockTimer / 60)}:
                {String(blockTimer % 60).padStart(2, "0")} minutes.
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting || isBlocked}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-500 transition-colors duration-200 ${
                    errors.email 
                      ? "border-red-300 bg-red-50" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isSubmitting || isBlocked}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-500 transition-colors duration-200 ${
                    errors.password 
                      ? "border-red-300 bg-red-50" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || isBlocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.password}</span>
                </p>
              )}
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-orange-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isBlocked}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold bg-orange-400 text-black bg-gradient-to-r focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className={`flex justify-center ${isSubmitting || isBlocked ? "pointer-events-none opacity-50" : ""}`}>
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() => setErrors({ form: "Google sign-in failed. Please try again." })}
              text="signin_with"
              shape="pill"
              width="320"
            />
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-orange-700 hover:text-orange-800 transition-colors duration-200"
                tabIndex={isSubmitting || isBlocked ? -1 : 0}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;