"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"

const EditItemModal = ({ isOpen, onClose, item }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // State for existing data to check overlaps
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])

  // Activity form state
  const [activity, setActivity] = useState({
    activityTitle: "",
    activityDescription: "",
    activityCategory: "",
    activityUrgency: "medium",
    activityDate: "",
    activityStartTime: "",
    activityEndTime: "",
  })

  // Goal form state
  const [goal, setGoal] = useState({
    goalTitle: "",
    goalDescription: "",
    goalCategory: "",
    goalProgress: "not-started",
  })

  // Timeline entries for goal
  const [timelines, setTimelines] = useState([
    {
      timelineId: null,
      timelineTitle: "",
      timelineStartDate: "",
      timelineEndDate: "",
      timelineStartTime: "",
      timelineEndTime: "",
    },
  ])

  // Get user ID from localStorage
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user.id || 1
  }

  // Fetch existing data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingData()
    }
  }, [isOpen])

  const fetchExistingData = async () => {
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
      console.error("Error fetching existing data:", error)
    }
  }

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      if (item.type === "activity") {
        setActivity({
          activityTitle: item.activitytitle || "",
          activityDescription: item.activitydescription || "",
          activityCategory: item.activitycategory || "",
          activityUrgency: item.activityurgency || "medium",
          activityDate: item.activitydate || "",
          activityStartTime: item.activitystarttime || "",
          activityEndTime: item.activityendtime || "",
        })
      } else if (item.type === "goal") {
        setGoal({
          goalTitle: item.goaltitle || "",
          goalDescription: item.goaldescription || "",
          goalCategory: item.goalcategory || "",
          goalProgress: item.goalprogress || "not-started",
        })

        if (item.timelines && item.timelines.length > 0) {
          setTimelines(
            item.timelines.map((timeline) => ({
              timelineId: timeline.timelineid,
              timelineTitle: timeline.timelinetitle || "",
              timelineStartDate: timeline.timelinestartdate || "",
              timelineEndDate: timeline.timelineenddate || "",
              timelineStartTime: timeline.timelinestarttime || "",
              timelineEndTime: timeline.timelineendtime || "",
            })),
          )
        }
      }
    }
  }, [item])

  // Handle activity form changes
  const handleActivityChange = (e) => {
    const { name, value } = e.target
    setActivity({
      ...activity,
      [name]: value,
    })
  }

  // Handle goal form changes
  const handleGoalChange = (e) => {
    const { name, value } = e.target
    setGoal({
      ...goal,
      [name]: value,
    })
  }

  // Handle timeline changes
  const handleTimelineChange = (index, e) => {
    const { name, value } = e.target
    const updatedTimelines = [...timelines]
    updatedTimelines[index] = {
      ...updatedTimelines[index],
      [name]: value,
    }
    setTimelines(updatedTimelines)
  }
  
  const handleDeleteGoal = async () => {
    if (!item || item.type !== 'goal') return

    if (!window.confirm("Are you sure you want to delete this goal and all its timelines? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    setApiError("")
    setSuccessMessage("")

    try {
      const response = await fetch(`http://localhost:5000/api/goals/${item.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccessMessage("Goal deleted successfully!");
        // Notify other components to refresh data
        window.dispatchEvent(new CustomEvent("refreshCalendarData"))
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        const data = await response.json()
        setApiError(data.message || "Failed to delete goal.")
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
      setApiError("A network error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Add new timeline
  const addTimeline = () => {
    setTimelines([
      ...timelines,
      {
        timelineId: null,
        timelineTitle: "",
        timelineStartDate: "",
        timelineEndDate: "",
        timelineStartTime: "",
        timelineEndTime: "",
      },
    ])
  }

  // Remove timeline
  const removeTimeline = (index) => {
    if (timelines.length > 1) {
      const updatedTimelines = [...timelines]
      updatedTimelines.splice(index, 1)
      setTimelines(updatedTimelines)
    }
  }

  // Check for activity overlaps (excluding current item)
  const checkActivityOverlaps = (newActivity) => {
    if (!newActivity.activityStartTime || !newActivity.activityEndTime) {
      return []
    }

    const newStart = new Date(`${newActivity.activityDate}T${newActivity.activityStartTime}`)
    const newEnd = new Date(`${newActivity.activityDate}T${newActivity.activityEndTime}`)

    const overlaps = []

    // Check against existing activities (excluding current one)
    activities.forEach((existingActivity) => {
      if (existingActivity.activityid === item.id) return // Skip current item
      if (existingActivity.activitydate !== newActivity.activityDate) return
      if (!existingActivity.activitystarttime || !existingActivity.activityendtime) return

      const existingStart = new Date(`${existingActivity.activitydate}T${existingActivity.activitystarttime}`)
      const existingEnd = new Date(`${existingActivity.activitydate}T${existingActivity.activityendtime}`)

      if (newStart < existingEnd && newEnd > existingStart) {
        overlaps.push({
          type: "activity",
          title: existingActivity.activitytitle,
          time: `${existingActivity.activitystarttime} - ${existingActivity.activityendtime}`,
        })
      }
    })

    // Check against goal timelines
    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((timeline) => {
          const timelineStart = new Date(timeline.timelinestartdate)
          const timelineEnd = new Date(timeline.timelineenddate)
          const activityDate = new Date(newActivity.activityDate)

          if (activityDate >= timelineStart && activityDate <= timelineEnd) {
            if (timeline.timelinestarttime && timeline.timelineendtime) {
              const timelineStartTime = new Date(`${newActivity.activityDate}T${timeline.timelinestarttime}`)
              const timelineEndTime = new Date(`${newActivity.activityDate}T${timeline.timelineendtime}`)

              if (newStart < timelineEndTime && newEnd > timelineStartTime) {
                overlaps.push({
                  type: "goal",
                  title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                  time: `${timeline.timelinestarttime} - ${timeline.timelineendtime}`,
                })
              }
            } else {
              overlaps.push({
                type: "goal",
                title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                time: "All day",
              })
            }
          }
        })
      }
    })

    // Check against team meetings
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          if (meeting.meetingdate !== newActivity.activityDate) return
          if (!meeting.meetingstarttime || !meeting.meetingendtime) return

          const meetingStart = new Date(`${meeting.meetingdate}T${meeting.meetingstarttime}`)
          const meetingEnd = new Date(`${meeting.meetingdate}T${meeting.meetingendtime}`)

          if (newStart < meetingEnd && newEnd > meetingStart) {
            overlaps.push({
              type: "meeting",
              title: meeting.meetingtitle,
              time: `${meeting.meetingstarttime} - ${meeting.meetingendtime}`,
            })
          }
        })
      }
    })

    return overlaps
  }

  // Check for goal timeline overlaps (excluding current item)
  const checkGoalTimelineOverlaps = (newTimeline) => {
    const overlaps = []

    if (!newTimeline.timelineStartDate || !newTimeline.timelineEndDate) {
      return overlaps
    }

    const newStart = new Date(newTimeline.timelineStartDate)
    const newEnd = new Date(newTimeline.timelineEndDate)

    // Check against existing activities
    activities.forEach((activity) => {
      const activityDate = new Date(activity.activitydate)

      if (activityDate >= newStart && activityDate <= newEnd) {
        if (
          newTimeline.timelineStartTime &&
          newTimeline.timelineEndTime &&
          activity.activitystarttime &&
          activity.activityendtime
        ) {
          const timelineStartTime = new Date(`${activity.activitydate}T${newTimeline.timelineStartTime}`)
          const timelineEndTime = new Date(`${activity.activitydate}T${newTimeline.timelineEndTime}`)
          const activityStart = new Date(`${activity.activitydate}T${activity.activitystarttime}`)
          const activityEnd = new Date(`${activity.activitydate}T${activity.activityendtime}`)

          if (timelineStartTime < activityEnd && timelineEndTime > activityStart) {
            overlaps.push({
              type: "activity",
              title: activity.activitytitle,
              time: `${activity.activitystarttime} - ${activity.activityendtime}`,
              date: activity.activitydate,
            })
          }
        } else {
          overlaps.push({
            type: "activity",
            title: activity.activitytitle,
            time: activity.activitystarttime
              ? `${activity.activitystarttime} - ${activity.activityendtime}`
              : "All day",
            date: activity.activitydate,
          })
        }
      }
    })

    // Check against other goal timelines (excluding current goal)
    goals.forEach((goal) => {
      if (goal.goalid === item.id) return // Skip current goal
      if (goal.timelines) {
        goal.timelines.forEach((existingTimeline) => {
          const existingStart = new Date(existingTimeline.timelinestartdate)
          const existingEnd = new Date(existingTimeline.timelineenddate)

          // Check for date range overlap first
          if (newStart <= existingEnd && newEnd >= existingStart) {
            // Only trigger alert if BOTH timelines have specific start and end times
            if (
              newTimeline.timelineStartTime &&
              newTimeline.timelineEndTime &&
              existingTimeline.timelinestarttime &&
              existingTimeline.timelineendtime
            ) {
              const commonDay = new Date(Math.max(newStart.getTime(), existingStart.getTime()))
              const newTimelineStartTime = new Date(`${commonDay.toDateString()} ${newTimeline.timelineStartTime}`)
              const newTimelineEndTime = new Date(`${commonDay.toDateString()} ${newTimeline.timelineEndTime}`)
              const existingTimelineStartTime = new Date(`${commonDay.toDateString()} ${existingTimeline.timelinestarttime}`)
              const existingTimelineEndTime = new Date(`${commonDay.toDateString()} ${existingTimeline.timelineendtime}`)

              // If times overlap, then it's a conflict
              if (newTimelineStartTime < existingTimelineEndTime && newTimelineEndTime > existingTimelineStartTime) {
                overlaps.push({
                  type: "goal",
                  title: `${goal.goaltitle} - ${existingTimeline.timelinetitle}`,
                  time: `${existingTimeline.timelinestarttime} - ${existingTimeline.timelineendtime}`,
                  date: `${existingTimeline.timelinestartdate} to ${existingTimeline.timelineenddate}`,
                })
              }
            }
          }
        })
      }
    })

    // Check against team meetings
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          const meetingDate = new Date(meeting.meetingdate)

          if (meetingDate >= newStart && meetingDate <= newEnd) {
            if (
              newTimeline.timelineStartTime &&
              newTimeline.timelineEndTime &&
              meeting.meetingstarttime &&
              meeting.meetingendtime
            ) {
              const timelineStartTime = new Date(`${meeting.meetingdate}T${newTimeline.timelineStartTime}`)
              const timelineEndTime = new Date(`${meeting.meetingdate}T${newTimeline.timelineEndTime}`)
              const meetingStart = new Date(`${meeting.meetingdate}T${meeting.meetingstarttime}`)
              const meetingEnd = new Date(`${meeting.meetingdate}T${meeting.meetingendtime}`)

              if (timelineStartTime < meetingEnd && timelineEndTime > meetingStart) {
                overlaps.push({
                  type: "meeting",
                  title: meeting.meetingtitle,
                  time: `${meeting.meetingstarttime} - ${meeting.meetingendtime}`,
                  date: meeting.meetingdate,
                })
              }
            } else {
              overlaps.push({
                type: "meeting",
                title: meeting.meetingtitle,
                time: meeting.meetingstarttime ? `${meeting.meetingstarttime} - ${meeting.meetingendtime}` : "All day",
                date: meeting.meetingdate,
              })
            }
          }
        })
      }
    })

    return overlaps
  }

  // Validate activity form
  const validateActivityForm = () => {
    if (!activity.activityTitle.trim()) {
      setApiError("Activity title is required")
      return false
    }
    if (!activity.activityDate) {
      setApiError("Activity date is required")
      return false
    }
    return true
  }

  // Validate goal form
  const validateGoalForm = () => {
    if (!goal.goalTitle.trim()) {
      setApiError("Goal title is required")
      return false
    }

    const validTimeline = timelines.some(
      (timeline) => timeline.timelineTitle.trim() && timeline.timelineStartDate && timeline.timelineEndDate,
    )

    if (!validTimeline) {
      setApiError("At least one timeline with title, start date, and end date is required")
      return false
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (item.type === "activity") {
        // Validate activity form
        if (!validateActivityForm()) {
          setIsLoading(false)
          return
        }
        
        // Check for overlaps
        const overlaps = checkActivityOverlaps(activity)
        if (overlaps.length > 0) {
          const overlapDetails = overlaps
            .map((overlap) => `• ${overlap.title} (${overlap.time}) [${overlap.type}]`)
            .join("\n")

          const confirmOverlap = window.confirm(
            `This activity intersects with the following items:\n\n${overlapDetails}\n\nDo you want to continue?`,
          )
          if (!confirmOverlap) {
            setIsLoading(false)
            return
          }
        }

        // Prepare activity data for API
        const activityData = {
          activityTitle: activity.activityTitle,
          activityDescription: activity.activityDescription,
          activityCategory: activity.activityCategory,
          activityUrgency: activity.activityUrgency,
          activityDate: activity.activityDate,
          activityStartTime: activity.activityStartTime,
          activityEndTime: activity.activityEndTime,
        }

        // Make API call to update activity
        const response = await fetch(`http://localhost:5000/api/activities/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activityData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Activity updated successfully:", data)
          setSuccessMessage("Activity updated successfully!")

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update activity:", data)
          setApiError(data.message || "Failed to update activity. Please try again.")
        }
      } else if (item.type === "goal") {
        // Validate goal form
        if (!validateGoalForm()) {
          setIsLoading(false)
          return
        }
        
        // Check for overlaps in all timelines
        const allOverlaps = []
        timelines.forEach((timeline, index) => {
          if (timeline.timelineTitle.trim() && timeline.timelineStartDate && timeline.timelineEndDate) {
            const overlaps = checkGoalTimelineOverlaps(timeline)
            if (overlaps.length > 0) {
              allOverlaps.push({
                timelineIndex: index + 1,
                timelineTitle: timeline.timelineTitle,
                overlaps: overlaps,
              })
            }
          }
        })

        if (allOverlaps.length > 0) {
          let overlapMessage = "The following goal timelines have intersections:\n\n"
          allOverlaps.forEach(({ timelineIndex, timelineTitle, overlaps }) => {
            overlapMessage += `Timeline ${timelineIndex} (${timelineTitle}):\n`
            overlaps.forEach((overlap) => {
              overlapMessage += `  • ${overlap.title} (${overlap.time}) [${overlap.type}]\n`
            })
            overlapMessage += "\n"
          })
          overlapMessage += "Do you want to continue?"

          const confirmOverlap = window.confirm(overlapMessage)
          if (!confirmOverlap) {
            setIsLoading(false)
            return
          }
        }

        // Prepare goal data for API
        const goalData = {
          goalTitle: goal.goalTitle,
          goalDescription: goal.goalDescription,
          goalCategory: goal.goalCategory,
          goalProgress: goal.goalProgress,
          timelines: timelines.map((timeline) => ({
            timelineId: timeline.timelineId,
            timelineTitle: timeline.timelineTitle,
            timelineStartDate: timeline.timelineStartDate,
            timelineEndDate: timeline.timelineEndDate,
            timelineStartTime: timeline.timelineStartTime,
            timelineEndTime: timeline.timelineEndTime,
          })),
        }

        // Make API call to update goal
        const response = await fetch(`http://localhost:5000/api/goals/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(goalData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Goal updated successfully:", data)
          setSuccessMessage("Goal updated successfully!")

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update goal:", data)
          setApiError(data.message || "Failed to update goal. Please try again.")
        }
      } else if (item.type === "meeting") {
        // Validate meeting form
        if (!item.meetingtitle?.trim()) {
          setApiError("Meeting title is required")
          setIsLoading(false)
          return
        }
        if (!item.meetingdate) {
          setApiError("Meeting date is required")
          setIsLoading(false)
          return
        }

        // Check for overlaps if meeting has times
        if (item.meetingstarttime && item.meetingendtime) {
          const meetingData = {
            meetingDate: item.meetingdate,
            meetingStartTime: item.meetingstarttime,
            meetingEndTime: item.meetingendtime,
          }

          const overlaps = checkMeetingOverlaps(meetingData)
          if (overlaps.length > 0) {
            const overlapDetails = overlaps
              .map((overlap) => `• ${overlap.title} (${overlap.time}) [${overlap.type}]`)
              .join("\n")

            const confirmOverlap = window.confirm(
              `This meeting intersects with the following items:\n\n${overlapDetails}\n\nDo you want to continue?`,
            )
            if (!confirmOverlap) {
              setIsLoading(false)
              return
            }
          }
        }

        // Prepare meeting data for API
        const meetingData = {
          meetingTitle: item.meetingtitle,
          meetingDescription: item.meetingdescription,
          meetingDate: item.meetingdate,
          meetingStartTime: item.meetingstarttime,
          meetingEndTime: item.meetingendtime,
        }

        // Make API call to update meeting
        const response = await fetch(`http://localhost:5000/api/meetings/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(meetingData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Meeting updated successfully:", data)
          setSuccessMessage("Meeting updated successfully!")

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update meeting:", data)
          setApiError(data.message || "Failed to update meeting. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setApiError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Check for meeting overlaps (excluding current item)
  const checkMeetingOverlaps = (newMeeting) => {
    if (!newMeeting.meetingStartTime || !newMeeting.meetingEndTime) {
      return []
    }

    const newStart = new Date(`${newMeeting.meetingDate}T${newMeeting.meetingStartTime}`)
    const newEnd = new Date(`${newMeeting.meetingDate}T${newMeeting.meetingEndTime}`)

    const overlaps = []

    // Check against existing activities
    activities.forEach((activity) => {
      if (activity.activitydate !== newMeeting.meetingDate) return
      if (!activity.activitystarttime || !activity.activityendtime) return

      const activityStart = new Date(`${activity.activitydate}T${activity.activitystarttime}`)
      const activityEnd = new Date(`${activity.activitydate}T${activity.activityendtime}`)

      if (newStart < activityEnd && newEnd > activityStart) {
        overlaps.push({
          type: "activity",
          title: activity.activitytitle,
          time: `${activity.activitystarttime} - ${activity.activityendtime}`,
        })
      }
    })

    // Check against goal timelines
    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((timeline) => {
          const timelineStart = new Date(timeline.timelinestartdate)
          const timelineEnd = new Date(timeline.timelineenddate)
          const meetingDate = new Date(newMeeting.meetingDate)

          if (meetingDate >= timelineStart && meetingDate <= timelineEnd) {
            if (timeline.timelinestarttime && timeline.timelineendtime) {
              const timelineStartTime = new Date(`${newMeeting.meetingDate}T${timeline.timelinestarttime}`)
              const timelineEndTime = new Date(`${newMeeting.meetingDate}T${timeline.timelineendtime}`)

              if (newStart < timelineEndTime && newEnd > timelineStartTime) {
                overlaps.push({
                  type: "goal",
                  title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                  time: `${timeline.timelinestarttime} - ${timeline.timelineendtime}`,
                })
              }
            } else {
              overlaps.push({
                type: "goal",
                title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
                time: "All day",
              })
            }
          }
        })
      }
    })

    // Check against other team meetings (excluding current one)
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          if (meeting.teammeetingid === item.id) return // Skip current meeting
          if (meeting.meetingdate !== newMeeting.meetingDate) return
          if (!meeting.meetingstarttime || !meeting.meetingendtime) return

          const meetingStart = new Date(`${meeting.meetingdate}T${meeting.meetingstarttime}`)
          const meetingEnd = new Date(`${meeting.meetingdate}T${meeting.meetingendtime}`)

          if (newStart < meetingEnd && newEnd > meetingStart) {
            overlaps.push({
              type: "meeting",
              title: meeting.meetingtitle,
              time: `${meeting.meetingstarttime} - ${meeting.meetingendtime}`,
            })
          }
        })
      }
    })

    return overlaps
  }

  const [editingItem, setEditingItem] = useState(item)

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-[#005bc3] border-1 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit {item.type === "activity" ? "Activity" : item.type === "goal" ? "Goal" : "Meeting"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Status messages */}
        {apiError && (
          <div className="mx-6 mt-4 flex items-center p-3 bg-red-100 text-red-700 rounded">
            <AlertCircle size={18} className="mr-2" />
            {apiError}
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 flex items-center p-3 bg-green-100 text-green-700 rounded">
            <CheckCircle size={18} className="mr-2" />
            {successMessage}
          </div>
        )}

        {/* Form content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {item.type === "activity" ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
                  <input
                    type="text"
                    name="activityTitle"
                    value={activity.activityTitle}
                    onChange={handleActivityChange}
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="activityDescription"
                    value={activity.activityDescription}
                    onChange={handleActivityChange}
                    rows="3"
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="activityCategory"
                    value={activity.activityCategory}
                    onChange={handleActivityChange}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="social">Social</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                  <select
                    name="activityUrgency"
                    value={activity.activityUrgency}
                    onChange={handleActivityChange}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="activityDate"
                    value={activity.activityDate}
                    onChange={handleActivityChange}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="activityStartTime"
                      value={activity.activityStartTime}
                      onChange={handleActivityChange}
                      className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      name="activityEndTime"
                      value={activity.activityEndTime}
                      onChange={handleActivityChange}
                      className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Activity"}
                </button>
              </div>
            </form>
          ) : item.type === "goal" ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                  <input
                    type="text"
                    name="goalTitle"
                    value={goal.goalTitle}
                    onChange={handleGoalChange}
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="goalDescription"
                    value={goal.goalDescription}
                    onChange={handleGoalChange}
                    rows="3"
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="goalCategory"
                    value={goal.goalCategory}
                    onChange={handleGoalChange}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    <option value="career">Career</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health & Fitness</option>
                    <option value="education">Education</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                  <select
                    name="goalProgress"
                    value={goal.goalProgress}
                    onChange={handleGoalChange}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-800">Timelines</h3>
                  <button
                    type="button"
                    onClick={addTimeline}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" /> Add Timeline
                  </button>
                </div>

                {timelines.map((timeline, index) => (
                  <div key={index} className="border rounded-md p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Timeline {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeTimeline(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={timelines.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          name="timelineTitle"
                          value={timeline.timelineTitle}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          name="timelineStartDate"
                          value={timeline.timelineStartDate}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          name="timelineEndDate"
                          value={timeline.timelineEndDate}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          name="timelineStartTime"
                          value={timeline.timelineStartTime}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          name="timelineEndTime"
                          value={timeline.timelineEndTime}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-6">
                <div>
                  <button
                    type="button"
                    onClick={handleDeleteGoal}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 flex items-center"
                    disabled={isLoading || isDeleting}
                  >
                    <Trash2 size={16} className="mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Goal"}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 mr-2"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Goal"}
                  </button>
                </div>
              </div>
            </form>
          ) : item.type === "meeting" ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                  <input
                    type="text"
                    value={item.meetingtitle || ""}
                    onChange={(e) => setEditingItem({ ...item, meetingtitle: e.target.value })}
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={item.meetingdescription || ""}
                    onChange={(e) => setEditingItem({ ...item, meetingdescription: e.target.value })}
                    rows="3"
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={item.meetingdate || ""}
                    onChange={(e) => setEditingItem({ ...item, meetingdate: e.target.value })}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={item.meetingstarttime || ""}
                      onChange={(e) => setEditingItem({ ...item, meetingstarttime: e.target.value })}
                      className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={item.meetingendtime || ""}
                      onChange={(e) => setEditingItem({ ...item, meetingendtime: e.target.value })}
                      className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Meeting"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default EditItemModal
