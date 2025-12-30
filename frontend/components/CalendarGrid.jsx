"use client"

import { useRef, useEffect, useState } from "react"
import { Edit2, Trash2 } from "lucide-react"

const CalendarGrid = ({ currentDate, setCurrentDate, dataUpdateTrigger }) => {
  const gridRef = useRef(null)
  const horizontalScrollRef = useRef(null)
  const [daysInMonth, setDaysInMonth] = useState([])
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])
  const [highlightedItem, setHighlightedItem] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [infoModalContent, setInfoModalContent] = useState(null)

  const urgencyColors = {
    low: "#10B981",
    medium: "#FFBB00",
    "medium-high": "#3B82F6",
    high: "#FF0000",
    urgent: "#FF00C3",
  }

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user.id || null
  }

  // Fetch activities, goals, and teams
  useEffect(() => {
    fetchAllData()
  }, [dataUpdateTrigger])

  // Event listener for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchAllData()
    }
    window.addEventListener("profileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate)
    }
  }, [])

  const fetchAllData = async () => {
    try {
      const userId = getUserId()

      const activitiesResponse = await fetch(`/api/activities?userId=${userId}`)
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }

      const goalsResponse = await fetch(`/api/goals?userId=${userId}`)
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(goalsData.goals || [])
      }

      const teamsResponse = await fetch(`/api/teams?userId=${userId}`)
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
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push(new Date(year, month, i))
    }

    setDaysInMonth(days)

    setTimeout(() => {
      if (horizontalScrollRef.current) {
        const dayWidth = 100
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

  // Add event listener for highlighting items
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
  
  const timeSlots = []
  for (let i = 0; i < 24; i++) {
    timeSlots.push({
      hour: i,
      label: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
    })
  }

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

  const getActivitiesForDay = (day) => {
    const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`

    return activities.filter((activity) => activity.activitydate === dateString)
  }

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
              teamid: team.teamid,
            })
          }
        })
      }
    })

    return dayMeetings
  }

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

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  const isToday = (date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }
  
  const InfoModal = ({ item, onClose }) => {
    const [creator, setCreator] = useState(null)
  
    useEffect(() => {
        const fetchCreatorData = async (creatorId) => {
            try {
                const response = await fetch(`/api/users/${creatorId}`)
                if (response.ok) {
                    const userData = await response.json()
                    setCreator(userData.user)
                }
            } catch (error) {
                console.error("Error fetching creator data:", error)
            }
        }

        if (item && item.type === 'meeting' && item.teamid) {
            const team = teams.find(t => t.teamid === item.teamid)
            if (team) {
                fetchCreatorData(team.createdbyuserid)
            }
        }
    }, [item])

    if (!item) return null

    const handleEdit = () => {
      onClose()

      // Reconstruct the complete goal object with all timelines
      if (item.type === "goal") {
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

    const handleDelete = () => {
      onClose()
      if (item.type === "activity") {
        const event = new CustomEvent("deleteCalendarItem", {
          detail: { id: item.id, type: item.type },
        })
        window.dispatchEvent(event)
      } else if (item.type === "goal") {
        const event = new CustomEvent("deleteCalendarItem", {
          detail: {
            id: item.id,
            type: item.type,
            timelineId: item.timelineId,
          },
        })
        window.dispatchEvent(event)
      } else if (item.type === "meeting") {
        const event = new CustomEvent("deleteCalendarItem", {
          detail: { id: item.id, type: item.type },
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
              <button
                onClick={handleDelete}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={16} />
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
            
            {/* Meeting Type */}
            {item.type === "meeting" && (
                <div className="text-sm">
                    <span className="font-medium">Meeting Type: </span>
                    <span className="capitalize">{item.invitationtype}</span>
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
                  style={{ 
                    color: urgencyColors[item.activityurgency],
                    fontWeight: 'bold'
                  }}
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

            {/* Creator for meetings */}
            {item.type === 'meeting' && creator && (
                <div className="text-sm">
                    <span className="font-medium">Created by:</span>
                    <div className="flex items-center mt-1">
                        <img src={creator.userprofilepicture || `https://ui-avatars.com/api/?name=${creator.username}&background=0D8ABC&color=fff`} alt={creator.username} className="w-6 h-6 rounded-full mr-2" />
                        <span>{creator.userid === getUserId() ? "You" : creator.username}</span>
                    </div>
                </div>
            )}

            {/* Members for meetings */}
            {item.type === "meeting" && (
                <div className="text-sm">
                    <span className="font-medium">Members:</span>
                    <div className="flex flex-col gap-2 mt-1">
                        {item.members && item.members.length > 0 ? (
                            item.members.map((member) => (
                                <div key={member.userid} className="flex items-center">
                                    <img src={member.userprofilepicture || `https://ui-avatars.com/api/?name=${member.username}&background=0D8ABC&color=fff`} alt={member.username} className="w-6 h-6 rounded-full mr-2" />
                                    <span>{member.userid === getUserId() ? "You" : member.username}</span>
                                    {item.invitationtype === "request" && (
                                        <span className={`text-xs px-2 py-1 rounded ml-2 ${
                                            member.status === "accepted" ? "bg-green-100 text-green-800" :
                                            member.status === "declined" ? "bg-red-100 text-red-800" :
                                            "bg-yellow-100 text-yellow-800"
                                        }`}>
                                            {member.status}
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">No current members</p>
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const goalTimelines = getGoalTimelinesForMonth()

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://picsum.photos/1920/1080)`,
          filter: 'blur(4px)',
          opacity: 0.2,
          zIndex: 0,
          transform: 'scale(1.1)',
        }}
      ></div>

      <div className="flex h-full relative z-10">
        {/* Time labels column */}
        <div className="w-16 flex-shrink-0 border-r border-gray-200/50 bg-white/70 backdrop-blur-sm">
          <div className="h-12 border-b border-gray-200/50"></div> {/* Empty cell for the header row */}
          <div className="overflow-hidden h-[calc(100vh-112px)]" ref={gridRef}>
            {timeSlots.map((slot) => (
              <div key={slot.hour} className="h-14 border-b border-gray-200/50 flex items-start justify-end pr-2 text-xs text-gray-500">
                <span className="mt-1">{slot.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid with horizontal scrolling */}
        <div className="flex-1 overflow-hidden">
          <div className="sticky left-0 z-10 bg-white/70 backdrop-blur-sm">
            <div className="flex border-b border-gray-200/50 overflow-hidden relative">
              <div className="flex" style={{ minWidth: `${daysInMonth.length * 100}px` }}>
                {daysInMonth.map((day, index) => {
                  const { dayName, dayNumber, isTodayDate } = formatDayHeader(day)
                  return (
                    <div
                      key={index}
                      className={`w-[100px] flex-shrink-0 h-12 flex flex-col items-center justify-center border-r border-gray-200/50
                        ${isToday(day) ? "bg-blue-100/50" : "bg-transparent"}
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
              const headerContainer = e.currentTarget.previousSibling.firstChild
              if (headerContainer) {
                headerContainer.scrollLeft = e.currentTarget.scrollLeft
              }
              if (gridRef.current) {
                gridRef.current.scrollTop = e.currentTarget.scrollTop
              }
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
                    onClick={() => {
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
                      
                      const itemDate = new Date(timelineBlock.timeline.timelineenddate)
                      const now = new Date()
                      const isItemInPast = itemDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())

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

                // Combine and sort activities and meetings by creation time
                const dayItems = [
                  ...dayActivities.map(a => ({ ...a, type: 'activity', id: a.activityid, created_at: a.created_at || new Date(0).toISOString() })),
                  ...dayMeetings.map(m => ({ ...m, type: 'meeting', id: m.teammeetingid, created_at: m.created_at || new Date(0).toISOString() }))
                ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

                return (
                  <div
                    key={dayIndex}
                    className={`w-[100px] flex-shrink-0 border-r border-gray-200/50 relative ${isToday(day) ? "bg-blue-100/30" : "bg-transparent"}`}
                  >
                    {dayItems.map((item, itemIndex) => {
                      const { startHour, duration } = item.type === 'activity'
                        ? getActivityTimeSpan(item)
                        : getMeetingTimeSpan(item)

                      const topPosition = startHour * 56 + 2
                      const height = duration * 56 - 6

                      const overlappingItems = dayItems.filter((otherItem, otherIndex) => {
                        if (otherIndex >= itemIndex) return false

                        const { startHour: otherStart, duration: otherDuration } = otherItem.type === 'activity'
                          ? getActivityTimeSpan(otherItem)
                          : getMeetingTimeSpan(otherItem)
                        
                        const otherEnd = otherStart + otherDuration
                        const currentEnd = startHour + duration

                        return startHour < otherEnd && currentEnd > otherStart
                      })

                      const overlapCount = overlappingItems.length
                      const leftOffset = overlapCount * 4
                      const zIndexBase = 15
                      
                      const isHighlighted =
                        highlightedItem &&
                        highlightedItem.type === item.type &&
                        highlightedItem.id === item.id

                      if (item.type === 'activity') {
                        return (
                          <div key={`activity-${item.id}`} className="relative">
                            <div
                              className={`absolute bg-opacity-70 border-l-4 rounded p-1 text-xs overflow-hidden
                              transition-all duration-200 hover:transform hover:scale-[1.02] hover:z-30 hover:shadow-md
                              ${isHighlighted ? "highlighted-calendar-item ring-2 z-30 scale-[1.03]" : ""}`}
                              style={{
                                borderLeftColor: urgencyColors[item.activityurgency],
                                backgroundColor: `color-mix(in srgb, ${urgencyColors[item.activityurgency]} 20%, white)`,
                                top: `${topPosition}px`,
                                height: `${height}px`,
                                left: `${4 + leftOffset}px`,
                                right: "4px",
                                zIndex: isHighlighted ? 30 : zIndexBase + overlapCount + 1,
                              }}
                              onClick={() => {
                                const modalItem = {
                                  id: item.activityid,
                                  type: "activity",
                                  activitytitle: item.activitytitle,
                                  activitydate: item.activitydate,
                                  activitystarttime: item.activitystarttime,
                                  activityendtime: item.activityendtime,
                                  activitydescription: item.activitydescription,
                                  activitycategory: item.activitycategory,
                                  activityurgency: item.activityurgency,
                                }
                                
                                const itemDate = new Date(item.activitydate)
                                const now = new Date()
                                const isItemInPast = itemDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())

                                const switchTabEvent = new CustomEvent("switchSidebarTab", {
                                  detail: { isPast: isItemInPast },
                                })
                                window.dispatchEvent(switchTabEvent)

                                setInfoModalContent(modalItem)
                                setShowInfoModal(true)
                                const event = new CustomEvent("highlightSidebarItem", {
                                  detail: { id: modalItem.id, type: modalItem.type },
                                })
                                window.dispatchEvent(event)
                              }}
                            >
                              <div className="font-medium text-gray-800 truncate">{item.activitytitle}</div>
                              {item.activitystarttime && (
                                <div className="text-gray-600 text-xs">
                                  {item.activitystarttime}
                                  {item.activityendtime && ` - ${item.activityendtime}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      } else { // item.type === 'meeting'
                        return (
                          <div key={`meeting-${item.id}`} className="relative">
                            <div
                              className={`absolute border-l-4 rounded p-1 text-xs overflow-hidden
                                transition-all duration-200 hover:transform hover:scale-[1.02] hover:z-30 hover:shadow-md
                                ${isHighlighted ? "highlighted-calendar-item ring-2 z-30 scale-[1.03]" : ""}`}
                              style={{
                                borderLeftColor: urgencyColors['medium-high'],
                                backgroundColor: `color-mix(in srgb, ${urgencyColors['medium-high']} 20%, white)`,
                                top: `${topPosition}px`,
                                height: `${height}px`,
                                left: `${4 + leftOffset}px`,
                                right: "4px",
                                zIndex: isHighlighted ? 30 : zIndexBase + overlapCount + 1,
                              }}
                              onClick={() => {
                                const modalItem = {
                                  id: item.teammeetingid,
                                  type: "meeting",
                                  meetingtitle: item.meetingtitle,
                                  meetingdate: item.meetingdate,
                                  meetingstarttime: item.meetingstarttime,
                                  meetingendtime: item.meetingendtime,
                                  meetingdescription: item.meetingdescription,
                                  teamname: item.teamname,
                                  invitationtype: item.invitationtype,
                                  members: item.members,
                                  teamid: item.teamid,
                                }

                                const itemDate = new Date(item.meetingdate)
                                const now = new Date()
                                const isItemInPast = itemDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())

                                const switchTabEvent = new CustomEvent("switchSidebarTab", {
                                  detail: { isPast: isItemInPast },
                                })
                                window.dispatchEvent(switchTabEvent)

                                setInfoModalContent(modalItem)
                                setShowInfoModal(true)
                                const event = new CustomEvent("highlightSidebarItem", {
                                  detail: { id: modalItem.id, type: modalItem.type },
                                })
                                window.dispatchEvent(event)
                              }}
                            >
                              <div className="font-medium text-blue-800 truncate">{item.meetingtitle}</div>
                              <div className="text-blue-600 text-xs truncate">Team: {item.teamname}</div>
                              {item.meetingstarttime && (
                                <div className="text-blue-600 text-xs">
                                  {item.meetingstarttime}
                                  {item.meetingendtime && ` - ${item.meetingendtime}`}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                    })}

                    {timeSlots.map((slot) => {
                      return (
                        <div key={slot.hour} className="h-14 border-b border-gray-200/50 relative">
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
