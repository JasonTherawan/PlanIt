"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Calendar, User, Eye, EyeOff } from "lucide-react"
import loginpageimage from "../assets/loginpageimage.png"
import bottomleftshape from "../assets/bottomleftshape.png"
import toprightshape from "../assets/toprightshape.png"

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setCredentials({
      ...credentials,
      [name]: value,
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!credentials.email.trim()) {
      newErrors.email = "Email is required"
    }

    if (!credentials.password) {
      newErrors.password = "Password is required"
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
        // Make API call to login
        const response = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          // Login successful
          console.log("Login successful:", data)

          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify(data.user))

          // Navigate to calendar
          navigate("/")
        } else {
          // Login failed
          console.error("Login failed:", data)
          setApiError(data.message || "Invalid email or password")
        }
      } catch (error) {
        console.error("Error during login:", error)
        setApiError("Network error. Please check your connection and try again.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Background shapes */}
        <div className="fixed top-0 left-0 z-0">
          <img src={toprightshape} alt="Top right shape" className="w-auto h-auto" />
        </div>
        <div className="fixed bottom-0 right-0 z-0">
          <img src={bottomleftshape} alt="Bottom left shape" className="w-auto h-auto" />
        </div>


        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full shadow-lg rounded-lg overflow-hidden my-10">
          {/* Left side - Illustration */}
          <div className="bg-white w-full md:w-1/2 p-8 flex flex-col justify-center items-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">Login to your account</h2>
            <div className="w-full max-w-md">
              <img src={loginpageimage} alt="Planning illustration" className="w-full h-auto" />
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="bg-[#003366] w-full md:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex items-center mb-8">
              <Calendar className="text-white w-8 h-8 mr-2" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">PLANIT</h1>
                <p className="text-sm text-gray-300">Plan Smarter. Work Better.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleChange}
                    className={`w-full p-3 pr-10 rounded bg-white ${errors.email ? "border-2 border-red-500" : ""}`}
                    placeholder="Enter your email"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
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
                    value={credentials.password}
                    onChange={handleChange}
                    className={`w-full p-3 pr-10 rounded bg-white ${errors.password ? "border-2 border-red-500" : ""}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.password && <p className="text-red-300 text-sm mt-1">{errors.password}</p>}
                </div>
              </div>

              {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{apiError}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#7DD3FC] hover:bg-[#38BDF8] text-[#003366] font-semibold py-3 rounded transition duration-200 disabled:opacity-70"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white text-sm">
                Don't have an account?
                <Link to="/register" className="ml-1 text-[#7DD3FC] hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
