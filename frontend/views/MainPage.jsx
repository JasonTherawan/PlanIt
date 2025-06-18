"use client"

import { useState } from "react"
import Sidebar from "../components/Sidebar"
import CalendarGrid from "../components/CalendarGrid"
import Header from "../components/Header"
import ProfileSidebar from "../components/ProfileSidebar"
import NotificationSidebar from "../components/NotificationSidebar"
import ProtectedRoute from "../components/ProtectedRoute"

export default function MainPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0)
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false)
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false)
  const [events, setEvents] = useState([])

  const addEvent = (newEvent) => {
    setEvents([...events, { id: Date.now(), ...newEvent }])
  }

  const handleDataUpdate = () => {
    setDataUpdateTrigger((prev) => prev + 1)
  }

  const handleProfileClick = () => {
    setIsProfileSidebarOpen(true)
    setIsNotificationSidebarOpen(false)
  }

  const handleNotificationClick = () => {
    setIsNotificationSidebarOpen(true)
    setIsProfileSidebarOpen(false)
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Fixed sidebar */}
        <div className="w-56 flex-shrink-0">
          <Sidebar
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            events={events}
            addEvent={addEvent}
            onDataUpdate={handleDataUpdate}
          />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Fixed header */}
          <div className="flex-shrink-0">
            <Header
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              onProfileClick={handleProfileClick}
              onNotificationClick={handleNotificationClick}
            />
          </div>

          {/* Calendar grid */}
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            setCurrentDate={setCurrentDate}
            dataUpdateTrigger={dataUpdateTrigger}
          />

          {/* Profile Sidebar */}
          <ProfileSidebar isOpen={isProfileSidebarOpen} onClose={() => setIsProfileSidebarOpen(false)} />

          {/* Notification Sidebar */}
          <NotificationSidebar isOpen={isNotificationSidebarOpen} onClose={() => setIsNotificationSidebarOpen(false)} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
