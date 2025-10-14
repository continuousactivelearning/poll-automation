"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation  } from "react-router-dom"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { Mail, Lock, Eye, EyeOff, Brain, Loader, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import GlassCard from "../components/GlassCard"

interface RegisterForm {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    throw new Error("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    throw new Error("Password must contain at least one number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error("Password must contain at least one special character");
  }
  return true;
}

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const redirect = params.get("redirect")
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    mode: "onChange",
  })

  const password = watch("password") || ""

  function getPasswordStrength(pw: string) {
    let score = 0
    if (pw.length >= 6) score++
    if (/[a-zA-Z]/.test(pw)) score++
    if (/\d/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    if (score <= 1) return "Weak"
    if (score === 2) return "Medium"
    return "Strong"
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setRegisterError(null);
    try {
      await registerUser(data.fullName, data.email, data.password, "student");
      if (redirect === "create-poll" || redirect === "join-poll") {
        navigate(`/login?redirect=${redirect}`)
      } else {
        navigate("/login")
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setRegisterError(error.message);
      } else {
        setRegisterError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 lg:-top-40 lg:-right-40 w-32 h-32 sm:w-48 sm:h-48 lg:w-80 lg:h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-10 -left-10 sm:-bottom-20 sm:-left-20 lg:-bottom-40 lg:-left-40 w-32 h-32 sm:w-48 sm:h-48 lg:w-80 lg:h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
      >
        <GlassCard className="p-4 sm:p-6 md:p-8">
  {/* Logo and Welcome Lines */}
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.2 }}
    className="text-center mb-4 sm:mb-6 md:mb-8"
  >
    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
      <Brain className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
    </div>
    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">Create Account</h1>
    <p className="text-gray-400 text-xs sm:text-sm md:text-base">Join our AI-powered polling system</p>
    {/* Beautiful lines for the user */}
    <p className="mt-4 text-primary-300 text-xs sm:text-sm md:text-base italic font-medium">
      Step into a smarter way to connect and collaborate.<br />
      Experience seamless, interactive sessions powered by AI.<br />
      Your journey to effortless engagement starts here!
    </p>
  </motion.div>

          {registerError && (
            <div className="mb-3 sm:mb-4 text-red-400 text-center text-xs sm:text-sm">{registerError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Full name must be at least 2 characters",
                    },
                  })}
                  className="w-full pl-8 sm:pl-9 md:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm md:text-base"
                  placeholder="Enter your full name"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email address",
                    },
                  })}
                  className="w-full pl-8 sm:pl-9 md:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm md:text-base"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    validate: (value) => {
                      try {
                        validatePassword(value)
                        return true
                      } catch (e: unknown) {
                        if (e instanceof Error) {
                          return e.message
                        }
                        return "Invalid password"
                      }
                    },
                  })}
                  className="w-full pl-8 sm:pl-9 md:pl-10 pr-8 sm:pr-10 md:pr-12 py-2 sm:py-2.5 md:py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm md:text-base"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  ) : (
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  )}
                </button>
              </div>
              {password && (
                <p
                  className={`mt-1 text-xs ${
                    getPasswordStrength(password) === "Strong"
                      ? "text-green-400"
                      : getPasswordStrength(password) === "Medium"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  Strength: {getPasswordStrength(password)}
                </p>
              )}
              {errors.password && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => value === password || "Passwords do not match",
                  })}
                  className="w-full pl-8 sm:pl-9 md:pl-10 pr-8 sm:pr-10 md:pr-12 py-2 sm:py-2.5 md:py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm md:text-base"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  ) : (
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 sm:py-2.5 md:py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm md:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin mr-2" />
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>
          {/* Social Register */}


          {/* Links */}
          <div className="mt-3 sm:mt-4 md:mt-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              Already have an account?{" "}
              <Link
                to={`/login${redirect ? `?redirect=${redirect}` : ""}`}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default RegisterPage