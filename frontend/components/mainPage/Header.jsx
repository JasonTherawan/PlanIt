"use client"

import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
// import ProfileSidebar from "./ProfileSidebar"

const Header = ({ currentDate, setCurrentDate }) => {
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false)

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

  return (
    <>
      <div className="flex justify-between items-center p-4 border-b">
        {/* Header content */}
        <div className="flex items-center space-x-4">
          <button onClick={navigateToPreviousMonth} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <button onClick={navigateToNextMonth} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronRight size={20} />
          </button>
          <h1 className="text-xl font-medium">{formatMonthYear()}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div
            className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden cursor-pointer"
            onClick={() => setIsProfileSidebarOpen(true)}
          >
            <img src="/placeholder.svg?height=32&width=32" alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* {isProfileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-opacity-50 z-30"
            onClick={() => setIsProfileSidebarOpen(false)}
          />
          <ProfileSidebar />
        </>
      )} */}
    </>
  )
}

export default Header
