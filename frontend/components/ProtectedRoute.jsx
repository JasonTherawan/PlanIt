"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import googleAuthService from "../services/googleAuth"

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage first
        const user = localStorage.getItem("user")
        if (user) {
          const userData = JSON.parse(user)
          if (userData.id && userData.email) {
            setIsAuthenticated(true)
            return
          }
        }

        // Check Google authentication
        await googleAuthService.initialize()
        if (googleAuthService.isSignedIn()) {
          const googleUser = googleAuthService.getCurrentUser()
          if (googleUser) {
            setIsAuthenticated(true)
            return
          }
        }

        // No authentication found
        navigate("/login")
      } catch (error) {
        console.error("Auth check error:", error)
        localStorage.removeItem("user")
        navigate("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return isAuthenticated ? children : null
}

export default ProtectedRoute
