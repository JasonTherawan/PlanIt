"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"   // <-- import this
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import AddActivityModal from "./activity/AddActivityModal"
import AddGoalModal from "./goal/AddGoalModal"
import useModal from "../../hooks/useModal"
import { AddIcon, TeamIcon } from '../../assets';

const MainScheduleSidebar = ({ currentDate, setCurrentDate, events, addEvent }) => {
  const navigate = useNavigate()
  const handleTeamButtonClick = () => {
    navigate('/teams')
  }

  const {
    isOpen: isGoalModalOpen,
    openModal: openGoalModal,
    closeModal: closeGoalModal
  } = useModal()

  const {
    isOpen: isActivityModalOpen,
    openModal: openActivityModal,
    closeModal: closeActivityModal
  } = useModal()

  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [viewDate, setViewDate] = useState(new Date(currentDate))
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDropdownOpen])

  // Date calculations (unchanged)
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()

  const prevMonthDays = []
  if (firstDayOfWeek > 0) {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0)
    const prevMonthDaysCount = prevMonth.getDate()
    for (let i = prevMonthDaysCount - firstDayOfWeek + 1; i <= prevMonthDaysCount; i++) {
      prevMonthDays.push({ date: i, month: "prev" })
    }
  }

  const currentMonthDays = []
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({ date: i, month: "current" })
  }

  const nextMonthDays = []
  const totalDaysDisplayed = 42
  const remainingDays = totalDaysDisplayed - prevMonthDays.length - currentMonthDays.length
  for (let i = 1; i <= remainingDays; i++) {
    nextMonthDays.push({ date: i, month: "next" })
  }

  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]

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

  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const upcomingEvents = events
    .filter((event) => event.start >= today && event.start <= nextWeek)
    .sort((a, b) => a.start - b.start)

  const formatEventTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const formatEventDate = (date) =>
    date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })

  return (
    <div className="w-56 bg-[#002147] text-white flex flex-col h-full">
      <div ref={dropdownRef} className="relative flex items-center px-4 py-3 bg-[#001f3f] rounded-md">
        {/* Add button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-8 h-8 full bg-white bg-opacity-10 flex items-center justify-center hover:bg-opacity-20"
          aria-label="Add"
        >
          <img src={AddIcon} alt="Add" className="w-5 h-5" />
        </button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <div className="absolute left-4 top-full mt-[-12px] bg-[#B9E7F6] shadow-lg w-32 z-50">
            <button
              className="block w-full px-4 py-2 text-left text-[#002b4c] font-semibold hover:bg-[#92D0F5]"
              onClick={() => {
                setIsDropdownOpen(false)
                setIsEditingGoal(false)
                openGoalModal()
              }}
            >
              Goal
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-[#002b4c] font-semibold hover:bg-[#92D0F5]"
              onClick={() => {
                setIsDropdownOpen(false)
                openActivityModal()
              }}
            >
              Activity
            </button>
          </div>
        )}

        <div className="flex-grow" />

        {/* Team button */}
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-opacity-20"
          aria-label="Team"
          onClick={handleTeamButtonClick}
        >
          <img src={TeamIcon} alt="Team" className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar header and navigation */}
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

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-xs mb-1">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, idx) => (
            <div key={idx} className="h-6 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {weeks.map((week, wIdx) =>
            week.map((day, dIdx) => (
              <button
                key={`${wIdx}-${dIdx}`}
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
            ))
          )}
        </div>
      </div>

      {/* Upcoming events */}
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

      {/* Modals */}
      {
        isGoalModalOpen && (
          <AddGoalModal
            isEditing={isEditingGoal}
            onClose={closeGoalModal}
            onSaveDraft={(draft) => {
              localStorage.setItem("draftGoal", JSON.stringify(draft))
              closeGoalModal()
            }}
            onCancelDraft={() => {
              localStorage.removeItem("draftGoal")
              closeGoalModal()
            }}
          />
        )
      }

      {isActivityModalOpen && <AddActivityModal onClose={closeActivityModal} />}
    </div >
  )
}

export default MainScheduleSidebar