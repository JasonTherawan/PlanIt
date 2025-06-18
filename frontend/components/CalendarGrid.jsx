"use client"

import { useRef, useEffect, useState } from "react"
import { Edit2 } from "lucide-react"

const CalendarGrid = ({ currentDate, events, setCurrentDate, dataUpdateTrigger }) => {
  const gridRef = useRef(null)
  const horizontalScrollRef = useRef(null)
  const [daysInMonth, setDaysInMonth] = useState([])
  const [scrollPosition, setScrollPosition] = useState(0)
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])
  const [highlightedItem, setHighlightedItem] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoModalContent, setInfoModalContent] = useState(null)

  // Urgency color mapping
  const urgencyColors = {
    low: "#10B981", // green
    medium: "#FFDD00", // yellow
    high: "#FF4D6D", // red
    urgent: "#EF4444", // dark red
  }

  // Get user ID from localStorage
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user.id || 1
  }

  // Fetch activities, goals, and teams
  useEffect(() => {
    fetchAllData()
  }, [dataUpdateTrigger])

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
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

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

  // Add event listener for highlighting items from sidebar
  useEffect(() => {
    const handleHighlightItem = (event) => {
      const { id, type, timelineId } = event.detail
      setHighlightedItem({ id, type, timelineId })

      setTimeout(() => {
        const highlightedElement = document.querySelector(".highlighted-calendar-item")
        if (highlightedElement && horizontalScrollRef.current && gridRef.current) {
          const container = horizontalScrollRef.current
          const timeLabelContainer = gridRef.current

          const rect = highlightedElement.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()

          const verticalOffset = (rect.top - containerRect.top) + container.scrollTop - container.clientHeight / 2 + rect.height / 2
          const horizontalOffset = (rect.left - containerRect.left) + container.scrollLeft - container.clientWidth / 2 + rect.width / 2

          container.scrollTo({
            top: verticalOffset,
            left: horizontalOffset,
            behavior: "smooth"
          })

          timeLabelContainer.scrollTo({
            top: verticalOffset,
            behavior: "smooth"
          })
        }
      }, 200)

      setTimeout(() => {
        setHighlightedItem(null)
      }, 3000)
    }

    window.addEventListener("highlightCalendarItem", handleHighlightItem)
    return () => window.removeEventListener("highlightCalendarItem", handleHighlightItem)
  }, [])

  // Add this useEffect after the existing useEffect for highlighting items
  useEffect(() => {
    const handleShowInfoModal = (event) => {
      const { item } = event.detail
      setInfoModalContent(item)
      setShowInfoModal(true)
    }

    window.addEventListener("showInfoModal", handleShowInfoModal)

    return () => {
      window.removeEventListener("showInfoModal", handleShowInfoModal)
    }
  }, [])
  
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

  // Get activities for a specific day
  const getActivitiesForDay = (day) => {
    const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`

    return activities.filter((activity) => activity.activitydate === dateString)
  }

  // Get team meetings for a specific day
  const getTeamMeetingsForDay = (day) => {
    const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`

    const dayMeetings = []
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          if (meeting.meetingdate === dateString) {
            dayMeetings.push({
              ...meeting,
              teamname: team.teamname,
            })
          }
        })
      }
    })

    return dayMeetings
  }

  // Calculate activity time span
  const getActivityTimeSpan = (activity) => {
    if (!activity.activitystarttime || !activity.activityendtime) {
      return { startHour: 0, duration: 1 } // Default to 1 hour at midnight
    }

    const startHour = Number.parseInt(activity.activitystarttime.split(":")[0])
    const startMinute = Number.parseInt(activity.activitystarttime.split(":")[1])
    const endHour = Number.parseInt(activity.activityendtime.split(":")[0])
    const endMinute = Number.parseInt(activity.activityendtime.split(":")[1])

    const startDecimal = startHour + startMinute / 60
    const endDecimal = endHour + endMinute / 60
    const duration = Math.max(0.5, endDecimal - startDecimal) // Minimum 30 minutes

    return { startHour: startDecimal, duration }
  }

  // Calculate meeting time span
  const getMeetingTimeSpan = (meeting) => {
    if (!meeting.meetingstarttime || !meeting.meetingendtime) {
      return { startHour: 0, duration: 1 } // Default to 1 hour at midnight
    }

    const startHour = Number.parseInt(meeting.meetingstarttime.split(":")[0])
    const startMinute = Number.parseInt(meeting.meetingstarttime.split(":")[1])
    const endHour = Number.parseInt(meeting.meetingendtime.split(":")[0])
    const endMinute = Number.parseInt(meeting.meetingendtime.split(":")[1])

    const startDecimal = startHour + startMinute / 60
    const endDecimal = endHour + endMinute / 60
    const duration = Math.max(0.5, endDecimal - startDecimal) // Minimum 30 minutes

    return { startHour: startDecimal, duration }
  }

  // Get goal timelines that span across days
  const getGoalTimelinesForMonth = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const timelineBlocks = []

    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((timeline, timelineIndex) => {
          const startDate = new Date(timeline.timelinestartdate)
          const endDate = new Date(timeline.timelineenddate)

          // Check if timeline overlaps with current month
          if (startDate <= monthEnd && endDate >= monthStart) {
            // Calculate the actual start and end within the month
            const actualStart = new Date(Math.max(startDate.getTime(), monthStart.getTime()))
            const actualEnd = new Date(Math.min(endDate.getTime(), monthEnd.getTime()))

            const startDayIndex = actualStart.getDate() - 1
            const endDayIndex = actualEnd.getDate() - 1
            const spanDays = endDayIndex - startDayIndex + 1

            // Calculate vertical position based on timeline times
            let topPosition = 24 // Default top position (after goal header space)
            let height = 20 // Default height

            if (timeline.timelinestarttime && timeline.timelineendtime) {
              const startHour = Number.parseInt(timeline.timelinestarttime.split(":")[0])
              const startMinute = Number.parseInt(timeline.timelinestarttime.split(":")[1])
              const endHour = Number.parseInt(timeline.timelineendtime.split(":")[0])
              const endMinute = Number.parseInt(timeline.timelineendtime.split(":")[1])

              const startDecimal = startHour + startMinute / 60
              const endDecimal = endHour + endMinute / 60
              const duration = Math.max(0.5, endDecimal - startDecimal) // Minimum 30 minutes

              topPosition = startDecimal * 56 + 2 // 56px per hour + 2px for header space
              height = duration * 56 - 6 // Subtract 6px for border
            }

            timelineBlocks.push({
              goal,
              timeline,
              timelineIndex,
              startDayIndex,
              spanDays,
              topPosition,
              height,
              isPartialStart: startDate < monthStart,
              isPartialEnd: endDate > monthEnd,
            })
          }
        })
      }
    })

    return timelineBlocks
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
  
  // Info modal component
  const InfoModal = ({ item, onClose }) => {
    if (!item) return null

    const handleEdit = () => {
      onClose()

      // For goals, we need to reconstruct the complete goal object with all timelines
      if (item.type === "goal") {
        // Find the complete goal data from the goals array
        const completeGoal = goals.find((goal) => goal.goalid === item.id)
        if (completeGoal) {
          const editItem = {
            ...completeGoal,
            type: "goal",
            id: completeGoal.goalid,
          }
          const event = new CustomEvent("editCalendarItem", {
            detail: { id: item.id, type: item.type, item: editItem },
          })
          window.dispatchEvent(event)
        }
      } else {
        const event = new CustomEvent("editCalendarItem", {
          detail: { id: item.id, type: item.type, item: item },
        })
        window.dispatchEvent(event)
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg border-1 shadow-2xl w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {item.type === "activity"
                ? item.activitytitle
                : item.type === "goal"
                  ? `${item.goaltitle} - ${item.timelinetitle}`
                  : item.meetingtitle}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleEdit}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Date and Time */}
            <div className="text-sm">
              <span className="font-medium">Date: </span>
              {item.type === "activity"
                ? item.activitydate
                : item.type === "goal"
                  ? `${item.timelinestartdate} to ${item.timelineenddate}`
                  : item.meetingdate}
            </div>

            {/* Time */}
            {item.type === "activity" && (item.activitystarttime || item.activityendtime) && (
              <div className="text-sm">
                <span className="font-medium">Time: </span>
                {item.activitystarttime && item.activityendtime
                  ? `${item.activitystarttime} to ${item.activityendtime}`
                  : item.activitystarttime || item.activityendtime}
              </div>
            )}

            {item.type === "goal" && (item.timelinestarttime || item.timelineendtime) && (
              <div className="text-sm">
                <span className="font-medium">Time: </span>
                {item.timelinestarttime && item.timelineendtime
                  ? `${item.timelinestarttime} to ${item.timelineendtime}`
                  : item.timelinestarttime || item.timelineendtime}
              </div>
            )}

            {item.type === "meeting" && (item.meetingstarttime || item.meetingendtime) && (
              <div className="text-sm">
                <span className="font-medium">Time: </span>
                {item.meetingstarttime && item.meetingendtime
                  ? `${item.meetingstarttime} to ${item.meetingendtime}`
                  : item.meetingstarttime || item.meetingendtime}
              </div>
            )}

            {/* Description */}
            {item.type === "activity" && item.activitydescription && (
              <div className="text-sm">
                <span className="font-medium">Description: </span>
                {item.activitydescription}
              </div>
            )}

            {item.type === "goal" && item.goaldescription && (
              <div className="text-sm">
                <span className="font-medium">Description: </span>
                {item.goaldescription}
              </div>
            )}

            {item.type === "meeting" && item.meetingdescription && (
              <div className="text-sm">
                <span className="font-medium">Description: </span>
                {item.meetingdescription}
              </div>
            )}

            {/* Category */}
            {item.type === "activity" && item.activitycategory && (
              <div className="text-sm">
                <span className="font-medium">Category: </span>
                {item.activitycategory}
              </div>
            )}

            {item.type === "goal" && item.goalcategory && (
              <div className="text-sm">
                <span className="font-medium">Category: </span>
                {item.goalcategory}
              </div>
            )}

            {/* Urgency for activities */}
            {item.type === "activity" && item.activityurgency && (
              <div className="text-sm">
                <span className="font-medium">Urgency: </span>
                <span
                  className={`
                ${item.activityurgency === "low" ? "text-green-600" : ""}
                ${item.activityurgency === "medium" ? "text-yellow-600" : ""}
                ${item.activityurgency === "high" ? "text-red-600" : ""}
                ${item.activityurgency === "urgent" ? "text-red-700 font-bold" : ""}
              `}
                >
                  {item.activityurgency.charAt(0).toUpperCase() + item.activityurgency.slice(1)}
                </span>
              </div>
            )}

            {/* Progress for goals */}
            {item.type === "goal" && item.goalprogress && (
              <div className="text-sm">
                <span className="font-medium">Progress: </span>
                {item.goalprogress.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
            )}

            {/* Team name for meetings */}
            {item.type === "meeting" && item.teamname && (
              <div className="text-sm">
                <span className="font-medium">Team: </span>
                {item.teamname}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const goalTimelines = getGoalTimelinesForMonth()

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
            <div className="flex border-b overflow-hidden relative">
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
            <div className="flex relative" style={{ minWidth: `${daysInMonth.length * 100}px` }}>
              {/* Goal timeline blocks */}
              {goalTimelines.map((timelineBlock, index) => {
                const isHighlighted =
                  highlightedItem &&
                  highlightedItem.type === "goal" &&
                  highlightedItem.id === timelineBlock.goal.goalid &&
                  highlightedItem.timelineId === timelineBlock.timeline.timelineid

                return (
                  <div
                    key={`goal-timeline-${timelineBlock.goal.goalid}-${timelineBlock.timelineIndex}`}
                    className={`absolute bg-purple-100 border-l-4 border-purple-500 rounded p-1 text-xs overflow-hidden
                 transition-all duration-200 hover:transform hover:scale-[1.02] hover:z-30 hover:shadow-md
                 ${isHighlighted ? "highlighted-calendar-item ring-2 ring-purple-500 z-30 scale-[1.03]" : ""}`}
                    style={{
                      left: `${timelineBlock.startDayIndex * 100 + 4}px`,
                      width: `${timelineBlock.spanDays * 100 - 8}px`,
                      top: `${timelineBlock.topPosition}px`,
                      height: `${timelineBlock.height}px`,
                      zIndex: isHighlighted ? 30 : 15,
                    }}
                    onClick={(e) => {
                      const item = {
                        id: timelineBlock.goal.goalid,
                        type: "goal",
                        timelineId: timelineBlock.timeline.timelineid,
                        goaltitle: timelineBlock.goal.goaltitle,
                        timelinetitle: timelineBlock.timeline.timelinetitle,
                        timelinestartdate: timelineBlock.timeline.timelinestartdate,
                        timelineenddate: timelineBlock.timeline.timelineenddate,
                        timelinestarttime: timelineBlock.timeline.timelinestarttime,
                        timelineendtime: timelineBlock.timeline.timelineendtime,
                        goaldescription: timelineBlock.goal.goaldescription,
                        goalcategory: timelineBlock.goal.goalcategory,
                        goalprogress: timelineBlock.goal.goalprogress,
                      }
                      
                      // Check if item is in past and switch sidebar tab accordingly
                      const itemDate = new Date(timelineBlock.timeline.timelineenddate)
                      const now = new Date()
                      const isItemInPast = itemDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())

                      // Dispatch event to switch sidebar tab if needed
                      const switchTabEvent = new CustomEvent("switchSidebarTab", {
                        detail: { isPast: isItemInPast },
                      })
                      window.dispatchEvent(switchTabEvent)

                      setInfoModalContent(item)
                      setShowInfoModal(true)
                      const event = new CustomEvent("highlightSidebarItem", {
                        detail: { id: item.id, type: item.type, timelineId: item.timelineId },
                      })
                      window.dispatchEvent(event)
                    }}
                  >
                    <div className="font-medium text-purple-800 truncate">
                      {timelineBlock.goal.goaltitle} - {timelineBlock.timeline.timelinetitle}
                    </div>
                    {timelineBlock.timeline.timelinestarttime && (
                      <div className="text-purple-600 text-xs">
                        {timelineBlock.timeline.timelinestarttime}
                        {timelineBlock.timeline.timelineendtime && ` - ${timelineBlock.timeline.timelineendtime}`}
                      </div>
                    )}
                  </div>
                )
              })}

              {daysInMonth.map((day, dayIndex) => {
                const dayActivities = getActivitiesForDay(day)
                const dayMeetings = getTeamMeetingsForDay(day)

                return (
                  <div
                    key={dayIndex}
                    className={`w-[100px] flex-shrink-0 border-r relative ${isToday(day) ? "bg-blue-50" : ""}`}
                  >
                    {/* Activity blocks */}
                    {dayActivities.map((activity, actIndex) => {
                      const { startHour, duration } = getActivityTimeSpan(activity)
                      const topPosition = startHour * 56 + 2 // 56px per hour (14px * 4 quarters) + 2px for goal space
                      const height = duration * 56 - 6 // Subtract 6px for border

                      // Check for overlaps with other activities on the same day
                      const overlappingActivities = dayActivities.filter((otherActivity, otherIndex) => {
                        if (otherIndex >= actIndex) return false // Only count previous activities
                        const { startHour: otherStart, duration: otherDuration } = getActivityTimeSpan(otherActivity)
                        const otherEnd = otherStart + otherDuration
                        const currentEnd = startHour + duration
                        return startHour < otherEnd && currentEnd > otherStart
                      })

                      const overlapCount = overlappingActivities.length
                      const zIndexBase = 15
                      const leftOffset = overlapCount * 4 // 4px offset per overlap
                      const shadowLayers = overlapCount

                      const isHighlighted =
                        highlightedItem &&
                        highlightedItem.type === "activity" &&
                        highlightedItem.id === activity.activityid

                      return (
                        <div key={`activity-${activity.activityid}`} className="relative">
                          {/* Main activity block */}
                          <div
                            className={`absolute bg-blue-50 border-l-4 rounded p-1 text-xs overflow-hidden
                            transition-all duration-200 hover:transform hover:scale-[1.02] hover:z-30 hover:shadow-md
                            ${isHighlighted ? "highlighted-calendar-item ring-2 ring-blue-700 z-30 scale-[1.03]" : ""}`}
                            style={{
                              borderLeftColor: urgencyColors[activity.activityurgency],
                              top: `${topPosition}px`,
                              height: `${height}px`,
                              left: `${4 + leftOffset}px`,
                              right: "4px",
                              zIndex: isHighlighted ? 30 : zIndexBase + overlapCount + 1,
                            }}
                            onClick={(e) => {
                              const item = {
                                id: activity.activityid,
                                type: "activity",
                                activitytitle: activity.activitytitle,
                                activitydate: activity.activitydate,
                                activitystarttime: activity.activitystarttime,
                                activityendtime: activity.activityendtime,
                                activitydescription: activity.activitydescription,
                                activitycategory: activity.activitycategory,
                                activityurgency: activity.activityurgency,
                              }
                              
                              // Check if item is in past and switch sidebar tab accordingly
                              const itemDate = new Date(activity.activitydate)
                              const now = new Date()
                              const isItemInPast = itemDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())

                              // Dispatch event to switch sidebar tab if needed
                              const switchTabEvent = new CustomEvent("switchSidebarTab", {
                                detail: { isPast: isItemInPast },
                              })
                              window.dispatchEvent(switchTabEvent)

                              setInfoModalContent(item)
                              setShowInfoModal(true)
                              const event = new CustomEvent("highlightSidebarItem", {
                                detail: { id: item.id, type: item.type },
                              })
                              window.dispatchEvent(event)
                            }}
                          >
                            <div className="font-medium text-blue-800 truncate">{activity.activitytitle}</div>
                            {activity.activitystarttime && (
                              <div className="text-blue-600 text-xs">
                                {activity.activitystarttime}
                                {activity.activityendtime && ` - ${activity.activityendtime}`}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Team meeting blocks */}
                    {dayMeetings.map((meeting, meetingIndex) => {
                      const { startHour, duration } = getMeetingTimeSpan(meeting)
                      const topPosition = startHour * 56 + 2 // 56px per hour (14px * 4 quarters) + 2px for goal space
                      const height = duration * 56 - 6 // Subtract 6px for border
                      
                      // Check for overlaps with other meetings on the same day
                      const overlappingMeetings = dayMeetings.filter((otherMeeting, otherIndex) => {
                        if (otherIndex >= meetingIndex) return false
                        const { startHour: otherStart, duration: otherDuration } = getMeetingTimeSpan(otherMeeting)
                        const otherEnd = otherStart + otherDuration
                        const currentEnd = startHour + duration
                        return startHour < otherEnd && currentEnd > otherStart
                      })

                      const overlapCount = overlappingMeetings.length
                      const zIndexBase = 15
                      const leftOffset = overlapCount * 4
                      const shadowLayers = overlapCount

                      const isHighlighted =
                        highlightedItem &&
                        highlightedItem.type === "meeting" &&
                        highlightedItem.id === meeting.teammeetingid

                      return (
                        <div key={`meeting-${meeting.teammeetingid}`} className="relative">
                          {/* Main meeting block */}
                          <div
                            className={`absolute bg-orange-50 border-l-4 border-orange-500 rounded p-1 text-xs overflow-hidden
                              transition-all duration-200 hover:transform hover:scale-[1.02] hover:z-30 hover:shadow-md
                              ${isHighlighted ? "highlighted-calendar-item ring-2 ring-orange-500 z-30 scale-[1.03]" : ""}`}
                            style={{
                              top: `${topPosition}px`,
                              height: `${height}px`,
                              left: `${4 + leftOffset}px`,
                              right: "4px",
                              zIndex: isHighlighted ? 30 : zIndexBase + overlapCount + 1,
                            }}
                            onClick={(e) => {
                              const item = {
                                id: meeting.teammeetingid,
                                type: "meeting",
                                meetingtitle: meeting.meetingtitle,
                                meetingdate: meeting.meetingdate,
                                meetingstarttime: meeting.meetingstarttime,
                                meetingendtime: meeting.meetingendtime,
                                meetingdescription: meeting.meetingdescription,
                                teamname: meeting.teamname,
                              }

                              // Check if item is in past and switch sidebar tab accordingly
                              const itemDate = new Date(meeting.meetingdate)
                              const now = new Date()
                              const isItemInPast = itemDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())

                              // Dispatch event to switch sidebar tab if needed
                              const switchTabEvent = new CustomEvent("switchSidebarTab", {
                                detail: { isPast: isItemInPast },
                              })
                              window.dispatchEvent(switchTabEvent)

                              setInfoModalContent(item)
                              setShowInfoModal(true)
                              const event = new CustomEvent("highlightSidebarItem", {
                                detail: { id: item.id, type: item.type },
                              })
                              window.dispatchEvent(event)
                            }}
                          >
                            <div className="font-medium text-orange-800 truncate">{meeting.meetingtitle}</div>
                            <div className="text-orange-600 text-xs truncate">Team: {meeting.teamname}</div>
                            {meeting.meetingstarttime && (
                              <div className="text-orange-600 text-xs">
                                {meeting.meetingstarttime}
                                {meeting.meetingendtime && ` - ${meeting.meetingendtime}`}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {timeSlots.map((slot) => {
                      const eventsInSlot = getEventsForTimeSlot(day, slot.hour)

                      return (
                        <div key={slot.hour} className="h-14 border-b relative">
                          {/* Regular events */}
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
                              className="absolute left-0 right-0 border-t-2 border-red-500 z-30"
                              style={{ top: `${(currentMinute / 60) * 100}%` }}
                            >
                              <div className="absolute -left-1 -top-2 w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Info Modal */}
      {showInfoModal && (
        <InfoModal
          item={infoModalContent}
          onClose={() => {
            setShowInfoModal(false)
            setInfoModalContent(null)
          }}
        />
      )}
    </div>
  )
}

export default CalendarGrid
