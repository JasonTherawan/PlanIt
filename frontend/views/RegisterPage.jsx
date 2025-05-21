"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Calendar, User, Eye, EyeOff, Mail } from "lucide-react"
import loginpageimage from "../assets/loginpageimage.png"
import bottomleftshape from "../assets/bottomleftshape.png"
import toprightshape from "../assets/toprightshape.png"

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
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Here you would typically make an API call to register the user
      console.log("Registration submitted:", formData)

      // For demo purposes, navigate to calendar
      navigate("/")
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-8">Let's get you started</h2>
            <div className="w-full max-w-md">
              <img src={loginpageimage} alt="Planning illustration" className="w-full h-auto" />
            </div>
          </div>

          {/* Right side - Signup form */}
          <div className="bg-[#003366] w-full md:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex items-center mb-8">
              <Calendar className="text-white w-8 h-8 mr-2" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wider">PLANIT</h1>
                <p className="text-sm text-gray-300">Plan Smarter. Work Better.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className={`w-full p-3 pr-10 rounded bg-white ${errors.username ? "border-2 border-red-500" : ""}`}
                    placeholder="Create a username"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
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
                    className={`w-full p-3 pr-10 rounded bg-white ${errors.email ? "border-2 border-red-500" : ""}`}
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
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
                    className={`w-full p-3 pr-10 rounded bg-white ${errors.password ? "border-2 border-red-500" : ""}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
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
                    className={`w-full p-3 pr-10 rounded bg-white ${errors.confirmPassword ? "border-2 border-red-500" : ""}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.confirmPassword && <p className="text-red-300 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#7DD3FC] hover:bg-[#38BDF8] text-[#003366] font-semibold py-3 rounded transition duration-200 mt-6"
              >
                Register
              </button>
            </form>

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
