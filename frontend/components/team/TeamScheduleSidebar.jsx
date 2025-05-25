"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import AddTeamModal from "./AddTeamModal"
import useModal from "../../hooks/useModal"
import { AddIcon, TeamIcon } from "../../assets"
import { useNavigate } from "react-router-dom"

const TeamScheduleSidebar = ({ currentDate, setCurrentDate, teams, meetings, addTeam, addMeeting }) => {
    const {
        isOpen: isTeamModalOpen,
        openModal: openTeamModal,
        closeModal: closeTeamModal
    } = useModal()

    const [viewDate, setViewDate] = useState(new Date(currentDate))
    const [isEditingTeam, setIsEditingTeam] = useState(false)

    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    // Detect & remove on outside click
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

    // Calendar layout
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

    const handleTeamButtonClick = () => {
        navigate('/main')
    }

    const handleOpenTeamModal = () => {
        setIsEditingTeam(false)
        openTeamModal()
    }

    return (
        <div className="w-56 bg-[#002147] text-white flex flex-col h-full">
            <div ref={dropdownRef} className="relative flex items-center px-4 py-3 bg-[#001f3f] rounded-md">
                <button
                    onClick={handleOpenTeamModal}
                    className="w-8 h-8 full bg-white bg-opacity-10 flex items-center justify-center hover:bg-opacity-20"
                    aria-label="Add Team"
                >
                    <img src={AddIcon} alt="Add" className="w-5 h-5" />
                </button>

                <div className="flex-grow" />

                {/* Home button (back to MainPage) */}
                <button
                    className="w-8 h-8 flex items-center justify-center hover:bg-opacity-20"
                    aria-label="Home"
                    onClick={handleTeamButtonClick}
                >
                    <img src={TeamIcon} alt="Home" className="w-5 h-5" />
                </button>
            </div>

            {/* Calendar Header */}
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

                {/* Weekdays */}
                <div className="grid grid-cols-7 text-center text-xs mb-1">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, idx) => (
                        <div key={idx} className="h-6 flex items-center justify-center">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
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

            {/* Team Events */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {/* Future: Display team meetings */}
            </div>

            {/* Modal */}
            {isTeamModalOpen && (
                <AddTeamModal
                    isEditing={isEditingTeam}
                    onClose={closeTeamModal}
                    addTeam={addTeam}
                    onSaveDraft={(draft) => {
                        localStorage.setItem("draftTeam", JSON.stringify(draft))
                        closeTeamModal()
                    }}
                    onCancelDraft={() => {
                        localStorage.removeItem("draftTeam")
                        closeTeamModal()
                    }}
                />
            )}
        </div>
    )
}

export default TeamScheduleSidebar