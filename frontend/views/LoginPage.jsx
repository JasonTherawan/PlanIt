"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Eye, EyeOff } from "lucide-react"
import loginpageimage from "../assets/credentialpageimage.png"
import bottomleftshape from "../assets/bottomleftshape.png"
import toprightshape from "../assets/toprightshape.png"
import GoogleSignInButton from "../components/GoogleSignInButton"

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      navigate("/app", { replace: true })
    }
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setCredentials({
      ...credentials,
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
        const response = await fetch(`/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            rememberMe: rememberMe,
          }),
        })

        const data = await response.json()


        if (response.ok) {
          localStorage.setItem("user", JSON.stringify(data.user))
          navigate("/app", { replace: true })
        } else {
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
            <h2 className="text-2xl font-semibold text-gray-800">Login to your account</h2>
            <div className="w-full max-w-md">
              <img src={loginpageimage} alt="Planning illustration" className="w-full h-auto" />
            </div>
            <p className="text-sm text-gray-400">&copy; 2025 PlanIt. All rights reserved.</p>
          </div>

          <div className="bg-[#003366] w-full md:w-1/2 p-8 flex flex-col justify-center">
            <h3 className="text-3xl font-bold text-white mb-3 text-center">Welcome Back!</h3>
            <form onSubmit={handleSubmit} className="space-y-1">
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
                    className={`w-full p-2.5 pr-10 rounded bg-white text-black ${errors.email ? "border-2 border-red-500" : ""}`}
                    placeholder="Enter your email"
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
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
                    value={credentials.password}
                    onChange={handleChange}
                    className={`w-full p-2.5 pr-10 rounded bg-white text-black ${errors.password ? "border-2 border-red-500" : ""}`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="h-5">
                  {errors.password && <p className="text-red-300 text-sm mt-1">{errors.password}</p>}
                </div>
              </div>
              
              <div className="flex items-center mb-4 mt-1">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-white">
                  Remember Me
                </label>
              </div>

              {apiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{apiError}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#7DD3FC] hover:bg-[#38BDF8] text-[#003366] font-semibold py-2.5 rounded transition duration-200 disabled:opacity-70"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="px-4 text-sm text-gray-500">or</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
            
            <GoogleSignInButton className="w-full" rememberMe={rememberMe} />

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
