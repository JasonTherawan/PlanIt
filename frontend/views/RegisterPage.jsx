"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Eye, EyeOff, Mail } from "lucide-react"
import loginpageimage from "../assets/credentialpageimage.png"
import bottomleftshape from "../assets/bottomleftshape.png"
import toprightshape from "../assets/toprightshape.png"
import GoogleSignInButton from "../components/GoogleSignInButton"
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the terms and privacy policy"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      setIsLoading(true)
      setApiError("")

      try {
        const apiData = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }

        const response = await fetch(`${API_URL}/api/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        })

        const data = await response.json()

        if (response.ok) {
          alert("Registration successful! Please log in.")
          navigate("/login")
        } else {
          console.error("Registration failed:", data)
          setApiError(data.message || "Registration failed. Please try again.")
        }
      } catch (error) {
        console.error("Error during registration:", error)
        setApiError("Network error. Please check your connection and try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword)
    } else {
      setShowConfirmPassword(!showConfirmPassword)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="fixed top-0 left-0 z-0">
          <img src={toprightshape} alt="Top right shape" className="w-auto h-auto" />
        </div>
        <div className="fixed bottom-0 right-0 z-0">
          <img src={bottomleftshape} alt="Bottom left shape" className="w-auto h-auto" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full shadow-2xl rounded-lg overflow-hidden my-10">
          <div className="bg-gray-100 w-full md:w-1/2 p-8 flex flex-col justify-center items-center">
            <Link to="/" className="cursor-pointer mb-4">
              <div className="flex items-center">
                <img src="/planitLogo.png" alt="PlanIt Logo" className="w-12 h-12 mr-2"/>
                <div className="text-center font-bold inline-block">
                  <h1 className="text-3xl text-[#003366] tracking-wider border-b-4 border-[#003366]">PLANIT</h1>
                  <p className="text-sm text-gray-600">Plan Smarter. Work Better.</p>
                </div>
              </div>
            </Link>
            <h2 className="text-2xl font-semibold text-gray-800">Let's get you started</h2>
            <div className="w-full max-w-md">
              <img src={loginpageimage} alt="Planning illustration" className="w-full h-auto" />
            </div>
          </div>

          <div className="bg-[#003366] w-full md:w-1/2 p-8 flex flex-col justify-center">
            <h3 className="text-3xl font-bold text-white mb-3 text-center">Create Your Account!</h3>
            <form onSubmit={handleSubmit} className="space-y-1">
              <div>
                <label htmlFor="username" className="block text-white mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full p-2.5 pr-10 rounded bg-white text-black ${errors.username ? "border-2 border-red-500" : ""}`}
                    placeholder="Create a username"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                </div>
                <div className="h-5">
                  {errors.username && <p className="text-red-300 text-sm mt-1">{errors.username}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full p-2.5 pr-10 rounded bg-white text-black ${errors.email ? "border-2 border-red-500" : ""}`}
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                </div>
                <div className="h-5">
                  {errors.email && <p className="text-red-300 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full p-2.5 pr-10 rounded bg-white text-black ${errors.password ? "border-2 border-red-500" : ""}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="h-5">
                  {errors.password && <p className="text-red-300 text-sm mt-1">{errors.password}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-white mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full p-2.5 pr-10 rounded bg-white text-black ${errors.confirmPassword ? "border-2 border-red-500" : ""}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="h-5">
                  {errors.confirmPassword && <p className="text-red-300 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div>
                <div className="flex items-center">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 text-blue-400 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agree-terms" className="ml-2 block text-sm text-white">
                    I agree to the{' '}
                    <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="font-medium text-[#7DD3FC] hover:underline">
                      Terms & Conditions
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-medium text-[#7DD3FC] hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                <div className="h-5">
                    {errors.terms && <p className="text-red-300 text-sm mt-1">{errors.terms}</p>}
                </div>
              </div>

              {apiError && (
                <div className="col-span-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full my-2 bg-[#7DD3FC] hover:bg-[#38BDF8] text-[#003366] font-semibold py-2.5 rounded transition duration-200 disabled:opacity-70"
              >
                {isLoading ? "Registering..." : "Register"}
              </button>
            </form>

            <div className="mt-2">
              <GoogleSignInButton mode="signup" className="w-full" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-white text-sm">
                Already have an account?
                <Link to="/login" className="ml-1 text-[#7DD3FC] hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
