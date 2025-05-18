"use client"

import { useRef, useEffect, useState } from "react"

const CalendarGrid = ({ currentDate, events, setCurrentDate }) => {
  const gridRef = useRef(null)
  const horizontalScrollRef = useRef(null)
  const [daysInMonth, setDaysInMonth] = useState([])
  const [scrollPosition, setScrollPosition] = useState(0)

  // Generate only days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get the number of days in the month
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()

    // Generate array of days for the current month only
    const days = []
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push(new Date(year, month, i))
    }

    setDaysInMonth(days)

    // Scroll to the current date
    setTimeout(() => {
      if (horizontalScrollRef.current) {
        const dayWidth = 100 // Fixed width for each day column
        const currentDayIndex = days.findIndex(
          (day) =>
            day.getDate() === currentDate.getDate() &&
            day.getMonth() === currentDate.getMonth() &&
            day.getFullYear() === currentDate.getFullYear(),
        )

        if (currentDayIndex >= 0) {
          horizontalScrollRef.current.scrollLeft = currentDayIndex * dayWidth
        }
      }
    }, 100)
  }, [currentDate])

  // Generate time slots for 24 hours
  const timeSlots = []
  for (let i = 0; i < 24; i++) {
    timeSlots.push({
      hour: i,
      label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
    })
  }

  // Format day header
  const formatDayHeader = (date) => {
    const today = new Date()
    const isTodayDate =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    const dayName = date.toLocaleString("default", { weekday: "short" }).toUpperCase()
    const dayNumber = date.getDate()

    return { dayName, dayNumber, isTodayDate }
  }

  // Check if a time slot has an event
  const getEventsForTimeSlot = (day, hour) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getHours() === hour
      )
    })
  }

  // Get the current time to highlight the current time slot
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  // Check if a day is today
  const isToday = (date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex h-full">
        {/* Time labels column - Fixed */}
        <div className="w-16 flex-shrink-0 border-r z-10 bg-white">
          <div className="h-12 border-b"></div> {/* Empty cell for the header row */}
          <div className="overflow-hidden h-[calc(100vh-112px)]" ref={gridRef}>
            {timeSlots.map((slot) => (
              <div key={slot.hour} className="h-14 border-b flex items-start justify-end pr-2 text-xs text-gray-500">
                <span className="mt-1">{slot.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid with horizontal scrolling */}
        <div className="flex-1 overflow-hidden">
          {/* Fixed header container */}
          <div className="sticky left-0 z-10 bg-white">
            {/* Day headers - Fixed position but showing scrollable content */}
            <div className="flex border-b overflow-hidden">
              <div className="flex" style={{ minWidth: `${daysInMonth.length * 100}px` }}>
                {daysInMonth.map((day, index) => {
                  const { dayName, dayNumber, isTodayDate } = formatDayHeader(day)
                  return (
                    <div
                      key={index}
                      className={`w-[100px] flex-shrink-0 h-12 flex flex-col items-center justify-center border-r
                        ${isToday(day) ? "bg-blue-50" : ""}
                      `}
                      onClick={() => setCurrentDate(new Date(day))}
                    >
                      <div className="text-xs text-gray-500">{dayName}</div>
                      <div className={`text-lg font-medium ${isToday(day) ? "text-blue-600" : ""}`}>{dayNumber}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Scrollable grid area */}
          <div
            className="overflow-x-auto overflow-y-auto h-[calc(100vh-112px)]"
            ref={horizontalScrollRef}
            onScroll={(e) => {
              // Update the header scroll position to match
              const headerContainer = e.currentTarget.previousSibling.firstChild
              if (headerContainer) {
                headerContainer.scrollLeft = e.currentTarget.scrollLeft
              }

              // Update vertical scroll for time labels
              if (gridRef.current) {
                gridRef.current.scrollTop = e.currentTarget.scrollTop
              }
              setScrollPosition(e.currentTarget.scrollTop)
            }}
          >
            <div className="flex" style={{ minWidth: `${daysInMonth.length * 100}px` }}>
              {daysInMonth.map((day, dayIndex) => (
                <div key={dayIndex} className={`w-[100px] flex-shrink-0 border-r ${isToday(day) ? "bg-blue-50" : ""}`}>
                  {timeSlots.map((slot) => {
                    const eventsInSlot = getEventsForTimeSlot(day, slot.hour)
                    return (
                      <div key={slot.hour} className="h-14 border-b relative">
                        {eventsInSlot.map((event) => (
                          <div
                            key={event.id}
                            className="absolute left-1 right-1 bg-blue-100 border border-blue-300 rounded p-1 text-xs overflow-hidden"
                            style={{
                              top: "2px",
                              height: "calc(100% - 4px)",
                              zIndex: 10,
                            }}
                          >
                            {event.title}
                          </div>
                        ))}

                        {/* Current time indicator */}
                        {isToday(day) && slot.hour === currentHour && (
                          <div
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                            style={{ top: `${(currentMinute / 60) * 100}%` }}
                          >
                            <div className="absolute -left-1 -top-2 w-2 h-2 rounded-full bg-red-500"></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarGrid
