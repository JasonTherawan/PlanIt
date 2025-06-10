"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = localStorage.getItem("user")
        if (user) {
          const userData = JSON.parse(user)
          // Check if user data has required fields
          if (userData.id && userData.email) {
            setIsAuthenticated(true)
          } else {
            // Invalid user data, clear it and redirect
            localStorage.removeItem("user")
            navigate("/login")
          }
        } else {
          // No user data, redirect to login
          navigate("/login")
        }
      } catch (error) {
        // Invalid JSON in localStorage, clear it and redirect
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
