"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle, Mail, Clock, Users } from "lucide-react"

const AddItemModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("activity")
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

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
      timelineTitle: "",
      timelineStartDate: "",
      timelineEndDate: "",
      timelineStartTime: "",
      timelineEndTime: "",
    },
  ])

  // Team form state
  const [team, setTeam] = useState({
    teamName: "",
    teamDescription: "",
    teamStartWorkingHour: "09:00",
    teamEndWorkingHour: "17:00",
  })

  // Team meetings for team
  const [meetings, setMeetings] = useState([
    {
      meetingTitle: "",
      meetingDescription: "",
      meetingDate: "",
      meetingStartTime: "",
      meetingEndTime: "",
      invitedEmails: [""],
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

  // Handle team form changes
  const handleTeamChange = (e) => {
    const { name, value } = e.target
    setTeam({
      ...team,
      [name]: value,
    })
  }

  // Handle meeting changes
  const handleMeetingChange = (index, e) => {
    const { name, value } = e.target
    const updatedMeetings = [...meetings]
    updatedMeetings[index] = {
      ...updatedMeetings[index],
      [name]: value,
    }
    setMeetings(updatedMeetings)
  }

  // Handle invited email changes
  const handleInvitedEmailChange = (meetingIndex, emailIndex, value) => {
    const updatedMeetings = [...meetings]
    updatedMeetings[meetingIndex].invitedEmails[emailIndex] = value
    setMeetings(updatedMeetings)
  }

  // Add new timeline
  const addTimeline = () => {
    setTimelines([
      ...timelines,
      {
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

  // Add new meeting
  const addMeeting = () => {
    setMeetings([
      ...meetings,
      {
        meetingTitle: "",
        meetingDescription: "",
        meetingDate: "",
        meetingStartTime: "",
        meetingEndTime: "",
        invitedEmails: [""],
      },
    ])
  }

  // Remove meeting
  const removeMeeting = (index) => {
    if (meetings.length > 1) {
      const updatedMeetings = [...meetings]
      updatedMeetings.splice(index, 1)
      setMeetings(updatedMeetings)
    }
  }

  // Add email to meeting
  const addEmailToMeeting = (meetingIndex) => {
    const updatedMeetings = [...meetings]
    updatedMeetings[meetingIndex].invitedEmails.push("")
    setMeetings(updatedMeetings)
  }

  // Remove email from meeting
  const removeEmailFromMeeting = (meetingIndex, emailIndex) => {
    const updatedMeetings = [...meetings]
    if (updatedMeetings[meetingIndex].invitedEmails.length > 1) {
      updatedMeetings[meetingIndex].invitedEmails.splice(emailIndex, 1)
      setMeetings(updatedMeetings)
    }
  }

  // Check for activity overlaps
  const checkActivityOverlaps = (newActivity) => {
    if (!newActivity.activityStartTime || !newActivity.activityEndTime) {
      return []
    }

    const newStart = new Date(`${newActivity.activityDate}T${newActivity.activityStartTime}`)
    const newEnd = new Date(`${newActivity.activityDate}T${newActivity.activityEndTime}`)

    const overlaps = []

    // Check against existing activities
    activities.forEach((existingActivity) => {
      if (existingActivity.activitydate !== newActivity.activityDate) return
      if (!existingActivity.activitystarttime || !existingActivity.activityendtime) return

      const existingStart = new Date(`${existingActivity.activitydate}T${existingActivity.activitystarttime}`)
      const existingEnd = new Date(`${existingActivity.activitydate}T${existingActivity.activityendtime}`)

      // Check for any intersection (not just exact overlap)
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
          // Check if timeline spans the activity date
          const timelineStart = new Date(timeline.timelinestartdate)
          const timelineEnd = new Date(timeline.timelineenddate)
          const activityDate = new Date(newActivity.activityDate)

          if (activityDate >= timelineStart && activityDate <= timelineEnd) {
            // If timeline has specific times, check for time overlap
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
              // If no specific times, consider it overlapping for the whole day
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

  // Check for goal timeline overlaps
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

      // Check if activity date falls within timeline range
      if (activityDate >= newStart && activityDate <= newEnd) {
        // If timeline has specific times and activity has times, check for time overlap
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
          // If no specific times, consider it overlapping
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

    // Check against other goal timelines
    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((timeline) => {
          const existingStart = new Date(timeline.timelinestartdate)
          const existingEnd = new Date(timeline.timelineenddate)

          // Check for date range overlap
          if (newStart <= existingEnd && newEnd >= existingStart) {
            overlaps.push({
              type: "goal",
              title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
              time: timeline.timelinestarttime
                ? `${timeline.timelinestarttime} - ${timeline.timelineendtime}`
                : "All day",
              date: `${timeline.timelinestartdate} to ${timeline.timelineenddate}`,
            })
          }
        })
      }
    })

    // Check against team meetings
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          const meetingDate = new Date(meeting.meetingdate)

          // Check if meeting date falls within timeline range
          if (meetingDate >= newStart && meetingDate <= newEnd) {
            // If timeline has specific times and meeting has times, check for time overlap
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
              // If no specific times, consider it overlapping
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

  // Check for meeting overlaps
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

    // Check against other team meetings
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
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

    // Check if at least one timeline has title and dates
    const validTimeline = timelines.some(
      (timeline) => timeline.timelineTitle.trim() && timeline.timelineStartDate && timeline.timelineEndDate,
    )

    if (!validTimeline) {
      setApiError("At least one timeline with title, start date, and end date is required")
      return false
    }

    return true
  }

  // Validate team form
  const validateTeamForm = () => {
    if (!team.teamName.trim()) {
      setApiError("Team name is required")
      return false
    }

    // Check if at least one meeting has title and date
    const validMeeting = meetings.some((meeting) => meeting.meetingTitle.trim() && meeting.meetingDate)

    if (!validMeeting) {
      setApiError("At least one meeting with title and date is required")
      return false
    }

    // Validate invited emails
    for (let i = 0; i < meetings.length; i++) {
      const meeting = meetings[i]
      if (meeting.meetingTitle.trim() && meeting.meetingDate) {
        const validEmails = meeting.invitedEmails.filter((email) => email.trim() && email.includes("@"))
        if (validEmails.length === 0) {
          setApiError(`Meeting "${meeting.meetingTitle}" must have at least one valid email address`)
          return false
        }
      }
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
      if (activeTab === "activity") {
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
          userId: getUserId(),
          activityTitle: activity.activityTitle,
          activityDescription: activity.activityDescription,
          activityCategory: activity.activityCategory,
          activityUrgency: activity.activityUrgency,
          activityDate: activity.activityDate,
          activityStartTime: activity.activityStartTime,
          activityEndTime: activity.activityEndTime,
        }

        // Make API call to create activity
        const response = await fetch("http://localhost:5000/api/activities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activityData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Activity created successfully:", data)
          setSuccessMessage("Activity created successfully!")

          // Reset form
          setActivity({
            activityTitle: "",
            activityDescription: "",
            activityCategory: "",
            activityUrgency: "medium",
            activityDate: "",
            activityStartTime: "",
            activityEndTime: "",
          })

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 2000)
        } else {
          console.error("Failed to create activity:", data)
          setApiError(data.message || "Failed to create activity. Please try again.")
        }
      } else if (activeTab === "goal") {
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
          userId: getUserId(),
          goalTitle: goal.goalTitle,
          goalDescription: goal.goalDescription,
          goalCategory: goal.goalCategory,
          goalProgress: goal.goalProgress,
          timelines: timelines.map((timeline) => ({
            timelineTitle: timeline.timelineTitle,
            timelineStartDate: timeline.timelineStartDate,
            timelineEndDate: timeline.timelineEndDate,
            timelineStartTime: timeline.timelineStartTime,
            timelineEndTime: timeline.timelineEndTime,
          })),
        }

        // Make API call to create goal
        const response = await fetch("http://localhost:5000/api/goals", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(goalData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Goal created successfully:", data)
          setSuccessMessage("Goal created successfully!")

          // Reset form
          setGoal({
            goalTitle: "",
            goalDescription: "",
            goalCategory: "",
            goalProgress: "not-started",
          })

          setTimelines([
            {
              timelineTitle: "",
              timelineStartDate: "",
              timelineEndDate: "",
              timelineStartTime: "",
              timelineEndTime: "",
            },
          ])

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 2000)
        } else {
          console.error("Failed to create goal:", data)
          setApiError(data.message || "Failed to create goal. Please try again.")
        }
      } else {
        // Validate team form
        if (!validateTeamForm()) {
          setIsLoading(false)
          return
        }

        // Check for overlaps in all meetings
        const allMeetingOverlaps = []
        meetings.forEach((meeting, index) => {
          if (
            meeting.meetingTitle.trim() &&
            meeting.meetingDate &&
            meeting.meetingStartTime &&
            meeting.meetingEndTime
          ) {
            const overlaps = checkMeetingOverlaps(meeting)
            if (overlaps.length > 0) {
              allMeetingOverlaps.push({
                meetingIndex: index + 1,
                meetingTitle: meeting.meetingTitle,
                overlaps: overlaps,
              })
            }
          }
        })

        if (allMeetingOverlaps.length > 0) {
          let overlapMessage = "The following team meetings have intersections:\n\n"
          allMeetingOverlaps.forEach(({ meetingIndex, meetingTitle, overlaps }) => {
            overlapMessage += `Meeting ${meetingIndex} (${meetingTitle}):\n`
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
        
        // Prepare team data for API
        const teamData = {
          createdByUserId: getUserId(),
          teamName: team.teamName,
          teamDescription: team.teamDescription,
          teamStartWorkingHour: team.teamStartWorkingHour,
          teamEndWorkingHour: team.teamEndWorkingHour,
          meetings: meetings
            .filter((meeting) => meeting.meetingTitle.trim() && meeting.meetingDate)
            .map((meeting) => ({
              meetingTitle: meeting.meetingTitle,
              meetingDescription: meeting.meetingDescription,
              meetingDate: meeting.meetingDate,
              meetingStartTime: meeting.meetingStartTime,
              meetingEndTime: meeting.meetingEndTime,
              invitedEmails: meeting.invitedEmails.filter((email) => email.trim() && email.includes("@")),
            })),
        }

        // Make API call to create team
        const response = await fetch("http://localhost:5000/api/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(teamData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Team created successfully:", data)
          setSuccessMessage("Team created successfully!")

          // Reset form
          setTeam({
            teamName: "",
            teamDescription: "",
            teamStartWorkingHour: "09:00",
            teamEndWorkingHour: "17:00",
          })

          setMeetings([
            {
              meetingTitle: "",
              meetingDescription: "",
              meetingDate: "",
              meetingStartTime: "",
              meetingEndTime: "",
              invitedEmails: [""],
            },
          ])

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 2000)
        } else {
          console.error("Failed to create team:", data)
          setApiError(data.message || "Failed to create team. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setApiError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-[#005bc3] border-1 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium flex items-center ${
              activeTab === "activity"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("activity")}
          >
            <Clock size={16} className="mr-2" />
            Activity
          </button>
          <button
            className={`px-6 py-3 font-medium flex items-center ${
              activeTab === "goal" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("goal")}
          >
            <CheckCircle size={16} className="mr-2" />
            Goal
          </button>
          <button
            className={`px-6 py-3 font-medium flex items-center ${
              activeTab === "team" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("team")}
          >
            <Users size={16} className="mr-2" />
            Team
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
          {activeTab === "activity" ? (
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
                  {isLoading ? "Adding..." : "Add Activity"}
                </button>
              </div>
            </form>
          ) : activeTab === "goal" ? (
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
                  <div key={index} className="border rounded-md p-4 mb-4 bg-gray-100">
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
                  {isLoading ? "Adding..." : "Add Goal"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                  <input
                    type="text"
                    name="teamName"
                    value={team.teamName}
                    onChange={handleTeamChange}
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="teamDescription"
                    value={team.teamDescription}
                    onChange={handleTeamChange}
                    rows="3"
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Working Hour</label>
                  <input
                    type="time"
                    name="teamStartWorkingHour"
                    value={team.teamStartWorkingHour}
                    onChange={handleTeamChange}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Working Hour</label>
                  <input
                    type="time"
                    name="teamEndWorkingHour"
                    value={team.teamEndWorkingHour}
                    onChange={handleTeamChange}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-800">Team Meetings</h3>
                  <button
                    type="button"
                    onClick={addMeeting}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" /> Add Meeting
                  </button>
                </div>

                {meetings.map((meeting, index) => (
                  <div key={index} className="border rounded-md p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Meeting {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeMeeting(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={meetings.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                        <input
                          type="text"
                          name="meetingTitle"
                          value={meeting.meetingTitle}
                          onChange={(e) => handleMeetingChange(index, e)}
                          className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Description</label>
                        <textarea
                          name="meetingDescription"
                          value={meeting.meetingDescription}
                          onChange={(e) => handleMeetingChange(index, e)}
                          rows="2"
                          className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date</label>
                        <input
                          type="date"
                          name="meetingDate"
                          value={meeting.meetingDate}
                          onChange={(e) => handleMeetingChange(index, e)}
                          className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            name="meetingStartTime"
                            value={meeting.meetingStartTime}
                            onChange={(e) => handleMeetingChange(index, e)}
                            className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            name="meetingEndTime"
                            value={meeting.meetingEndTime}
                            onChange={(e) => handleMeetingChange(index, e)}
                            className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Invite Team Members</label>
                        <button
                          type="button"
                          onClick={() => addEmailToMeeting(index)}
                          className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Mail size={12} className="mr-1" /> Add Email
                        </button>
                      </div>

                      {meeting.invitedEmails.map((email, emailIndex) => (
                        <div key={emailIndex} className="flex items-center space-x-2 mb-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => handleInvitedEmailChange(index, emailIndex, e.target.value)}
                            placeholder="Enter email address"
                            className="text-black flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeEmailFromMeeting(index, emailIndex)}
                            className="text-red-500 hover:text-red-700"
                            disabled={meeting.invitedEmails.length === 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                  {isLoading ? "Adding..." : "Add Team"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddItemModal
