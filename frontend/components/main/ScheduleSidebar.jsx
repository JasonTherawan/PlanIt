"use client"

import { useState } from "react"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import AddEventModal from "./AddEventModal"

const ScheduleSidebar = ({ currentDate, setCurrentDate, events, addEvent }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewDate, setViewDate] = useState(new Date(currentDate))

  // Get the first day of the month
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  // Get the number of days in the month
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()

  // Get the previous month's days that appear in the first week
  const prevMonthDays = []
  if (firstDayOfWeek > 0) {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0)
    const prevMonthDaysCount = prevMonth.getDate()
    for (let i = prevMonthDaysCount - firstDayOfWeek + 1; i <= prevMonthDaysCount; i++) {
      prevMonthDays.push({
        date: i,
        month: "prev",
      })
    }
  }

  // Current month days
  const currentMonthDays = []
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      date: i,
      month: "current",
    })
  }

  // Next month days to fill the remaining cells
  const nextMonthDays = []
  const totalDaysDisplayed = 42 // 6 rows of 7 days
  const remainingDays = totalDaysDisplayed - prevMonthDays.length - currentMonthDays.length
  for (let i = 1; i <= remainingDays; i++) {
    nextMonthDays.push({
      date: i,
      month: "next",
    })
  }

  // Combine all days
  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]

  // Group days into weeks
  const weeks = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const isToday = (day) => {
    const today = new Date()
    return (
      day.date === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear() &&
      day.month === "current"
    )
  }

  const isSelected = (day) => {
    return (
      day.date === currentDate.getDate() &&
      viewDate.getMonth() === currentDate.getMonth() &&
      viewDate.getFullYear() === currentDate.getFullYear() &&
      day.month === "current"
    )
  }

  // Filter events for upcoming events (next 7 days)
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const upcomingEvents = events
    .filter((event) => event.start >= today && event.start <= nextWeek)
    .sort((a, b) => a.start - b.start)

  const formatEventTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatEventDate = (date) => {
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }

  return (
    <div className="w-56 bg-[#002147] text-white flex flex-col h-full">
      <div className="p-4 flex items-center">
        <button
          className="w-8 h-8 rounded-full bg-white bg-opacity-10 flex items-center justify-center hover:bg-opacity-20"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">
            {viewDate.toLocaleString("default", { month: "long" })} {viewDate.getFullYear()}
          </h2>
          <div className="flex">
            <button onClick={handlePrevMonth} className="p-1">
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleNextMonth} className="p-1">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs mb-1">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, index) => (
            <div key={index} className="h-6 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => (
              <button
                key={`${weekIndex}-${dayIndex}`}
                className={`w-6 h-6 rounded-full flex items-center justify-center
                  ${day.month !== "current" ? "text-gray-500" : ""}
                  ${isToday(day) ? "bg-blue-500" : ""}
                  ${isSelected(day) && !isToday(day) ? "bg-white text-[#002147]" : ""}
                  hover:bg-white hover:bg-opacity-20
                `}
                onClick={() => {
                  if (day.month === "current") {
                    setCurrentDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day.date))
                  }
                }}
              >
                {day.date}
              </button>
            )),
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <h3 className="text-sm font-medium mb-2">Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-gray-400">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white bg-opacity-10 p-2 rounded text-xs">
                <div className="font-medium">{event.title}</div>
                <div className="text-gray-300">{formatEventDate(event.start)}</div>
                <div className="text-gray-300">
                  {formatEventTime(event.start)} - {formatEventTime(event.end)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddEvent={addEvent}
          currentDate={currentDate}
        />
      )}
    </div>
  )
}

export default ScheduleSidebar
