"use client"

import { Search, ChevronLeft, ChevronRight, User } from "lucide-react"
import { useState, useEffect } from "react"

const Header = ({ currentDate, setCurrentDate, onProfileClick }) => {
  const [user, setUser] = useState({})

  const navigateToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const navigateToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const formatMonthYear = () => {
    return currentDate.toLocaleString("default", { month: "long", year: "numeric" })
  }

  const fetchUser = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) return

      const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`)
      if (!response.ok) throw new Error("Failed to fetch user")

      const data = await response.json()
      setUser(data.user)

      // Optionally update localStorage with new user data
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...data.user }))
    } catch (err) {
      console.error("Error fetching user in Header:", err)
    }
  }

  useEffect(() => {
    fetchUser()

    // Optional: sync changes across tabs
    const handleStorageChange = () => fetchUser()
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <div className="flex justify-between items-center p-4 border-b">
      {/* Navigation Section */}
      <div className="flex items-center space-x-4">
        <button onClick={navigateToPreviousMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <button onClick={navigateToNextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} />
        </button>
        <h1 className="text-xl font-medium">{formatMonthYear()}</h1>
      </div>

      {/* Search and Profile */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={onProfileClick}
          className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-500"
        >
          {user.userprofilepicture ? (
            <img src={user.userprofilepicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-gray-600" />
          )}
        </button>
      </div>
    </div>
  )
}

export default Header
