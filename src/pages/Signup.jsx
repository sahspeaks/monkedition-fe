// import React, { useState, useEffect } from "react";
// import { useNavigate, Link, useLocation } from "react-router-dom";
// import { useAuth } from "../context/NewAuthContext";
// import { Title } from "../components/Title";
// import { Eye, EyeOff, Loader2 } from "lucide-react";
// import { FcGoogle } from "react-icons/fc";

// export default function Signup() {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     password: "",
//     phone: "",
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [passwordStrength, setPasswordStrength] = useState({
//     score: 0,
//     feedback: "",
//   });

//   const { signup, googleLogin } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const returnTo = new URLSearchParams(location.search).get("returnTo") || "/";

//   // Debounced password strength checker
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (formData.password) {
//         checkPasswordStrength(formData.password);
//       }
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [formData.password]);

//   const checkPasswordStrength = (password) => {
//     let score = 0;
//     let feedback = [];

//     if (password.length >= 8) score += 1;
//     if (/[A-Z]/.test(password)) score += 1;
//     if (/[a-z]/.test(password)) score += 1;
//     if (/[0-9]/.test(password)) score += 1;
//     if (/[^A-Za-z0-9]/.test(password)) score += 1;

//     if (score < 3) feedback.push("Add uppercase, numbers, or symbols");
//     if (password.length < 8) feedback.push("Make it longer");

//     setPasswordStrength({
//       score,
//       feedback: feedback.join(", "),
//     });
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     const phoneRegex = /^[\d\s\-+()]+$/;
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!formData.firstName.trim()) newErrors.firstName = "Required";
//     if (!formData.lastName.trim()) newErrors.lastName = "Required";

//     if (!formData.email.trim()) {
//       newErrors.email = "Required";
//     } else if (!emailRegex.test(formData.email)) {
//       newErrors.email = "Invalid email format";
//     }

//     if (!formData.password) {
//       newErrors.password = "Required";
//     } else if (passwordStrength.score < 3) {
//       newErrors.password = "Password not strong enough";
//     }

//     if (!formData.phone.trim()) {
//       newErrors.phone = "Required";
//     } else if (!phoneRegex.test(formData.phone)) {
//       newErrors.phone = "Invalid phone format";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
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
//     if (!validateForm() || isSubmitting) return;

//     setIsSubmitting(true);
//     try {
//       await signup(
//         formData.firstName,
//         formData.lastName,
//         formData.email,
//         formData.password,
//         formData.phone
//       );
//       navigate(returnTo, { replace: true });
//     } catch (err) {
//       setErrors({ form: err.message || "Signup failed. Please try again." });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const getPasswordStrengthColor = () => {
//     const { score } = passwordStrength;
//     if (score < 2) return "bg-red-500";
//     if (score < 4) return "bg-yellow-500";
//     return "bg-green-500";
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
//         <div className="text-center">
//           <Title text1="SIGN" text2=" UP" />
//           <p className="mt-2 text-sm text-gray-600">
//             Join us to get started with your account
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="mt-8 space-y-6">
//           {errors.form && (
//             <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//               {errors.form}
//             </div>
//           )}

//           <div className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <input
//                   name="firstName"
//                   type="text"
//                   value={formData.firstName}
//                   onChange={handleChange}
//                   placeholder="First Name"
//                   className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
//                     errors.firstName ? "border-red-500" : "border-gray-300"
//                   } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-600 focus:border-orange-600`}
//                 />
//                 {errors.firstName && (
//                   <p className="mt-1 text-xs text-red-500">
//                     {errors.firstName}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <input
//                   name="lastName"
//                   type="text"
//                   value={formData.lastName}
//                   onChange={handleChange}
//                   placeholder="Last Name"
//                   className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
//                     errors.lastName ? "border-red-500" : "border-gray-300"
//                   } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-600 focus:border-orange-600`}
//                 />
//                 {errors.lastName && (
//                   <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
//                 )}
//               </div>
//             </div>

//             <div>
//               <input
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="Email address"
//                 className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
//                   errors.email ? "border-red-500" : "border-gray-300"
//                 } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-600 focus:border-orange-600`}
//               />
//               {errors.email && (
//                 <p className="mt-1 text-xs text-red-500">{errors.email}</p>
//               )}
//             </div>

//             <div className="relative">
//               <input
//                 name="password"
//                 type={showPassword ? "text" : "password"}
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="Password"
//                 className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
//                   errors.password ? "border-red-500" : "border-gray-300"
//                 } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-600 focus:border-orange-600`}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
//               >
//                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//               </button>
//               {formData.password && (
//                 <div className="mt-1">
//                   <div className="h-1 w-full bg-gray-200 rounded">
//                     <div
//                       className={`h-1 rounded transition-all ${getPasswordStrengthColor()}`}
//                       style={{
//                         width: `${(passwordStrength.score / 5) * 100}%`,
//                       }}
//                     />
//                   </div>
//                   {passwordStrength.feedback && (
//                     <p className="mt-1 text-xs text-gray-500">
//                       {passwordStrength.feedback}
//                     </p>
//                   )}
//                 </div>
//               )}
//               {errors.password && (
//                 <p className="mt-1 text-xs text-red-500">{errors.password}</p>
//               )}
//             </div>

//             <div>
//               <input
//                 name="phone"
//                 type="tel"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 placeholder="Phone number"
//                 className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
//                   errors.phone ? "border-red-500" : "border-gray-300"
//                 } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-600 focus:border-orange-600`}
//               />
//               {errors.phone && (
//                 <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
//               )}
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isSubmitting ? (
//               <Loader2 className="animate-spin" size={20} />
//             ) : (
//               "Create account"
//             )}
//           </button>

//           <div className="text-center text-sm">
//             <Link
//               to="/login"
//               className="text-gray-600 hover:text-orange-800 transition-colors"
//             >
//               Already have an account?{" "}
//               <span className="text-orange-700 hover:text-orange-800">
//                 Sign in
//               </span>
//             </Link>
//           </div>
//         </form>
//         {/* Google Sign-In Button */}
//         <div className="mt-4 flex items-center justify-center gap-2 bg-slate-300 rounded-lg p-2 hover:bg-slate-400">
//           <FcGoogle size={22} />
//           <button onClick={handleGoogleLogin}>Sign up with Google</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// ------------------------------------------------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/NewAuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { Title } from "../components/Title";
import { Eye, EyeOff, Loader2, User, Mail, Phone, Lock, AlertCircle, CheckCircle, Shield } from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: "",
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    }
  });

  const { signup, googleLogin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = new URLSearchParams(location.search).get("returnTo") || "/";

  // Debounced password strength checker
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.password) {
        checkPasswordStrength(formData.password);
      } else {
        setPasswordStrength({
          score: 0,
          feedback: "",
          checks: {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false,
          }
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.password]);

  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];
    
    const checks = {
      length: password.length >= 10, // the server rejects shorter passwords
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    Object.values(checks).forEach(check => {
      if (check) score += 1;
    });

    if (!checks.length) feedback.push("At least 10 characters");
    if (!checks.uppercase) feedback.push("One uppercase letter");
    if (!checks.number) feedback.push("One number");
    if (!checks.special) feedback.push("One special character");

    setPasswordStrength({
      score,
      feedback: feedback.join(", "),
      checks,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[\d\s\-+()]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordStrength.checks?.length) {
      newErrors.password = "Password must be at least 10 characters";
    } else if (passwordStrength.score < 3) {
      newErrors.password = "Password must be stronger";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Google's own button returns an ID token, which the server verifies was
  // issued for this site (#42).
  const handleGoogleCredential = async ({ credential }) => {
    try {
      setErrors({});
      await googleLogin(credential);
    } catch (error) {
      setErrors({ form: error.message || "Google signup failed. Please try again." });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});
    
    try {
      await signup(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.phone
      );
      navigate(returnTo, { replace: true });
    } catch (err) {
      // The server names the field at fault on a validation failure (v2 problem+json).
      const fieldErrors = {};
      for (const { path, message } of err.body?.errors ?? []) {
        if (path && path in formData && !fieldErrors[path]) fieldErrors[path] = message;
      }
      setErrors(
        Object.keys(fieldErrors).length
          ? fieldErrors
          : { form: err.message || "Signup failed. Please try again." },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 2) return "bg-red-500";
    if (score < 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const { score } = passwordStrength;
    if (score < 2) return "Weak";
    if (score < 4) return "Medium";
    return "Strong";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-700" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center  px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm sm:max-w-lg space-y-6 sm:space-y-8">
        {/* Card Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-grey/10 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mb-2 text-2xl">
              <Title text1="SIGN" text2=" UP" />
            </div>
            <p className="text-gray-600 text-sm">Create your account to get started</p>
          </div>

          {/* Error Messages */}
          {errors.form && (
            <div className="mb-4 sm:mb-6 flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm leading-relaxed">{errors.form}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                      errors.firstName 
                        ? "border-red-300 bg-red-50" 
                        : "border-gray-300 bg-white hover:border-gray-400"
                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    placeholder="First name"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.firstName}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                      errors.lastName 
                        ? "border-red-300 bg-red-50" 
                        : "border-gray-300 bg-white hover:border-gray-400"
                    } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                    placeholder="Last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.lastName}</span>
                  </p>
                )}
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                    errors.email 
                      ? "border-red-300 bg-red-50" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
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
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                    errors.password 
                      ? "border-red-300 bg-red-50" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score < 2 ? 'text-red-600' : 
                      passwordStrength.score < 4 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {passwordStrength.checks.length ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 border border-gray-300 rounded-full" />
                      )}
                      <span>10+ characters</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {passwordStrength.checks.uppercase ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 border border-gray-300 rounded-full" />
                      )}
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {passwordStrength.checks.number ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 border border-gray-300 rounded-full" />
                      )}
                      <span>Number</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      passwordStrength.checks.special ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {passwordStrength.checks.special ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className="h-3 w-3 border border-gray-300 rounded-full" />
                      )}
                      <span>Special character</span>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                    errors.phone 
                      ? "border-red-300 bg-red-50" 
                      : "border-gray-300 bg-white hover:border-gray-400"
                  } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-black bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                
                  Create Account
                </>
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

          {/* Google Sign-Up Button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleCredential}
              onError={() => setErrors({ form: "Google signup failed. Please try again." })}
              text="signup_with"
              shape="pill"
              width="320"
            />
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-orange-700 hover:text-orange-800 transition-colors duration-200"
                tabIndex={isSubmitting ? -1 : 0}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <Shield className="h-3 w-3" />
            <span>Your information is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}