"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"

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

  // AI scheduling state variables
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  // Team form state
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
      // AI Scheduling fields
      useAIScheduling: false,
      dateRangeStart: "",
      dateRangeEnd: "",
      duration: 60,
      timePreference: "",
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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setApiError("")
      setSuccessMessage("")
      // Reset forms
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

  // Add new invited email
  const addInvitedEmail = (meetingIndex) => {
    const updatedMeetings = [...meetings]
    updatedMeetings[meetingIndex].invitedEmails.push("")
    setMeetings(updatedMeetings)
  }

  // Remove invited email
  const removeInvitedEmail = (meetingIndex, emailIndex) => {
    const updatedMeetings = [...meetings]
    if (updatedMeetings[meetingIndex].invitedEmails.length > 1) {
      updatedMeetings[meetingIndex].invitedEmails.splice(emailIndex, 1)
      setMeetings(updatedMeetings)
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

  // Remove meeting
  const removeMeeting = (index) => {
    if (meetings.length > 1) {
      const updatedMeetings = [...meetings]
      updatedMeetings.splice(index, 1)
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

          // Check for date range overlap first
          if (newStart <= existingEnd && newEnd >= existingStart) {
            // Only trigger alert if BOTH timelines have specific start and end times
            if (
              newTimeline.timelineStartTime &&
              newTimeline.timelineEndTime &&
              existingTimeline.timelinestarttime &&
              existingTimeline.timelineendtime
            ) {
              // Find a common day to compare times
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
            // If one or both are "all-day", it's not a direct time conflict, so no alert.
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

  // Validate team form
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

      // Get team members from invited emails
      const validEmails = meeting.invitedEmails.filter((email) => email.trim())
      if (validEmails.length === 0) {
        setApiError("Please add at least one team member email")
        setIsLoadingAI(false)
        return
      }

      // Include creator in the analysis
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}")
      const allMemberEmails = [currentUser.email, ...validEmails]

      // Get user data and activities for all members
      const memberActivities = {}
      const teamMembers = []
      const memberGoals = {}
      const memberTeams = {}

      console.log("Fetching data for members:", allMemberEmails)

      for (const email of allMemberEmails) {
        try {
          // Get user by email
          const userResponse = await fetch(`http://localhost:5000/api/users/by-email/${encodeURIComponent(email)}`)

          if (userResponse.ok) {
            const userData = await userResponse.json()
            const userId = userData.user.userid

            teamMembers.push({
              userid: userId,
              username: userData.user.username,
              email: userData.user.useremail,
            })

            console.log(`Found user ${userData.user.username} (${email})`)

            // Get their activities
            const activitiesResponse = await fetch(`http://localhost:5000/api/activities?userId=${userId}`)
            if (activitiesResponse.ok) {
              const activitiesData = await activitiesResponse.json()
              console.log(`Raw activities for ${userData.user.username}:`, activitiesData.activities)

              // Filter activities within date range with better date handling
              const filteredActivities = activitiesData.activities.filter((activity) => {
                if (!activity.activitydate) return false

                const activityDate = new Date(activity.activitydate)
                const startDate = new Date(meeting.dateRangeStart)
                const endDate = new Date(meeting.dateRangeEnd)

                // Ensure dates are valid
                if (isNaN(activityDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                  console.warn(`Invalid date found for activity: ${activity.activitytitle}`, {
                    activityDate: activity.activitydate,
                    startDate: meeting.dateRangeStart,
                    endDate: meeting.dateRangeEnd,
                  })
                  return false
                }

                const isInRange = activityDate >= startDate && activityDate <= endDate
                console.log(
                  `Activity "${activity.activitytitle}" on ${activity.activitydate}: ${isInRange ? "INCLUDED" : "EXCLUDED"}`,
                )
                return isInRange
              })

              memberActivities[userId] = filteredActivities
              console.log(`Found ${filteredActivities.length} activities for ${userData.user.username} in date range`)
            } else {
              console.warn(`Failed to fetch activities for ${userData.user.username}`)
              memberActivities[userId] = []
            }

            // Get their goals with timelines
            const goalsResponse = await fetch(`http://localhost:5000/api/goals?userId=${userId}`)
            if (goalsResponse.ok) {
              const goalsData = await goalsResponse.json()
              console.log(`Raw goals for ${userData.user.username}:`, goalsData.goals)

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

                    // Check for valid dates
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
                    console.log(
                      `Timeline "${timeline.timelinetitle}" (${timeline.timelinestartdate} to ${timeline.timelineenddate}): ${overlaps ? "INCLUDED" : "EXCLUDED"}`,
                    )
                    return overlaps
                  }),
                }))
                .filter((goal) => goal.timelines.length > 0)

              memberGoals[userId] = filteredGoals
              console.log(`Found ${filteredGoals.length} relevant goals for ${userData.user.username}`)
            } else {
              console.warn(`Failed to fetch goals for ${userData.user.username}`)
              memberGoals[userId] = []
            }

            // Get their team meetings
            const teamsResponse = await fetch(`http://localhost:5000/api/teams?userId=${userId}`)
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
              console.log(`Found ${allMeetings.length} team meetings for ${userData.user.username}`)
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

      // Combine all scheduling conflicts for comprehensive analysis
      const allMemberSchedules = {}
      Object.keys(memberActivities).forEach((userId) => {
        allMemberSchedules[userId] = {
          activities: memberActivities[userId] || [],
          goals: memberGoals[userId] || [],
          meetings: memberTeams[userId] || [],
        }
      })

      // Validate that we have the required date range
      if (!meeting.dateRangeStart || !meeting.dateRangeEnd) {
        setApiError("Please specify both start and end dates for the meeting range")
        setIsLoadingAI(false)
        return
      }

      // Validate date range
      const startDate = new Date(meeting.dateRangeStart)
      const endDate = new Date(meeting.dateRangeEnd)
      if (startDate >= endDate) {
        setApiError("End date must be after start date")
        setIsLoadingAI(false)
        return
      }

      console.log(`Analyzing schedules for date range: ${meeting.dateRangeStart} to ${meeting.dateRangeEnd}`)

      // Log summary of collected data
      console.log("=== SCHEDULE ANALYSIS SUMMARY ===")
      Object.keys(allMemberSchedules).forEach((userId) => {
        const member = teamMembers.find((m) => m.userid === userId)
        const memberName = member ? member.username : userId
        const schedule = allMemberSchedules[userId]

        console.log(`${memberName}:`)
        console.log(`  - Activities: ${schedule.activities.length}`)
        console.log(`  - Goals: ${schedule.goals.length}`)
        console.log(`  - Meetings: ${schedule.meetings.length}`)

        // Log specific conflicts
        schedule.activities.forEach((activity) => {
          console.log(
            `    Activity: ${activity.activitytitle} on ${activity.activitydate} ${activity.activitystarttime || "all day"}`,
          )
        })
      })
      console.log("=== END SUMMARY ===")

      console.log("Complete member schedules:", allMemberSchedules)

      // Call AI service with comprehensive data
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
        console.log("AI suggestions generated:", result.suggestions)
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

        // Make API call
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

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
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

        // Make API call
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

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to create goal:", data)
          setApiError(data.message || "Failed to create goal. Please try again.")
        }
      } else if (activeTab === "team") {
        // Validate team form
        if (!validateTeamForm()) {
          setIsLoading(false)
          return
        }

        // Prepare team data for API
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

        // Make API call
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

          // Close modal after a delay
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
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "activity"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "goal" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("goal")}
          >
            Goal
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "team" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("team")}
          >
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === "activity" && (
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
                  {isLoading ? "Creating..." : "Create Activity"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "goal" && (
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
                  {isLoading ? "Creating..." : "Create Goal"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "team" && (
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
                  <h3 className="text-lg font-medium text-gray-800">Meetings</h3>
                  <button
                    type="button"
                    onClick={addMeeting}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={16} className="mr-1" /> Add Meeting
                  </button>
                </div>

                {meetings.map((meeting, meetingIndex) => (
                  <div key={meetingIndex} className="border rounded-md p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">Meeting {meetingIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeMeeting(meetingIndex)}
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
                          onChange={(e) => handleMeetingChange(meetingIndex, e)}
                          className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label htmlFor={`useAIScheduling-${meetingIndex}`} className="text-sm text-gray-700">
                          Use AI to find optimal meeting time
                        </label>
                      </div>

                      {meeting.useAIScheduling ? (
                        // AI Scheduling Form
                        <div className="col-span-2 border border-blue-300 rounded p-3 bg-blue-50">
                          <h5 className="text-sm font-medium text-blue-700 mb-3">AI Meeting Scheduler</h5>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Team Members (Emails)
                              </label>
                              {meeting.invitedEmails.map((email, emailIndex) => (
                                <div key={emailIndex} className="flex items-center mb-2">
                                  <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => handleInvitedEmailChange(meetingIndex, emailIndex, e.target.value)}
                                    placeholder="Enter email address"
                                    className="text-gray-700 flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeInvitedEmail(meetingIndex, emailIndex)}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    disabled={meeting.invitedEmails.length === 1}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addInvitedEmail(meetingIndex)}
                                className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                              >
                                <Plus size={12} className="mr-1" /> Add Member Email
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={meeting.dateRangeStart}
                                  onChange={(e) => {
                                    const updatedMeetings = [...meetings]
                                    updatedMeetings[meetingIndex].dateRangeStart = e.target.value
                                    setMeetings(updatedMeetings)
                                  }}
                                  className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={meeting.dateRangeEnd}
                                  onChange={(e) => {
                                    const updatedMeetings = [...meetings]
                                    updatedMeetings[meetingIndex].dateRangeEnd = e.target.value
                                    setMeetings(updatedMeetings)
                                  }}
                                  className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <select
                                  value={meeting.duration}
                                  onChange={(e) => {
                                    const updatedMeetings = [...meetings]
                                    updatedMeetings[meetingIndex].duration = Number.parseInt(e.target.value)
                                    setMeetings(updatedMeetings)
                                  }}
                                  className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value={30}>30 minutes</option>
                                  <option value={60}>1 hour</option>
                                  <option value={90}>1.5 hours</option>
                                  <option value={120}>2 hours</option>
                                  <option value={180}>3 hours</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Type</label>
                                <select
                                  name="invitationType"
                                  value={meeting.invitationType}
                                  onChange={(e) => handleMeetingChange(meetingIndex, e)}
                                  className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="mandatory">Mandatory (Auto-assign)</option>
                                  <option value="request">Request (Can accept/decline)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Time Preference</label>
                              <input
                                type="text"
                                value={meeting.timePreference}
                                onChange={(e) => {
                                  const updatedMeetings = [...meetings]
                                  updatedMeetings[meetingIndex].timePreference = e.target.value
                                  setMeetings(updatedMeetings)
                                }}
                                placeholder="e.g., morning, afternoon, after lunch, early morning"
                                className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded text-sm text-white flex items-center justify-center"
                            >
                              {isLoadingAI ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                  Analyzing member schedules...
                                </>
                              ) : (
                                "Find Best Meeting Times"
                              )}
                            </button>

                            {selectedSuggestion && (
                              <div className="bg-green-100 border border-green-300 rounded p-2">
                                <p className="text-green-700 text-sm">
                                  Selected: {selectedSuggestion.date} at {selectedSuggestion.startTime} -{" "}
                                  {selectedSuggestion.endTime}
                                </p>
                                <p className="text-green-600 text-xs">{selectedSuggestion.reasoning}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Manual Scheduling Form
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              name="meetingDate"
                              value={meeting.meetingDate}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Type</label>
                            <select
                              name="invitationType"
                              value={meeting.invitationType}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="mandatory">Mandatory (Auto-assign)</option>
                              <option value="request">Request (Can accept/decline)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                              type="time"
                              name="meetingStartTime"
                              value={meeting.meetingStartTime}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                              type="time"
                              name="meetingEndTime"
                              value={meeting.meetingEndTime}
                              onChange={(e) => handleMeetingChange(meetingIndex, e)}
                              className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="col-span-2">
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium text-gray-700">Invited Emails</label>
                              <button
                                type="button"
                                onClick={() => addInvitedEmail(meetingIndex)}
                                className="flex items-center text-xs text-blue-600 hover:text-blue-800"
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
                                  className="text-gray-700 flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => removeInvitedEmail(meetingIndex, emailIndex)}
                                  className="ml-2 text-red-500 hover:text-red-700"
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
                      <h3 className="text-lg font-medium mb-4 text-gray-800">AI Meeting Suggestions</h3>
                      {aiSuggestions.length > 0 ? (
                        <div className="space-y-3">
                          {aiSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="border border-gray-300 rounded p-3 hover:border-blue-500 cursor-pointer transition-colors"
                              onClick={() => selectAISuggestionForTeam(suggestion, 0)} // Assuming first meeting for now
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-800">
                                    {suggestion.date} • {suggestion.startTime} - {suggestion.endTime}
                                  </h4>
                                  <div className="flex items-center mt-1">
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${
                                        suggestion.score >= 90
                                          ? "bg-green-100 text-green-700"
                                          : suggestion.score >= 70
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      Score: {suggestion.score}/100
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{suggestion.reasoning}</p>
                              {suggestion.advantages && suggestion.advantages.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.advantages.map((advantage, i) => (
                                    <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      {advantage}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">
                          No suitable meeting times found. Try adjusting your preferences.
                        </p>
                      )}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setShowAISuggestions(false)}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded text-sm text-white"
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
