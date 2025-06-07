"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react"
import AddEventModal from "./AddEventModal"
import AddItemModal from "./AddItemModal"
import EditItemModal from "./EditItemModal"

const Sidebar = ({ currentDate, setCurrentDate, events, addEvent, onDataUpdate }) => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [viewDate, setViewDate] = useState(new Date(currentDate))
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])
  const [activeTab, setActiveTab] = useState("upcoming")
  const [highlightedSidebarItem, setHighlightedSidebarItem] = useState(null)
  const scrollContainerRef = useRef(null)

  // Urgency color mapping
  const urgencyColors = {
    low: "#10B981", // green
    medium: "#F59E0B", // yellow
    high: "#EF4444", // red
    urgent: "#DC2626", // dark red
  }

  // Get user ID from localStorage
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user.id || 1
  }

  // Fetch activities, goals, and teams
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      const userId = getUserId()

      // Fetch activities
      const activitiesResponse = await fetch(`http://localhost:5000/api/activities?userId=${userId}`)
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }

      // Fetch goals
      const goalsResponse = await fetch(`http://localhost:5000/api/goals?userId=${userId}`)
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(goalsData.goals || [])
      }

      // Fetch teams
      const teamsResponse = await fetch(`http://localhost:5000/api/teams?userId=${userId}`)
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData.teams || [])
      }

      // Notify parent component of data update
      if (onDataUpdate) {
        onDataUpdate()
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  // Delete activity
  const deleteActivity = async (activityId) => {
    if (!confirm("Are you sure you want to delete this activity?")) return

    try {
      const response = await fetch(`http://localhost:5000/api/activities/${activityId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAllData() // Refresh data
      } else {
        alert("Failed to delete activity")
      }
    } catch (error) {
      console.error("Error deleting activity:", error)
      alert("Error deleting activity")
    }
  }

  // Delete goal
  const deleteGoal = async (goalId) => {
    if (!confirm("Are you sure you want to delete this goal and all its timelines?")) return

    try {
      const response = await fetch(`http://localhost:5000/api/goals/${goalId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAllData() // Refresh data
      } else {
        alert("Failed to delete goal")
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
      alert("Error deleting goal")
    }
  }

  // Delete team meeting
  const deleteTeamMeeting = async (meetingId) => {
    if (!confirm("Are you sure you want to delete this team meeting?")) return

    try {
      const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAllData() // Refresh data
      } else {
        alert("Failed to delete team meeting")
      }
    } catch (error) {
      console.error("Error deleting team meeting:", error)
      alert("Error deleting team meeting")
    }
  }

  // Delete team
  const deleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team and all its meetings?")) return

    try {
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAllData() // Refresh data
      } else {
        alert("Failed to delete team")
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      alert("Error deleting team")
    }
  }

  // Handle edit
  const handleEdit = (item) => {
    setEditingItem(item)
    setIsEditModalOpen(true)
  }

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

  // Get most urgent activity for a specific date
  const getMostUrgentActivityForDate = (day) => {
    if (day.month !== "current") return null

    const dateString = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`

    const dayActivities = activities.filter((activity) => activity.activitydate === dateString)

    if (dayActivities.length === 0) return null

    // Sort by urgency priority
    const urgencyPriority = { urgent: 4, high: 3, medium: 2, low: 1 }
    const mostUrgent = dayActivities.reduce((prev, current) => {
      return urgencyPriority[current.activityurgency] > urgencyPriority[prev.activityurgency] ? current : prev
    })

    return mostUrgent
  }

  // Get past activities, goals, and team meetings
  const getPastItems = () => {
    const now = new Date()

    // Filter and format past activities
    const pastActivities = activities
      .filter((activity) => {
        const activityDate = new Date(activity.activitydate)
        if (activity.activityendtime) {
          const [endHour, endMinute] = activity.activityendtime.split(":").map(Number)
          activityDate.setHours(endHour, endMinute)
        } else {
          activityDate.setHours(23, 59) // End of day if no end time
        }
        return activityDate < now
      })
      .map((activity) => ({
        ...activity,
        type: "activity",
        deadline: new Date(activity.activitydate),
        title: activity.activitytitle,
        id: activity.activityid,
      }))

    // Filter and format past goals (using latest timeline end date)
    const pastGoals = []
    goals.forEach((goal) => {
      if (goal.timelines && goal.timelines.length > 0) {
        goal.timelines.forEach((timeline) => {
          const timelineEndDate = new Date(timeline.timelineenddate)
          if (timeline.timelineendtime) {
            const [endHour, endMinute] = timeline.timelineendtime.split(":").map(Number)
            timelineEndDate.setHours(endHour, endMinute)
          } else {
            timelineEndDate.setHours(23, 59)
          }

          if (timelineEndDate < now) {
            pastGoals.push({
              ...goal,
              timeline,
              type: "goal",
              deadline: timelineEndDate,
              title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
              id: goal.goalid,
              timelineId: timeline.timelineid,
            })
          }
        })
      }
    })

    // Filter and format past team meetings
    const pastMeetings = []
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          const meetingDate = new Date(meeting.meetingdate)
          if (meeting.meetingendtime) {
            const [endHour, endMinute] = meeting.meetingendtime.split(":").map(Number)
            meetingDate.setHours(endHour, endMinute)
          } else {
            meetingDate.setHours(23, 59) // End of day if no end time
          }

          if (meetingDate < now) {
            pastMeetings.push({
              ...meeting,
              type: "meeting",
              deadline: new Date(meeting.meetingdate),
              title: meeting.meetingtitle,
              id: meeting.teammeetingid,
              teamname: team.teamname,
            })
          }
        })
      }
    })

    // Combine and sort by deadline (most recent first)
    return [...pastActivities, ...pastGoals, ...pastMeetings].sort((a, b) => b.deadline - a.deadline)
  }

  // Get upcoming activities, goals, and team meetings sorted by deadline
  const getUpcomingItems = () => {
    const now = new Date()
    const nextMonth = new Date(now)
    nextMonth.setDate(nextMonth.getDate() + 30)

    // Filter and format upcoming activities
    const upcomingActivities = activities
      .filter((activity) => {
        const activityDate = new Date(activity.activitydate)
        // For activities, check if the date is today or later
        const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate())
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        return activityDateOnly >= todayOnly && activityDate <= nextMonth
      })
      .map((activity) => ({
        ...activity,
        type: "activity",
        deadline: new Date(activity.activitydate),
        title: activity.activitytitle,
        id: activity.activityid,
      }))

    // Filter and format upcoming goals (all timelines)
    const upcomingGoals = []
    goals.forEach((goal) => {
      if (goal.timelines && goal.timelines.length > 0) {
        goal.timelines.forEach((timeline) => {
          const timelineStartDate = new Date(timeline.timelinestartdate)
          const timelineEndDate = new Date(timeline.timelineenddate)

          // Create entries for each day the timeline spans
          const currentDate = new Date(timelineStartDate)
          while (currentDate <= timelineEndDate && currentDate <= nextMonth) {
            // Include today's goals by checking date only, not time
            const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
            const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            if (currentDateOnly >= todayOnly) {
              const entryDate = new Date(currentDate)
              if (timeline.timelinestarttime) {
                const [startHour, startMinute] = timeline.timelinestarttime.split(":").map(Number)
                entryDate.setHours(startHour, startMinute)
              } else {
                entryDate.setHours(0, 0)
              }

              upcomingGoals.push({
                ...goal,
                timeline,
                type: "goal",
                deadline: entryDate,
                title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                id: goal.goalid,
                timelineId: timeline.timelineid,
              })
            }
            currentDate.setDate(currentDate.getDate() + 1)
          }
        })
      }
    })

    // Filter and format upcoming team meetings
    const upcomingMeetings = []
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          const meetingDate = new Date(meeting.meetingdate)
          // For meetings, check if the date is today or later
          const meetingDateOnly = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate())
          const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())

          if (meetingDateOnly >= todayOnly && meetingDate <= nextMonth) {
            if (meeting.meetingstarttime) {
              const [startHour, startMinute] = meeting.meetingstarttime.split(":").map(Number)
              meetingDate.setHours(startHour, startMinute)
            } else {
              meetingDate.setHours(0, 0) // Start of day if no start time
            }

            upcomingMeetings.push({
              ...meeting,
              type: "meeting",
              deadline: new Date(meeting.meetingdate),
              title: meeting.meetingtitle,
              id: meeting.teammeetingid,
              teamname: team.teamname,
            })
          }
        })
      }
    })

    // Combine and sort by deadline
    return [...upcomingActivities, ...upcomingGoals, ...upcomingMeetings].sort((a, b) => a.deadline - b.deadline)
  }

  const formatEventTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatEventDate = (date) => {
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }

  const formatTime = (timeString) => {
    if (!timeString) return null
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Helper function to get time range
  const getTimeRange = (item) => {
    if (item.type === "activity") {
      if (item.activitystarttime && item.activityendtime) {
        return `${formatTime(item.activitystarttime)} - ${formatTime(item.activityendtime)}`
      }
    } else if (item.type === "meeting") {
      if (item.meetingstarttime && item.meetingendtime) {
        return `${formatTime(item.meetingstarttime)} - ${formatTime(item.meetingendtime)}`
      }
    } else if (item.type === "goal" && item.timeline) {
      const startDate = new Date(item.timeline.timelinestartdate)
      const endDate = new Date(item.timeline.timelineenddate)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Normalize today's date to compare only the date part

      const goalEnded = endDate < today

      if (activeTab === "past" && goalEnded) {
        const formatDateRange = (start, end) => {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

          const getOrdinal = (day) => {
            if (day > 3 && day < 21) return day + "th"
            switch (day % 10) {
              case 1: return day + "st"
              case 2: return day + "nd"
              case 3: return day + "rd"
              default: return day + "th"
            }
          }

          const startStr = `${months[start.getMonth()]} ${getOrdinal(start.getDate())} ${start.getFullYear()}`
          const endStr = `${months[end.getMonth()]} ${getOrdinal(end.getDate())} ${end.getFullYear()}`
          return `${startStr} - ${endStr}`
        }

        return formatDateRange(startDate, endDate)
      } else {
        // Ongoing goals or in 'upcoming' tab: use HH:MM time format
        const startTime = item.timeline.timelinestarttime?.slice(0, 5)
        const endTime = item.timeline.timelineendtime?.slice(0, 5)

        return startTime && endTime ? `${startTime} - ${endTime}` : "All day"
      }
    }
    return null
  }

  // Helper function to get day label
  const getDayLabel = (date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "TODAY"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "TOMORROW"
    } else {
      return date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()
    }
  }

  // Helper function to get color for event type
  const getEventColor = (item) => {
    if (item.type === "activity") {
      switch (item.activityurgency) {
        case "urgent":
          return "#DC2626"
        case "high":
          return "#EF4444"
        case "medium":
          return "#F59E0B"
        case "low":
          return "#10B981"
        default:
          return "#6B7280"
      }
    } else if (item.type === "goal") {
      return "#8B5CF6"
    } else if (item.type === "meeting") {
      return "#F97316"
    }
    return "#6B7280"
  }

  const renderEventItem = (item, index, showEditDelete = true) => {
    const timeRange = getTimeRange(item)
    const eventColor = getEventColor(item)

    // Create unique key for goal timelines that span multiple days
    const uniqueKey =
      item.type === "goal" && item.timelineId
        ? `${item.type}-${item.id}-${item.timelineId}-${item.deadline.toDateString()}`
        : `${item.type}-${item.id || index}`

    // Function to scroll to the item on the calendar grid
    const scrollToItemOnGrid = () => {
      // Find the date of the item
      let itemDate
      if (item.type === "activity") {
        itemDate = new Date(item.activitydate)
      } else if (item.type === "meeting") {
        itemDate = new Date(item.meetingdate)
      } else if (item.type === "goal" && item.timeline) {
        itemDate = new Date(item.timeline.timelinestartdate)
      } else {
        itemDate = item.deadline
      }

      // Set the current date to the item's date to navigate to that day
      setCurrentDate(new Date(itemDate))

      // Dispatch a custom event that CalendarGrid can listen for
      const event = new CustomEvent("highlightCalendarItem", {
        detail: {
          id: item.id,
          type: item.type,
          timelineId: item.timelineId || (item.timeline ? item.timeline.timelineid : null),
        },
      })
      window.dispatchEvent(event)
    }

    // Check if this item is highlighted
    const isHighlighted =
      highlightedSidebarItem &&
      highlightedSidebarItem.id === item.id &&
      highlightedSidebarItem.type === item.type &&
      (item.type !== "goal" ||
      highlightedSidebarItem.timelineId === (item.timelineId || (item.timeline ? item.timeline.timelineid : null)))

    return (
      <div
        key={uniqueKey}
        className={`relative group rounded p-2 -m-2 transition-colors ${
          isHighlighted ? "bg-blue-900 bg-opacity-10" : ""
        }`}
        data-item-id={`${item.type}-${item.id}${
          item.type === "goal" && (item.timelineId || (item.timeline && item.timeline.timelineid))
            ? `-${item.timelineId || item.timeline.timelineid}`
            : ""
        }`}
      >
        {/* Action buttons - show on card hover */}
        {showEditDelete && (
          <div className="absolute top-2 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {/* Eye icon to locate on calendar */}
            <button
              onClick={scrollToItemOnGrid}
              className="w-4 h-4 bg-gray-500 hover:bg-gray-600 rounded flex items-center justify-center"
              title="Find on calendar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button
              onClick={() => handleEdit(item)}
              className="w-4 h-4 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center"
              title="Edit"
            >
              <Edit2 size={8} />
            </button>
            <button
              onClick={() => {
                if (item.type === "activity") {
                  deleteActivity(item.id)
                } else if (item.type === "goal") {
                  deleteGoal(item.id)
                } else if (item.type === "meeting") {
                  deleteTeamMeeting(item.id)
                }
              }}
              className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded flex items-center justify-center"
              title="Delete"
            >
              <Trash2 size={8} />
            </button>
          </div>
        )}

        <div className="flex items-start space-x-3">
          {/* Colored dot indicator */}
          <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: eventColor }} />

          <div className="flex-1 min-w-0">
            {/* Time */}
            {timeRange && <div className="text-xs text-gray-300 mb-1">{timeRange}</div>}

            {/* Event title */}
            <div className="text-sm font-medium text-white mb-1">{item.title}</div>

            {/* Event description */}
            <div className="text-xs text-gray-400">
              {item.type === "activity" && item.activitydescription && <div>{item.activitydescription}</div>}
              {item.type === "goal" && item.goaldescription && <div>{item.goaldescription}</div>}
              {item.type === "meeting" && <div>{item.meetingdescription || `Team: ${item.teamname}`}</div>}
              {!timeRange && (
                <div className="text-gray-500">
                  {item.type === "activity" ? "Activity" : item.type === "goal" ? "Goal" : "Team Meeting"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const handleHighlightSidebarItem = (event) => {
      const { id, type, timelineId } = event.detail
      setHighlightedSidebarItem({ id, type, timelineId })

      // Scroll to the highlighted item in sidebar
      setTimeout(() => {
        // Updated selector to match the data-item-id format
        const itemSelector = `[data-item-id="${type}-${id}${type === "goal" && timelineId ? `-${timelineId}` : ""}"]`
        const itemElement = document.querySelector(itemSelector)
        if (itemElement && scrollContainerRef.current) {
          itemElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedSidebarItem(null)
      }, 3000)
    }

    const handleEditCalendarItem = (event) => {
      const { item } = event.detail
      handleEdit(item)
    }

    window.addEventListener("highlightSidebarItem", handleHighlightSidebarItem)
    window.addEventListener("editCalendarItem", handleEditCalendarItem)

    return () => {
      window.removeEventListener("highlightSidebarItem", handleHighlightSidebarItem)
      window.removeEventListener("editCalendarItem", handleEditCalendarItem)
    }
  }, [activities, goals, teams])

  const upcomingItems = getUpcomingItems()
  const pastItems = getPastItems()

  return (
    <div className="w-56 bg-[#002147] text-white flex flex-col h-full">
      <div className="p-4 pb-2 flex items-center">
        <button
          className="w-8 h-8 rounded-full bg-black bg-opacity-10 flex items-center justify-center hover:bg-opacity-20"
          onClick={() => setIsItemModalOpen(true)}
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
            week.map((day, dayIndex) => {
              const mostUrgentActivity = getMostUrgentActivityForDate(day)
              return (
                <button
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center relative
                    ${day.month !== "current" ? "text-gray-500" : ""}
                    ${isToday(day) ? "bg-blue-500 text-white" : ""}
                    ${isSelected(day) && !isToday(day) ? "bg-gray-300 text-gray-800" : ""}
                    ${day.month === "current" && !isToday(day) && !isSelected(day) ? "hover:bg-gray-300 hover:text-gray-800" : ""}
                  `}
                  onClick={() => {
                    if (day.month === "current") {
                      setCurrentDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day.date))
                    }
                  }}
                >
                  {day.date}
                  {mostUrgentActivity && (
                    <div
                      className="absolute -bottom-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: urgencyColors[mostUrgentActivity.activityurgency] }}
                    ></div>
                  )}
                </button>
              )
            }),
          )}
        </div>
      </div>

      {/* ONGOING Section - Fixed position above tabs */}
      <div className="px-4 pb-2">
        <h3 className="text-sm font-bold mb-1.5 text-gray-300">ONGOING</h3>
        {(() => {
          const now = new Date()
          const ongoingItems = []

          upcomingItems.forEach((item) => {
            const isOngoing = (() => {
              const today = now.toDateString()
              const itemDate = item.deadline.toDateString()

              if (itemDate !== today) return false

              const currentTime = now.getHours() * 60 + now.getMinutes()

              let startTime, endTime

              if (item.type === "activity") {
                if (item.activitystarttime && item.activityendtime) {
                  const [startHour, startMin] = item.activitystarttime.split(":").map(Number)
                  const [endHour, endMin] = item.activityendtime.split(":").map(Number)
                  startTime = startHour * 60 + startMin
                  endTime = endHour * 60 + endMin
                } else {
                  // If no time specified, consider it ongoing for the whole day
                  return true
                }
              } else if (item.type === "meeting") {
                if (item.meetingstarttime && item.meetingendtime) {
                  const [startHour, startMin] = item.meetingstarttime.split(":").map(Number)
                  const [endHour, endMin] = item.meetingendtime.split(":").map(Number)
                  startTime = startHour * 60 + startMin
                  endTime = endHour * 60 + endMin
                } else {
                  return true
                }
              } else if (item.type === "goal" && item.timeline) {
                if (item.timeline.timelinestarttime && item.timeline.timelineendtime) {
                  const [startHour, startMin] = item.timeline.timelinestarttime.split(":").map(Number)
                  const [endHour, endMin] = item.timeline.timelineendtime.split(":").map(Number)
                  startTime = startHour * 60 + startMin
                  endTime = endHour * 60 + endMin
                } else {
                  // If no time specified for goal timeline, consider it ongoing for the whole day
                  return true
                }
              }

              return (
                startTime !== undefined && endTime !== undefined && currentTime >= startTime && currentTime <= endTime
              )
            })()

            if (isOngoing) {
              ongoingItems.push(item)
            }
          })

          return ongoingItems.length > 0 ? (
            <div className="space-y-3">{ongoingItems.map((item, index) => renderEventItem(item, index))}</div>
          ) : (
            <p className="text-xs text-gray-400">No ongoing events</p>
          )
        })()}
      </div>

      {/* Tab Navigation - Fixed position */}
      <div className="px-3.5">
        <div className="flex justify-evenly border-b border-gray-600 items-center">
          <button
            className={`min-w-[98px] text-center px-3 py-2 text-sm font-medium ${activeTab === "upcoming" ? "text-white border-b-2 border-blue-400" : "text-gray-400 hover:text-gray-300"
              }`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`min-w-[98px] text-center px-3 py-2 text-sm font-medium ${activeTab === "past" ? "text-white border-b-2 border-blue-400" : "text-gray-400 hover:text-gray-300"
              }`}
            onClick={() => setActiveTab("past")}
          >
            Past
          </button>
        </div>
      </div>

      {/* Scrollable Events Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4" ref={scrollContainerRef}>
        {activeTab === "upcoming"
          ? // Upcoming events content (without ongoing items)
          (() => {
            // Group upcoming items by date (excluding ongoing items)
            const groupedItems = {}
            const now = new Date()


            upcomingItems.forEach((item) => {
              // Check if item is ongoing
              const isOngoing = (() => {
                const today = now.toDateString()
                const itemDate = item.deadline.toDateString()

                if (itemDate !== today) return false

                const currentTime = now.getHours() * 60 + now.getMinutes()

                let startTime, endTime

                if (item.type === "activity") {
                  if (item.activitystarttime && item.activityendtime) {
                    const [startHour, startMin] = item.activitystarttime.split(":").map(Number)
                    const [endHour, endMin] = item.activityendtime.split(":").map(Number)
                    startTime = startHour * 60 + startMin
                    endTime = endHour * 60 + endMin
                  } else {
                    // If no time specified, don't consider it ongoing
                    return false
                  }
                } else if (item.type === "meeting") {
                  if (item.meetingstarttime && item.meetingendtime) {
                    const [startHour, startMin] = item.meetingstarttime.split(":").map(Number)
                    const [endHour, endMin] = item.meetingendtime.split(":").map(Number)
                    startTime = startHour * 60 + startMin
                    endTime = endHour * 60 + endMin
                  } else {
                    return false
                  }
                } else if (item.type === "goal" && item.timeline) {
                  if (item.timeline.timelinestarttime && item.timeline.timelineendtime) {
                    const [startHour, startMin] = item.timeline.timelinestarttime.split(":").map(Number)
                    const [endHour, endMin] = item.timeline.timelineendtime.split(":").map(Number)
                    startTime = startHour * 60 + startMin
                    endTime = endHour * 60 + endMin
                  } else {
                    // If no time specified for goal timeline, don't consider it ongoing
                    return false
                  }
                }

                return (
                  startTime !== undefined &&
                  endTime !== undefined &&
                  currentTime >= startTime &&
                  currentTime <= endTime
                )
              })()

              // Only add to grouped items if not ongoing
              if (!isOngoing) {
                const dateKey = item.deadline.toDateString()
                if (!groupedItems[dateKey]) {
                  groupedItems[dateKey] = []
                }
                groupedItems[dateKey].push(item)
              }
            })

            return (
              <>
                {/* Daily Grouped Events */}
                {Object.entries(groupedItems).map(([dateKey, items]) => {
                  const date = new Date(dateKey)
                  const dayLabel = getDayLabel(date)
                  const dateLabel = date.toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                  })

                  return (
                    <div key={dateKey} className="mb-6">
                      <h3 className="text-sm font-bold mb-3 text-gray-300">
                        {dayLabel} {dateLabel}
                      </h3>
                      <div className="space-y-3">{items.map((item, index) => renderEventItem(item, index))}</div>
                    </div>
                  )
                })}

                {Object.keys(groupedItems).length === 0 && (
                  <p className="text-xs text-gray-400 mb-4">No upcoming events</p>
                )}
              </>
            )
          })()
          : // Past events content with same grouping logic
          (() => {
            // Group past items by date
            const groupedPastItems = {}

            pastItems.forEach((item) => {
              const dateKey = item.deadline.toDateString()
              if (!groupedPastItems[dateKey]) {
                groupedPastItems[dateKey] = []
              }
              groupedPastItems[dateKey].push(item)
            })

            return (
              <>
                {Object.entries(groupedPastItems).map(([dateKey, items]) => {
                  const date = new Date(dateKey)
                  const dayLabel = getDayLabel(date)
                  const dateLabel = date.toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                  })

                  return (
                    <div key={dateKey} className="mb-6">
                      <h3 className="text-sm font-bold mb-3 text-gray-300">
                        {dayLabel} {dateLabel}
                      </h3>
                      <div className="space-y-3">
                        {items.map((item, index) => renderEventItem(item, index, true))}
                      </div>
                    </div>
                  )
                })}

                {pastItems.length === 0 && <p className="text-xs text-gray-400 mb-4">No past events</p>}
              </>
            )
          })()}
      </div>

      {isEventModalOpen && (
        <AddEventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onAddEvent={addEvent}
          currentDate={currentDate}
        />
      )}

      {isItemModalOpen && (
        <AddItemModal
          isOpen={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false)
            fetchAllData() // Refresh data when modal closes
          }}
        />
      )}

      {isEditModalOpen && (
        <EditItemModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingItem(null)
            fetchAllData() // Refresh data when modal closes
          }}
          item={editingItem}
        />
      )}
    </div>
  )
}

export default Sidebar
