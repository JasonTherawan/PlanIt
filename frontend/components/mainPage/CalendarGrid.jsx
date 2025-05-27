"use client"

import { useRef, useEffect, useState } from "react"

const CalendarGrid = ({ currentDate, events, setCurrentDate, dataUpdateTrigger }) => {
  const gridRef = useRef(null)
  const horizontalScrollRef = useRef(null)
  const [daysInMonth, setDaysInMonth] = useState([])
  const [scrollPosition, setScrollPosition] = useState(0)
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])

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
              {goalTimelines.map((timelineBlock, index) => (
                <div
                  key={`goal-timeline-${timelineBlock.goal.goalid}-${timelineBlock.timelineIndex}`}
                  className="absolute bg-purple-100 border-l-4 border-purple-500 rounded p-1 text-xs overflow-hidden z-15"
                  style={{
                    left: `${timelineBlock.startDayIndex * 100 + 4}px`,
                    width: `${timelineBlock.spanDays * 100 - 8}px`,
                    top: `${timelineBlock.topPosition}px`,
                    height: `${timelineBlock.height}px`,
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
              ))}

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

                      return (
                        <div
                          key={`activity-${activity.activityid}`}
                          className="absolute left-1 right-1 bg-blue-50 border-l-4 rounded p-1 text-xs overflow-hidden"
                          style={{
                            borderLeftColor: urgencyColors[activity.activityurgency],
                            top: `${topPosition}px`,
                            height: `${height}px`,
                            zIndex: 15,
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
                      )
                    })}

                    {/* Team meeting blocks */}
                    {dayMeetings.map((meeting, meetingIndex) => {
                      const { startHour, duration } = getMeetingTimeSpan(meeting)
                      const topPosition = startHour * 56 + 24 // 56px per hour + 24px for goal space
                      const height = duration * 56 - 2 // Subtract 2px for border

                      return (
                        <div
                          key={`meeting-${meeting.teammeetingid}`}
                          className="absolute left-1 right-1 bg-orange-50 border-l-4 border-orange-500 rounded p-1 text-xs overflow-hidden"
                          style={{
                            top: `${topPosition}px`,
                            height: `${height}px`,
                            zIndex: 15,
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
    </div>
  )
}

export default CalendarGrid
