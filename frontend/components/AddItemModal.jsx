"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"

const AddItemModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("activity")
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  const [activity, setActivity] = useState({
    activityTitle: "",
    activityDescription: "",
    activityCategory: "",
    activityUrgency: "medium",
    activityDate: "",
    activityStartTime: "",
    activityEndTime: "",
  })

  const [goal, setGoal] = useState({
    goalTitle: "",
    goalDescription: "",
    goalCategory: "",
    goalProgress: "not-started",
  })

  const [timelines, setTimelines] = useState([
    {
      timelineTitle: "",
      timelineStartDate: "",
      timelineEndDate: "",
      timelineStartTime: "",
      timelineEndTime: "",
    },
  ])

  const [team, setTeam] = useState({
    teamName: "",
    teamDescription: "",
    teamStartWorkingHour: "",
    teamEndWorkingHour: "",
  })

  const [meetings, setMeetings] = useState([
    {
      meetingTitle: "",
      meetingDescription: "",
      meetingDate: "",
      meetingStartTime: "",
      meetingEndTime: "",
      invitationType: "mandatory",
      invitedEmails: [""],
      useAIScheduling: false,
      dateRangeStart: "",
      dateRangeEnd: "",
      duration: 60,
      timePreference: "",
    },
  ])

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user.id || null
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
      console.error("Error fetching existing data:", error)
    }
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setApiError("")
      setSuccessMessage("")
      setActivity({
        activityTitle: "",
        activityDescription: "",
        activityCategory: "",
        activityUrgency: "medium",
        activityDate: "",
        activityStartTime: "",
        activityEndTime: "",
      })
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
      setTeam({
        teamName: "",
        teamDescription: "",
        teamStartWorkingHour: "",
        teamEndWorkingHour: "",
      })
      setMeetings([
        {
          meetingTitle: "",
          meetingDescription: "",
          meetingDate: "",
          meetingStartTime: "",
          meetingEndTime: "",
          invitationType: "mandatory",
          invitedEmails: [""],
          useAIScheduling: false,
          dateRangeStart: "",
          dateRangeEnd: "",
          duration: 60,
          timePreference: "",
        },
      ])
    }
  }, [isOpen])

  const handleActivityChange = (e) => {
    const { name, value } = e.target
    setActivity({
      ...activity,
      [name]: value,
    })
  }

  const handleGoalChange = (e) => {
    const { name, value } = e.target
    setGoal({
      ...goal,
      [name]: value,
    })
  }

  const handleTimelineChange = (index, e) => {
    const { name, value } = e.target
    const updatedTimelines = [...timelines]
    updatedTimelines[index] = {
      ...updatedTimelines[index],
      [name]: value,
    }
    setTimelines(updatedTimelines)
  }

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

  const removeTimeline = (index) => {
    if (timelines.length > 1) {
      const updatedTimelines = [...timelines]
      updatedTimelines.splice(index, 1)
      setTimelines(updatedTimelines)
    }
  }

  const handleTeamChange = (e) => {
    const { name, value } = e.target
    setTeam({
      ...team,
      [name]: value,
    })
  }

  const handleMeetingChange = (index, e) => {
    const { name, value } = e.target
    const updatedMeetings = [...meetings]
    updatedMeetings[index] = {
      ...updatedMeetings[index],
      [name]: value,
    }
    setMeetings(updatedMeetings)
  }

  const handleInvitedEmailChange = (meetingIndex, emailIndex, value) => {
    const updatedMeetings = [...meetings]
    updatedMeetings[meetingIndex].invitedEmails[emailIndex] = value
    setMeetings(updatedMeetings)
  }

  const addInvitedEmail = (meetingIndex) => {
    const updatedMeetings = [...meetings]
    updatedMeetings[meetingIndex].invitedEmails.push("")
    setMeetings(updatedMeetings)
  }

  const removeInvitedEmail = (meetingIndex, emailIndex) => {
    const updatedMeetings = [...meetings]
    if (updatedMeetings[meetingIndex].invitedEmails.length > 1) {
      updatedMeetings[meetingIndex].invitedEmails.splice(emailIndex, 1)
      setMeetings(updatedMeetings)
    }
  }

  const addMeeting = () => {
    setMeetings([
      ...meetings,
      {
        meetingTitle: "",
        meetingDescription: "",
        meetingDate: "",
        meetingStartTime: "",
        meetingEndTime: "",
        invitationType: "mandatory",
        invitedEmails: [""],
        useAIScheduling: false,
        dateRangeStart: "",
        dateRangeEnd: "",
        duration: 60,
        timePreference: "",
      },
    ])
  }

  const removeMeeting = (index) => {
    if (meetings.length > 1) {
      const updatedMeetings = [...meetings]
      updatedMeetings.splice(index, 1)
      setMeetings(updatedMeetings)
    }
  }

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

    // Check against other goal timelines
    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((existingTimeline) => {
          const existingStart = new Date(existingTimeline.timelinestartdate)
          const existingEnd = new Date(existingTimeline.timelineenddate)

          if (newStart <= existingEnd && newEnd >= existingStart) {
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

  const validateTeamForm = () => {
    if (!team.teamName.trim()) {
      setApiError("Team name is required")
      return false
    }

    const validMeeting = meetings.some(
      (meeting) =>
        meeting.meetingTitle.trim() && meeting.meetingDate && meeting.invitedEmails.some((email) => email.trim()),
    )

    if (!validMeeting) {
      setApiError("At least one meeting with title, date, and invited emails is required")
      return false
    }

    return true
  }

  const handleAISchedulingForTeam = async (meetingIndex) => {
    setIsLoadingAI(true)
    setApiError("")

    try {
      const meeting = meetings[meetingIndex]

      const validEmails = meeting.invitedEmails.filter((email) => email.trim())
      if (validEmails.length === 0) {
        setApiError("Please add at least one team member email")
        setIsLoadingAI(false)
        return
      }

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
      const allMemberEmails = [currentUser.email, ...validEmails]
      const memberActivities = {}
      const teamMembers = []
      const memberGoals = {}
      const memberTeams = {}

      for (const email of allMemberEmails) {
        try {
          const userResponse = await fetch(`/api/users/by-email/${encodeURIComponent(email)}`)

          if (userResponse.ok) {
            const userData = await userResponse.json()
            const userId = userData.user.userid

            teamMembers.push({
              userid: userId,
              username: userData.user.username,
              email: userData.user.useremail,
            })

            // Get their activities
            const activitiesResponse = await fetch(`/api/activities?userId=${userId}`)
            if (activitiesResponse.ok) {
              const activitiesData = await activitiesResponse.json()

              // Filter activities within date range
              const filteredActivities = activitiesData.activities.filter((activity) => {
                if (!activity.activitydate) return false

                const activityDate = new Date(activity.activitydate)
                const startDate = new Date(meeting.dateRangeStart)
                const endDate = new Date(meeting.dateRangeEnd)

                if (isNaN(activityDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                  console.warn(`Invalid date found for activity: ${activity.activitytitle}`, {
                    activityDate: activity.activitydate,
                    startDate: meeting.dateRangeStart,
                    endDate: meeting.dateRangeEnd,
                  })
                  return false
                }

                const isInRange = activityDate >= startDate && activityDate <= endDate
                return isInRange
              })

              memberActivities[userId] = filteredActivities
            } else {
              console.warn(`Failed to fetch activities for ${userData.user.username}`)
              memberActivities[userId] = []
            }

            // Get their goals with timelines
            const goalsResponse = await fetch(`/api/goals?userId=${userId}`)
            if (goalsResponse.ok) {
              const goalsData = await goalsResponse.json()

              // Filter goal timelines within date range
              const filteredGoals = goalsData.goals
                .map((goal) => ({
                  ...goal,
                  timelines: goal.timelines.filter((timeline) => {
                    if (!timeline.timelinestartdate || !timeline.timelineenddate) return false

                    const timelineStart = new Date(timeline.timelinestartdate)
                    const timelineEnd = new Date(timeline.timelineenddate)
                    const rangeStart = new Date(meeting.dateRangeStart)
                    const rangeEnd = new Date(meeting.dateRangeEnd)

                    if (
                      isNaN(timelineStart.getTime()) ||
                      isNaN(timelineEnd.getTime()) ||
                      isNaN(rangeStart.getTime()) ||
                      isNaN(rangeEnd.getTime())
                    ) {
                      console.warn(`Invalid date in timeline: ${timeline.timelinetitle}`)
                      return false
                    }

                    const overlaps = timelineStart <= rangeEnd && timelineEnd >= rangeStart
                    return overlaps
                  }),
                }))
                .filter((goal) => goal.timelines.length > 0)

              memberGoals[userId] = filteredGoals
            } else {
              console.warn(`Failed to fetch goals for ${userData.user.username}`)
              memberGoals[userId] = []
            }

            // Get their team meetings
            const teamsResponse = await fetch(`/api/teams?userId=${userId}`)
            if (teamsResponse.ok) {
              const teamsData = await teamsResponse.json()
              // Extract all meetings within date range
              const allMeetings = []
              teamsData.teams.forEach((team) => {
                team.meetings.forEach((teamMeeting) => {
                  const meetingDate = new Date(teamMeeting.meetingdate)
                  const startDate = new Date(meeting.dateRangeStart)
                  const endDate = new Date(meeting.dateRangeEnd)
                  if (meetingDate >= startDate && meetingDate <= endDate) {
                    allMeetings.push(teamMeeting)
                  }
                })
              })
              memberTeams[userId] = allMeetings
            } else {
              memberTeams[userId] = []
            }
          } else {
            console.warn(`User not found for email: ${email}`)
            // Add as unknown user for AI analysis
            teamMembers.push({
              userid: `unknown_${email}`,
              username: email.split("@")[0],
              email: email,
            })
            memberActivities[`unknown_${email}`] = []
            memberGoals[`unknown_${email}`] = []
            memberTeams[`unknown_${email}`] = []
          }
        } catch (error) {
          console.error(`Error fetching data for ${email}:`, error)
          // Add as unknown user with empty data
          teamMembers.push({
            userid: `unknown_${email}`,
            username: email.split("@")[0],
            email: email,
          })
          memberActivities[`unknown_${email}`] = []
          memberGoals[`unknown_${email}`] = []
          memberTeams[`unknown_${email}`] = []
        }
      }

      const allMemberSchedules = {}
      Object.keys(memberActivities).forEach((userId) => {
        allMemberSchedules[userId] = {
          activities: memberActivities[userId] || [],
          goals: memberGoals[userId] || [],
          meetings: memberTeams[userId] || [],
        }
      })

      if (!meeting.dateRangeStart || !meeting.dateRangeEnd) {
        setApiError("Please specify both start and end dates for the meeting range")
        setIsLoadingAI(false)
        return
      }

      const startDate = new Date(meeting.dateRangeStart)
      const endDate = new Date(meeting.dateRangeEnd)
      if (startDate > endDate) {
        setApiError("End date must be after start date")
        setIsLoadingAI(false)
        return
      }

      const aiService = (await import("../services/aiService.js")).default
      const result = await aiService.findOptimalMeetingTimes(
        teamMembers,
        {
          startDate: meeting.dateRangeStart,
          endDate: meeting.dateRangeEnd,
        },
        meeting.duration,
        {
          start: team.teamStartWorkingHour || "09:00",
          end: team.teamEndWorkingHour || "17:00",
        },
        meeting.timePreference,
        allMemberSchedules,
      )

      if (result.success) {
        setAiSuggestions(result.suggestions)
        setSelectedSuggestion(null)
        setShowAISuggestions(true)
      } else {
        setApiError(result.error || "Failed to generate meeting suggestions")
      }
    } catch (error) {
      console.error("Error in AI scheduling:", error)
      setApiError("Failed to generate meeting suggestions: " + error.message)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const selectAISuggestionForTeam = (suggestion, meetingIndex) => {
    setSelectedSuggestion(suggestion)
    const updatedMeetings = [...meetings]
    updatedMeetings[meetingIndex] = {
      ...updatedMeetings[meetingIndex],
      meetingDate: suggestion.date,
      meetingStartTime: suggestion.startTime,
      meetingEndTime: suggestion.endTime,
    }
    setMeetings(updatedMeetings)
    setShowAISuggestions(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (activeTab === "activity") {
        if (!validateActivityForm()) {
          setIsLoading(false)
          return
        }

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

        const response = await fetch(`/api/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activityData),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccessMessage("Activity created successfully!")
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to create activity:", data)
          setApiError(data.message || "Failed to create activity. Please try again.")
        }
      } else if (activeTab === "goal") {
        if (!validateGoalForm()) {
          setIsLoading(false)
          return
        }

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

        const response = await fetch(`/api/goals`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(goalData),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccessMessage("Goal created successfully!")
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to create goal:", data)
          setApiError(data.message || "Failed to create goal. Please try again.")
        }
      } else if (activeTab === "team") {
        if (!validateTeamForm()) {
          setIsLoading(false)
          return
        }

        const teamData = {
          createdByUserId: getUserId(),
          teamName: team.teamName,
          teamDescription: team.teamDescription,
          teamStartWorkingHour: team.teamStartWorkingHour,
          teamEndWorkingHour: team.teamEndWorkingHour,
          meetings: meetings.map((meeting) => ({
            meetingTitle: meeting.meetingTitle,
            meetingDescription: meeting.meetingDescription,
            meetingDate: meeting.meetingDate,
            meetingStartTime: meeting.meetingStartTime,
            meetingEndTime: meeting.meetingEndTime,
            invitationType: meeting.invitationType,
            invitedEmails: meeting.invitedEmails.filter((email) => email.trim()),
          })),
        }

        const response = await fetch(`/api/teams`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(teamData),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccessMessage("Team created successfully!")
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to create team:", data)
          setApiError(data.message || "Failed to create team. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setApiError("Network error. Please check your connection and try again.")
    } finally {
      window.dispatchEvent(new CustomEvent("refreshCalendarData"))
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-gray-300 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Add New Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "activity"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "goal" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("goal")}
          >
            Goal
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "team" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("team")}
          >
            Team
          </button>
        </div>

        {/* Status messages */}
        {apiError && (
          <div className="mx-6 mt-4 flex items-center p-3 bg-red-900 bg-opacity-50 border border-red-700 text-red-300 rounded">
            <AlertCircle size={18} className="mr-2" />
            {apiError}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 flex items-center p-3 bg-green-900 bg-opacity-50 border border-green-700 text-green-300 rounded">
            <CheckCircle size={18} className="mr-2" />
            {successMessage}
          </div>
        )}

        {/* Form content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "activity" && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Activity Title</label>
                  <input
                    type="text"
                    name="activityTitle"
                    value={activity.activityTitle}
                    onChange={handleActivityChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    name="activityDescription"
                    value={activity.activityDescription}
                    onChange={handleActivityChange}
                    rows="3"
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select
                    name="activityCategory"
                    value={activity.activityCategory}
                    onChange={handleActivityChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-400 mb-1">Urgency</label>
                  <select
                    name="activityUrgency"
                    value={activity.activityUrgency}
                    onChange={handleActivityChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    name="activityDate"
                    value={activity.activityDate}
                    onChange={handleActivityChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="activityStartTime"
                      value={activity.activityStartTime}
                      onChange={handleActivityChange}
                      className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                    <input
                      type="time"
                      name="activityEndTime"
                      value={activity.activityEndTime}
                      onChange={handleActivityChange}
                      className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Activity"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "goal" && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Goal Title</label>
                  <input
                    type="text"
                    name="goalTitle"
                    value={goal.goalTitle}
                    onChange={handleGoalChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    name="goalDescription"
                    value={goal.goalDescription}
                    onChange={handleGoalChange}
                    rows="3"
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select
                    name="goalCategory"
                    value={goal.goalCategory}
                    onChange={handleGoalChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    <option value="career">Career</option>
                    <option value="personal">Personal</option>
                    <option value="health">Health</option>
                    <option value="education">Education</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Progress</label>
                  <select
                    name="goalProgress"
                    value={goal.goalProgress}
                    onChange={handleGoalChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <h3 className="text-lg font-medium text-white">Timelines</h3>
                  <button
                    type="button"
                    onClick={addTimeline}
                    className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" /> Add Timeline
                  </button>
                </div>

                {timelines.map((timeline, index) => (
                  <div key={index} className="border border-gray-700 rounded-md p-4 mb-4 bg-gray-900">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Timeline {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeTimeline(index)}
                        className="text-red-400 hover:text-red-300"
                        disabled={timelines.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input
                          type="text"
                          name="timelineTitle"
                          value={timeline.timelineTitle}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                        <input
                          type="date"
                          name="timelineStartDate"
                          value={timeline.timelineStartDate}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                        <input
                          type="date"
                          name="timelineEndDate"
                          value={timeline.timelineEndDate}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                        <input
                          type="time"
                          name="timelineStartTime"
                          value={timeline.timelineStartTime}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                        <input
                          type="time"
                          name="timelineEndTime"
                          value={timeline.timelineEndTime}
                          onChange={(e) => handleTimelineChange(index, e)}
                          className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Goal"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "team" && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Team Name</label>
                  <input
                    type="text"
                    name="teamName"
                    value={team.teamName}
                    onChange={handleTeamChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <textarea
                    name="teamDescription"
                    value={team.teamDescription}
                    onChange={handleTeamChange}
                    rows="3"
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Start Working Hour</label>
                  <input
                    type="time"
                    name="teamStartWorkingHour"
                    value={team.teamStartWorkingHour}
                    onChange={handleTeamChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">End Working Hour</label>
                  <input
                    type="time"
                    name="teamEndWorkingHour"
                    value={team.teamEndWorkingHour}
                    onChange={handleTeamChange}
                    className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-white">Meetings</h3>
                  <button
                    type="button"
                    onClick={addMeeting}
                    className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                  >
                    <Plus size={16} className="mr-1" /> Add Meeting
                  </button>
                </div>

                {meetings.map((meeting, meetingIndex) => (
                  <div key={meetingIndex} className="border border-gray-700 rounded-md p-4 mb-4 bg-gray-900">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-white">Meeting {meetingIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeMeeting(meetingIndex)}
                        className="text-red-400 hover:text-red-300"
                        disabled={meetings.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Meeting Title</label>
                        <input
                          type="text"
                          name="meetingTitle"
                          value={meeting.meetingTitle}
                          onChange={(e) => handleMeetingChange(meetingIndex, e)}
                          className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* AI Scheduling Toggle */}
                      <div className="col-span-2 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`useAIScheduling-${meetingIndex}`}
                          checked={meeting.useAIScheduling}
                          onChange={(e) => {
                            const updatedMeetings = [...meetings]
                            updatedMeetings[meetingIndex].useAIScheduling = e.target.checked
                            setMeetings(updatedMeetings)
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`useAIScheduling-${meetingIndex}`} className="text-sm text-gray-300">
                          Use AI to find optimal meeting time
                        </label>
                      </div>

                      {meeting.useAIScheduling ? (
                        // AI Scheduling Form
                        <div className="col-span-2 border border-blue-800 rounded p-3 bg-blue-950 bg-opacity-20">
                          <h5 className="text-sm font-medium text-blue-300 mb-3">AI Meeting Scheduler</h5>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">
                                Team Members (Emails)
                              </label>
                              {meeting.invitedEmails.map((email, emailIndex) => (
                                <div key={emailIndex} className="flex items-center mb-2">
                                  <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => handleInvitedEmailChange(meetingIndex, emailIndex, e.target.value)}
                                    placeholder="Enter email address"
                                    className="text-white bg-gray-700 flex-1 p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeInvitedEmail(meetingIndex, emailIndex)}
                                    className="ml-2 text-red-400 hover:text-red-300"
                                    disabled={meeting.invitedEmails.length === 1}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addInvitedEmail(meetingIndex)}
                                className="flex items-center text-xs text-blue-400 hover:text-blue-300"
                              >
                                <Plus size={12} className="mr-1" /> Add Member Email
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={meeting.dateRangeStart}
                                  onChange={(e) => {
                                    const updatedMeetings = [...meetings]
                                    updatedMeetings[meetingIndex].dateRangeStart = e.target.value
                                    setMeetings(updatedMeetings)
                                  }}
                                  className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={meeting.dateRangeEnd}
                                  onChange={(e) => {
                                    const updatedMeetings = [...meetings]
                                    updatedMeetings[meetingIndex].dateRangeEnd = e.target.value
                                    setMeetings(updatedMeetings)
                                  }}
                                  className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Duration (minutes)</label>
                                <select
                                  value={meeting.duration}
                                  onChange={(e) => {
                                    const updatedMeetings = [...meetings]
                                    updatedMeetings[meetingIndex].duration = Number.parseInt(e.target.value)
                                    setMeetings(updatedMeetings)
                                  }}
                                  className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value={30}>30 minutes</option>
                                  <option value={60}>1 hour</option>
                                  <option value={90}>1.5 hours</option>
                                  <option value={120}>2 hours</option>
                                  <option value={180}>3 hours</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Invitation Type</label>
                                <select
                                  name="invitationType"
                                  value={meeting.invitationType}
                                  onChange={(e) => handleMeetingChange(meetingIndex, e)}
                                  className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="mandatory">Mandatory (Auto-assign)</option>
                                  <option value="request">Request (Can accept/decline)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Time Preference</label>
                              <input
                                type="text"
                                value={meeting.timePreference}
                                onChange={(e) => {
                                  const updatedMeetings = [...meetings]
                                  updatedMeetings[meetingIndex].timePreference = e.target.value
                                  setMeetings(updatedMeetings)
                                }}
                                placeholder="e.g., morning, afternoon"
                                className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAISchedulingForTeam(meetingIndex)}
                              disabled={
                                isLoadingAI ||
                                !meeting.dateRangeStart ||
                                !meeting.dateRangeEnd ||
                                !meeting.invitedEmails.some((email) => email.trim())
                              }
                              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm text-white flex items-center justify-center"
                            >
                              {isLoadingAI ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                  Analyzing...
                                </>
                              ) : (
                                "Find Best Meeting Times"
                              )}
                            </button>

                            {selectedSuggestion && (
                              <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded p-2">
                                <p className="text-green-300 text-sm">
                                  Selected: {selectedSuggestion.date} at {selectedSuggestion.startTime} -{" "}
                                  {selectedSuggestion.endTime}
                                </p>
                                <p className="text-green-400 text-xs">{selectedSuggestion.reasoning}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Manual Scheduling Form
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                            <input
                              type="date"
                              name="meetingDate"
                              value={meeting.meetingDate}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Invitation Type</label>
                            <select
                              name="invitationType"
                              value={meeting.invitationType}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="mandatory">Mandatory (Auto-assign)</option>
                              <option value="request">Request (Can accept/decline)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                            <input
                              type="time"
                              name="meetingStartTime"
                              value={meeting.meetingStartTime}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">End Time</label>
                            <input
                              type="time"
                              name="meetingEndTime"
                              value={meeting.meetingEndTime}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-white bg-gray-700 w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="col-span-2">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium text-gray-400">Invited Emails</label>
                              <button
                                type="button"
                                onClick={() => addInvitedEmail(meetingIndex)}
                                className="flex items-center text-xs text-blue-400 hover:text-blue-300"
                              >
                                <Plus size={12} className="mr-1" /> Add Email
                              </button>
                            </div>

                            {meeting.invitedEmails.map((email, emailIndex) => (
                              <div key={emailIndex} className="flex items-center mb-2">
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => handleInvitedEmailChange(meetingIndex, emailIndex, e.target.value)}
                                  placeholder="Enter email address"
                                  className="text-white bg-gray-700 flex-1 p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => removeInvitedEmail(meetingIndex, emailIndex)}
                                  className="ml-2 text-red-400 hover:text-red-300"
                                  disabled={meeting.invitedEmails.length === 1}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* AI Suggestions Modal */}
                {showAISuggestions && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto relative">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">AI Meeting Suggestions</h3>
                        <button 
                          onClick={() => setShowAISuggestions(false)} 
                          className="text-gray-400 hover:text-white"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      {aiSuggestions.length > 0 ? (
                        <div className="space-y-3">
                          {aiSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="border border-gray-600 rounded p-3 hover:border-blue-500 cursor-pointer transition-colors"
                              onClick={() => selectAISuggestionForTeam(suggestion, 0)} // Assuming first meeting for now
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-white">
                                    {suggestion.date} • {suggestion.startTime} - {suggestion.endTime}
                                  </h4>
                                  <div className="flex items-center mt-1">
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${
                                        suggestion.score >= 90
                                          ? "bg-green-900 text-green-300"
                                          : suggestion.score >= 70
                                            ? "bg-yellow-900 text-yellow-300"
                                            : "bg-red-900 text-red-300"
                                      }`}
                                    >
                                      Score: {suggestion.score}/100
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">{suggestion.reasoning}</p>
                              {suggestion.advantages && suggestion.advantages.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.advantages.map((advantage, i) => (
                                    <span key={i} className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
                                      {advantage}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">
                          No suitable meeting times found. Try adjusting your preferences.
                        </p>
                      )}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setShowAISuggestions(false)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-700 mr-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Team"}
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
