"use client"

import { useState, useEffect, useRef } from "react"
import { User, Mail, Calendar, Edit2, Lock, LogOut, Trash2, X, Camera, Save, AlertCircle, Users, ChevronRight, Plus, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"

const ProfileSidebar = ({ isOpen, onClose, setCurrentDate }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [teams, setTeams] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [teamDetails, setTeamDetails] = useState(null)
  const [creator, setCreator] = useState(null)
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [isAddingMeeting, setIsAddingMeeting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const sidebarRef = useRef(null)

  const [editedUser, setEditedUser] = useState({
    username: "",
    bio: "",
    dob: "",
    profilePicture: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [editedTeam, setEditedTeam] = useState({
    teamName: "",
    teamDescription: "",
    teamStartWorkingHour: "",
    teamEndWorkingHour: "",
  })

  const [newMeeting, setNewMeeting] = useState({
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
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (document.querySelector('.edit-item-modal-container')) {
        return
      }
      
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        onClose()
        if (selectedTeam) {
          handleBackToProfile()
        }
      }
    }
  
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose, selectedTeam])

  useEffect(() => {
    if (isOpen) {
      fetchUserData()
      fetchUserTeams()
    }
  }, [isOpen])

  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserData()
      if (selectedTeam) {
        fetchTeamDetails(selectedTeam.teamid)
      }
    }
    window.addEventListener("profileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate)
    }
  }, [selectedTeam])

  const fetchCreatorData = async (creatorId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${creatorId}`)
      if (response.ok) {
        const userData = await response.json()
        setCreator(userData.user)
      }
    } catch (error) {
      console.error("Error fetching creator data:", error)
    }
  }

  const fetchUserData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) {
        navigate("/login")
        return
      }

      const isGoogleUser = !!storedUser.googleId || !!storedUser.accessToken
      setIsGoogleUser(isGoogleUser)

      try {
        const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`)

        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)

          setEditedUser({
            username: userData.user.username || "",
            bio: userData.user.userbio || "",
            dob: userData.user.userdob ? userData.user.userdob.split("T")[0] : "",
            profilePicture: userData.user.userprofilepicture || "",
          })
        } else {
          console.error("Failed to fetch user data")
          if (isGoogleUser) {
            const userData = {
              userid: storedUser.id,
              username: storedUser.username || storedUser.name,
              useremail: storedUser.email,
              userprofilepicture: null,
              userbio: "",
              userdob: null,
              isgoogleuser: true,
            }
            setUser(userData)

            setEditedUser({
              username: userData.username || "",
              bio: userData.userbio || "",
              dob: "",
              profilePicture: null,
            })
          } else {
            navigate("/login")
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        if (isGoogleUser) {
          const userData = {
            userid: storedUser.id,
            username: storedUser.username || storedUser.name,
            useremail: storedUser.email,
            userprofilepicture: null,
            userbio: "",
            userdob: null,
            isgoogleuser: true,
          }
          setUser(userData)

          setEditedUser({
            username: userData.username || "",
            bio: userData.userbio || "",
            dob: "",
            profilePicture: null,
          })
        } else {
          navigate("/login")
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchUserTeams = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) return

      const response = await fetch(`http://localhost:5000/api/teams?userId=${storedUser.id}`)

      if (response.ok) {
        const teamsData = await response.json()
        setTeams(teamsData.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const fetchTeamDetails = async (teamId) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      if (!storedUser.id) return
      
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}?userId=${storedUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setTeamDetails(data.team)
        setEditedTeam({
          teamName: data.team.teamname,
          teamDescription: data.team.teamdescription || "",
          teamStartWorkingHour: data.team.teamstartworkinghour || "",
          teamEndWorkingHour: data.team.teamendworkinghour || "",
        })
        fetchCreatorData(data.team.createdbyuserid)
      }
    } catch (error) {
      console.error("Error fetching team details:", error)
    }
  }

  const handleTeamClick = (team) => {
    setSelectedTeam(team)
    fetchTeamDetails(team.teamid)
  }

  const handleBackToProfile = () => {
    setSelectedTeam(null)
    setTeamDetails(null)
    setCreator(null)
    setIsEditingTeam(false)
    setIsAddingMeeting(false)
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTeamChange = (e) => {
    const { name, value } = e.target
    setEditedTeam((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMeetingChange = (e) => {
    const { name, value } = e.target
    setNewMeeting((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleInvitedEmailChange = (index, value) => {
    const updatedEmails = [...newMeeting.invitedEmails]
    updatedEmails[index] = value
    setNewMeeting((prev) => ({
      ...prev,
      invitedEmails: updatedEmails,
    }))
  }

  const addInvitedEmail = () => {
    setNewMeeting((prev) => ({
      ...prev,
      invitedEmails: [...prev.invitedEmails, ""],
    }))
  }

  const removeInvitedEmail = (index) => {
    if (newMeeting.invitedEmails.length > 1) {
      const updatedEmails = [...newMeeting.invitedEmails]
      updatedEmails.splice(index, 1)
      setNewMeeting((prev) => ({
        ...prev,
        invitedEmails: updatedEmails,
      }))
    }
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setEditedUser((prev) => ({
        ...prev,
        profilePicture: reader.result,
      }))
    }
    reader.readAsDataURL(file)
  }
  
  const handleRemoveProfilePicture = () => {
    setEditedUser((prev) => ({
      ...prev,
      profilePicture: null,
    }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) {
        setError("User not authenticated")
        setTimeout(() => setError(""), 3000)
        return
      }

      const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: editedUser.username,
          bio: editedUser.bio,
          dob: editedUser.dob,
          profilePicture: editedUser.profilePicture,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setSuccess("Profile updated successfully!")
        setIsEditing(false)
        setTimeout(() => setSuccess(""), 3000)

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            username: data.user.username,
          }),
        )
        
        window.dispatchEvent(new CustomEvent("profileUpdated"))

      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update profile")
        setTimeout(() => setError(""), 3000)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Network error. Please try again.")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTeam = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`http://localhost:5000/api/teams/${selectedTeam.teamid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamName: editedTeam.teamName,
          teamDescription: editedTeam.teamDescription,
          teamStartWorkingHour: editedTeam.teamStartWorkingHour,
          teamEndWorkingHour: editedTeam.teamEndWorkingHour,
        }),
      })

      if (response.ok) {
        setSuccess("Team updated successfully!")
        setIsEditingTeam(false)
        setSelectedTeam(prevTeam => ({
            ...prevTeam,
            teamname: editedTeam.teamName 
        }))

        fetchTeamDetails(selectedTeam.teamid)
        fetchUserTeams()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update team")
        setTimeout(() => setError(""), 3000)
      }
    } catch (error) {
      console.error("Error updating team:", error)
      setError("Network error. Please try again.")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team? This will notify all members.")) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Team deleted successfully!")
        handleBackToProfile()
        await fetchUserTeams()
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to delete team")
        setTimeout(() => setError(""), 3000)
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      setError("Error deleting team")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm("Are you sure you want to delete this meeting? This will notify all members.")) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Meeting deleted successfully!")
        window.dispatchEvent(new CustomEvent("refreshCalendarData"))
        await fetchTeamDetails(selectedTeam.teamid)
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to delete meeting")
        setTimeout(() => setError(""), 3000)
      }
    } catch (error) {
      console.error("Error deleting meeting:", error)
      setError("Error deleting meeting")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIScheduling = async () => {
    setIsLoadingAI(true)
    setError("")

    try {
      const validEmails = newMeeting.invitedEmails.filter((email) => email.trim())
      if (validEmails.length === 0) {
        setError("Please add at least one team member email")
        setIsLoadingAI(false)
        return
      }

      const allMemberEmails = [user.useremail, ...validEmails]

      const memberActivities = {}
      const teamMembers = []
      const memberGoals = {}
      const memberTeams = {}

      for (const email of allMemberEmails) {
        try {
          const userResponse = await fetch(`http://localhost:5000/api/users/by-email/${encodeURIComponent(email)}`)

          if (userResponse.ok) {
            const userData = await userResponse.json()
            const userId = userData.user.userid

            teamMembers.push({
              userid: userId,
              username: userData.user.username,
              email: userData.user.useremail,
            })

            const activitiesResponse = await fetch(`http://localhost:5000/api/activities?userId=${userId}`)
            if (activitiesResponse.ok) {
              const activitiesData = await activitiesResponse.json()
              const filteredActivities = activitiesData.activities.filter((activity) => {
                if (!activity.activitydate) return false
                const activityDate = new Date(activity.activitydate)
                const startDate = new Date(newMeeting.dateRangeStart)
                const endDate = new Date(newMeeting.dateRangeEnd)
                if (isNaN(activityDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                  return false
                }
                return activityDate >= startDate && activityDate <= endDate
              })
              memberActivities[userId] = filteredActivities
            } else {
              memberActivities[userId] = []
            }

            const goalsResponse = await fetch(`http://localhost:5000/api/goals?userId=${userId}`)
            if (goalsResponse.ok) {
              const goalsData = await goalsResponse.json()
              const filteredGoals = goalsData.goals
                .map((goal) => ({
                  ...goal,
                  timelines: goal.timelines.filter((timeline) => {
                    if (!timeline.timelinestartdate || !timeline.timelineenddate) return false
                    const timelineStart = new Date(timeline.timelinestartdate)
                    const timelineEnd = new Date(timeline.timelineenddate)
                    const rangeStart = new Date(newMeeting.dateRangeStart)
                    const rangeEnd = new Date(newMeeting.dateRangeEnd)
                    if ( isNaN(timelineStart.getTime()) || isNaN(timelineEnd.getTime()) || isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
                      return false
                    }
                    return timelineStart <= rangeEnd && timelineEnd >= rangeStart
                  }),
                }))
                .filter((goal) => goal.timelines.length > 0)
              memberGoals[userId] = filteredGoals
            } else {
              memberGoals[userId] = []
            }

            const teamsResponse = await fetch(`http://localhost:5000/api/teams?userId=${userId}`)
            if (teamsResponse.ok) {
              const teamsData = await teamsResponse.json()
              const allMeetings = []
              teamsData.teams.forEach((team) => {
                team.meetings.forEach((teamMeeting) => {
                  const meetingDate = new Date(teamMeeting.meetingdate)
                  const startDate = new Date(newMeeting.dateRangeStart)
                  const endDate = new Date(newMeeting.dateRangeEnd)
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

      if (!newMeeting.dateRangeStart || !newMeeting.dateRangeEnd) {
        setError("Please specify both start and end dates for the meeting range")
        setIsLoadingAI(false)
        return
      }

      const startDate = new Date(newMeeting.dateRangeStart)
      const endDate = new Date(newMeeting.dateRangeEnd)
      if (startDate > endDate) {
        setError("End date must be after start date")
        setIsLoadingAI(false)
        return
      }

      const aiService = (await import("../services/aiService.js")).default
      const result = await aiService.findOptimalMeetingTimes(
        teamMembers,
        {
          startDate: newMeeting.dateRangeStart,
          endDate: newMeeting.dateRangeEnd,
        },
        newMeeting.duration,
        {
          start: teamDetails.teamstartworkinghour || "09:00",
          end: teamDetails.teamendworkinghour || "17:00",
        },
        newMeeting.timePreference,
        allMemberSchedules,
      )

      if (result.success) {
        setAiSuggestions(result.suggestions)
        setSelectedSuggestion(null)
        setShowAISuggestions(true)
      } else {
        setError(result.error || "Failed to generate meeting suggestions")
      }
    } catch (error) {
      console.error("Error in AI scheduling:", error)
      setError("Failed to generate meeting suggestions: " + error.message)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const selectAISuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion)
    setNewMeeting((prev) => ({
      ...prev,
      meetingDate: suggestion.date,
      meetingStartTime: suggestion.startTime,
      meetingEndTime: suggestion.endTime,
    }))
    setShowAISuggestions(false)
  }
  
  const handleAddMeeting = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`http://localhost:5000/api/teams/${selectedTeam.teamid}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingTitle: newMeeting.meetingTitle,
          meetingDescription: newMeeting.meetingDescription,
          meetingDate: newMeeting.meetingDate,
          meetingStartTime: newMeeting.meetingStartTime,
          meetingEndTime: newMeeting.meetingEndTime,
          invitationType: newMeeting.invitationType,
          invitedEmails: newMeeting.invitedEmails.filter((email) => email.trim()),
        }),
      })

      if (response.ok) {
        setSuccess("Meeting added successfully!")
        setIsAddingMeeting(false)
        setNewMeeting({
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
        })
        setAiSuggestions([])
        setSelectedSuggestion(null)
        setShowAISuggestions(false)

        fetchTeamDetails(selectedTeam.teamid)
        fetchUserTeams()

        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to add meeting")
        setTimeout(() => setError(""), 3000)
      }
    } catch (error) {
      console.error("Error adding meeting:", error)
      setError("Network error. Please try again.")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match")
      setTimeout(() => setError(""), 3000)
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      setTimeout(() => setError(""), 3000)
      setIsLoading(false)
      return
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) {
        setError("User not authenticated")
        setTimeout(() => setError(""), 3000)
        return
      }

      const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        setSuccess("Password changed successfully!")
        if (sidebarRef.current) {
          sidebarRef.current.scrollTo({ top: 0, behavior: "smooth" })
        }
        setTimeout(() => {
            setSuccess("")
            setIsChangingPassword(false)
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to change password")
        setTimeout(() => setError(""), 3000)
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Network error. Please try again.")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (isGoogleUser && window.googleAuthService) {
        await window.googleAuthService.signOut()
      }

      localStorage.removeItem("user")
      localStorage.removeItem("googleAccessToken")
      navigate("/login")
    } catch (error) {
      console.error("Error during logout:", error)
      localStorage.removeItem("user")
      localStorage.removeItem("googleAccessToken")
      navigate("/login")
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) {
        setError("User not authenticated")
        setTimeout(() => setError(""), 3000)
        return
      }

      const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        if (isGoogleUser && window.googleAuthService) {
          await window.googleAuthService.signOut()
        }

        localStorage.removeItem("user")
        localStorage.removeItem("googleAccessToken")
        navigate("/login")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to delete account")
        setTimeout(() => setError(""), 3000)
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      setError("Network error. Please try again.")
      setTimeout(() => setError(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not set"

    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  const getDisplayProfilePicture = () => {
    const pictureSource = isEditing ? editedUser.profilePicture : user?.userprofilepicture
    return pictureSource || null
  }
  
  const handleViewMeetingOnCalendar = (meeting) => {
    const meetingDate = new Date(meeting.meetingdate)
    
    setCurrentDate(meetingDate)

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const isPast = meetingDate < now

    const switchTabEvent = new CustomEvent("switchSidebarTab", {
      detail: { isPast },
    })
    window.dispatchEvent(switchTabEvent)
  
    setTimeout(() => {
      const highlightEvent = new CustomEvent("highlightCalendarItem", {
        detail: {
          id: meeting.teammeetingid,
          type: "meeting",
          timelineId: null,
        },
      })
      window.dispatchEvent(highlightEvent)

      const sidebarEvent = new CustomEvent("highlightSidebarItem", {
        detail: { 
          id: meeting.teammeetingid, 
          type: "meeting",
          timelineId: null,
        },
      })
      window.dispatchEvent(sidebarEvent)
    }, 100)
  
    onClose()
  }

  const openEditMeetingModal = (meeting) => {
    const event = new CustomEvent("editCalendarItem", {
        detail: { item: { ...meeting, id: meeting.teammeetingid, type: 'meeting'} },
    })
    window.dispatchEvent(event)
  }

  useEffect(() => {
    const handleRefresh = () => {
      if (selectedTeam) {
        fetchTeamDetails(selectedTeam.teamid)
      }
      fetchUserTeams()
    }

    window.addEventListener('refreshTeamData', handleRefresh)

    return () => {
      window.removeEventListener('refreshTeamData', handleRefresh)
    }
  }, [selectedTeam])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div ref={sidebarRef} className="bg-[#002147] text-white w-full max-w-80 h-full overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center">
            {selectedTeam && (
              <button onClick={handleBackToProfile} className="mr-2 p-1 rounded hover:bg-gray-700">
                <ChevronRight size={16} className="rotate-180" />
              </button>
            )}
            <h2 className="text-xl font-bold">{selectedTeam ? selectedTeam.teamname : "Profile"}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-md flex items-center">
              <AlertCircle size={18} className="mr-2 text-red-400" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900 bg-opacity-50 border border-green-700 rounded-md">
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {selectedTeam && teamDetails ? (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Team Information</h3>
                  <div className="flex items-center space-x-2">
                    {selectedTeam.createdbyuserid === user?.userid && (
                      <>
                        <button
                          onClick={() => setIsEditingTeam(!isEditingTeam)}
                          className="p-1 text-blue-400 hover:text-blue-300 rounded"
                          title="Edit Team"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(selectedTeam.teamid)}
                          className="p-1 text-red-400 hover:text-red-300 rounded"
                          title="Delete Team"
                          disabled={isLoading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-t-md p-4 pb-0 space-y-3">
                    {creator && (
                      <div>
                        <span className="block text-sm font-medium text-gray-400 mb-1">Created by:</span>
                        <div className="flex items-center">
                            <img src={creator.userprofilepicture || `https://ui-avatars.com/api/?name=${creator.username}&background=0D8ABC&color=fff`} alt={creator.username} className="w-8 h-8 rounded-full mr-3" />
                            <p className="text-white">
                                {creator.userid === user?.userid ? `${creator.username} (You)` : creator.username}
                            </p>
                        </div>
                      </div>
                    )}
                </div>

                {isEditingTeam ? (
                  <div className="bg-gray-800 rounded-b-md p-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Team Name</label>
                      <input
                        type="text"
                        name="teamName"
                        value={editedTeam.teamName}
                        onChange={handleTeamChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea
                        name="teamDescription"
                        value={editedTeam.teamDescription}
                        onChange={handleTeamChange}
                        rows="3"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Start Hour</label>
                        <input
                          type="time"
                          name="teamStartWorkingHour"
                          value={editedTeam.teamStartWorkingHour}
                          onChange={handleTeamChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">End Hour</label>
                        <input
                          type="time"
                          name="teamEndWorkingHour"
                          value={editedTeam.teamEndWorkingHour}
                          onChange={handleTeamChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={handleSaveTeam}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        disabled={isLoading}
                      >
                        {isLoading ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setIsEditingTeam(false)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-b-md p-4 space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Description:</span>
                      <p className="text-white">{teamDetails.teamdescription || "No description"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Working Hours:</span>
                      <p className="text-white">
                        {teamDetails.teamstartworkinghour && teamDetails.teamendworkinghour
                          ? `${teamDetails.teamstartworkinghour} - ${teamDetails.teamendworkinghour}`
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Team Meetings</h3>
                  {selectedTeam.createdbyuserid === user?.userid && (
                    <button
                      onClick={() => setIsAddingMeeting(true)}
                      className="p-1 text-blue-400 hover:text-blue-300 rounded"
                      title="Add Meeting"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>

                {isAddingMeeting && (
                  <div className="bg-gray-800 rounded-md p-4 mb-4">
                    <h4 className="font-medium mb-3">Add New Meeting</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Title</label>
                        <input
                          type="text"
                          name="meetingTitle"
                          value={newMeeting.meetingTitle}
                          onChange={handleMeetingChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                          name="meetingDescription"
                          value={newMeeting.meetingDescription}
                          onChange={handleMeetingChange}
                          rows="2"
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useAIScheduling"
                          checked={newMeeting.useAIScheduling}
                          onChange={(e) => setNewMeeting((prev) => ({ ...prev, useAIScheduling: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="useAIScheduling" className="text-sm text-gray-300">
                          Use AI to find optimal meeting time
                        </label>
                      </div>

                      {newMeeting.useAIScheduling ? (
                        <div className="space-y-3 border border-blue-600 rounded p-3">
                          <h5 className="text-sm font-medium text-blue-400">AI Meeting Scheduler</h5>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Team Members (Emails)
                            </label>
                            {newMeeting.invitedEmails.map((email, index) => (
                              <div key={index} className="flex items-center mb-2">
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => handleInvitedEmailChange(index, e.target.value)}
                                  className="flex-1 p-2 pr-1 bg-gray-700 border border-gray-600 rounded text-white"
                                  placeholder="Enter email"
                                />
                                <button
                                  onClick={() => removeInvitedEmail(index)}
                                  className="ml-2 text-red-400 hover:text-red-300"
                                  disabled={newMeeting.invitedEmails.length === 1}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={addInvitedEmail}
                              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                            >
                              <Plus size={12} className="mr-1" /> Add Member Email
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={newMeeting.dateRangeStart}
                              onChange={(e) => setNewMeeting((prev) => ({ ...prev, dateRangeStart: e.target.value }))}
                              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                            <input
                              type="date"
                              value={newMeeting.dateRangeEnd}
                              onChange={(e) => setNewMeeting((prev) => ({ ...prev, dateRangeEnd: e.target.value }))}
                              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Duration (minutes)</label>
                            <select
                              value={newMeeting.duration}
                              onChange={(e) =>
                                setNewMeeting((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) }))
                              }
                              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            >
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={90}>1.5 hours</option>
                              <option value={120}>2 hours</option>
                              <option value={180}>3 hours</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Time Preference</label>
                            <input
                              type="text"
                              value={newMeeting.timePreference}
                              onChange={(e) => setNewMeeting((prev) => ({ ...prev, timePreference: e.target.value }))}
                              placeholder="e.g., morning, afternoon, after lunch, early morning"
                              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            />
                          </div>

                          <button
                            onClick={handleAIScheduling}
                            disabled={
                              isLoadingAI ||
                              !newMeeting.dateRangeStart ||
                              !newMeeting.dateRangeEnd ||
                              !newMeeting.invitedEmails.some((email) => email.trim())
                            }
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm flex items-center justify-center"
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
                            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded p-2">
                              <p className="text-green-300 text-sm">
                                Selected: {selectedSuggestion.date} at {selectedSuggestion.startTime} -{" "}
                                {selectedSuggestion.endTime}
                              </p>
                              <p className="text-green-400 text-xs">{selectedSuggestion.reasoning}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                            <input
                              type="date"
                              name="meetingDate"
                              value={newMeeting.meetingDate}
                              onChange={handleMeetingChange}
                              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Start</label>
                              <input
                                type="time"
                                name="meetingStartTime"
                                value={newMeeting.meetingStartTime}
                                onChange={handleMeetingChange}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">End</label>
                              <input
                                type="time"
                                name="meetingEndTime"
                                value={newMeeting.meetingEndTime}
                                onChange={handleMeetingChange}
                                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Invitation Type</label>
                        <select
                          name="invitationType"
                          value={newMeeting.invitationType}
                          onChange={handleMeetingChange}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          <option value="mandatory">Mandatory</option>
                          <option value="request">Request</option>
                        </select>
                      </div>
                      {!newMeeting.useAIScheduling && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Invited Emails</label>
                          {newMeeting.invitedEmails.map((email, index) => (
                            <div key={index} className="flex items-center mb-2">
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => handleInvitedEmailChange(index, e.target.value)}
                                className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
                                placeholder="Enter email"
                              />
                              <button
                                onClick={() => removeInvitedEmail(index)}
                                className="ml-2 text-red-400 hover:text-red-300"
                                disabled={newMeeting.invitedEmails.length === 1}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={addInvitedEmail}
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                          >
                            <Plus size={12} className="mr-1" /> Add Email
                          </button>
                        </div>
                      )}
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={handleAddMeeting}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                          disabled={isLoading || (newMeeting.useAIScheduling && !selectedSuggestion)}
                        >
                          {isLoading ? "Adding..." : "Add Meeting"}
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingMeeting(false)
                            setShowAISuggestions(false)
                            setSelectedSuggestion(null)
                            setAiSuggestions([])
                          }}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                              onClick={() => selectAISuggestion(suggestion)}
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
                              <p className="text-sm text-gray-300 mb-2">{suggestion.reasoning}</p>
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

                <div className="space-y-3">
                  {teamDetails.meetings && teamDetails.meetings.length > 0 ? (
                    teamDetails.meetings.map((meeting) => (
                      <div key={meeting.teammeetingid} className="bg-gray-800 rounded-md p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{meeting.meetingtitle}</h4>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-400">{meeting.meetingdate}</span>
                            <button
                              onClick={() => handleViewMeetingOnCalendar(meeting)}
                              className="p-1 text-gray-400 hover:text-gray-300 rounded"
                              title="View on calendar"
                            >
                              <Eye size={12} />
                            </button>
                            {selectedTeam.createdbyuserid === user?.userid && (
                              <>
                                <button
                                  onClick={() => openEditMeetingModal(meeting)
                                  }
                                  className="p-1 text-blue-400 hover:text-blue-300 rounded"
                                  title="Edit Meeting"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeeting(meeting.teammeetingid)}
                                  className="p-1 text-red-400 hover:text-red-300 rounded"
                                  title="Delete Meeting"
                                  disabled={isLoading}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {meeting.meetingdescription && (
                          <p className="text-sm text-gray-300 mb-2">{meeting.meetingdescription}</p>
                        )}
                        {meeting.meetingstarttime && meeting.meetingendtime && (
                          <p className="text-xs text-gray-400 mb-2">
                            {meeting.meetingstarttime} - {meeting.meetingendtime}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mb-2 capitalize">
                          Meeting type: {meeting.invitationtype}
                        </p>
                        <div className="mb-2">
                          <span className="text-xs text-gray-400">Members ({meeting.members?.length || 0}):</span>
                          <div className="flex flex-col gap-2 mt-1">
                          {meeting.members?.map((member) => (
                              <div key={member.userid} className="flex items-center">
                                  <img src={member.userprofilepicture || `https://ui-avatars.com/api/?name=${member.username}&background=0D8ABC&color=fff`} alt={member.username} className="w-6 h-6 rounded-full mr-2" />
                                  <span
                                      className={`text-xs px-2 py-1 rounded ${
                                      meeting.invitationtype === 'request' && member.status === "accepted"
                                          ? "bg-green-900 text-green-300"
                                          : meeting.invitationtype === 'request' && member.status === "declined"
                                          ? "bg-red-900 text-red-300"
                                          : "bg-gray-700 text-gray-300"
                                      }`}
                                  >
                                      {member.userid === user?.userid ? "You" : member.username}
                                      {meeting.invitationtype === "request" && ` (${member.status})`}
                                  </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">No meetings scheduled</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {user ? (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 mb-2">
                        {getDisplayProfilePicture() ? (
                          <img
                            src={getDisplayProfilePicture() || "/placeholder.svg"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none"
                              e.target.nextSibling.style.display = "flex"
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center bg-blue-900"
                          style={{ display: getDisplayProfilePicture() ? "none" : "flex" }}
                        >
                          <User size={40} className="text-blue-300" />
                        </div>
                      </div>

                      {isEditing && (
                        <div className="absolute bottom-0 right-0 flex items-center">
                            <label className="bg-blue-600 rounded-full p-1 cursor-pointer hover:bg-blue-700" title="Change picture">
                                <Camera size={16} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProfilePictureChange}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={handleRemoveProfilePicture}
                                className="ml-1 bg-red-600 rounded-full p-1 cursor-pointer hover:bg-red-700"
                                title="Remove profile picture"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={editedUser.username}
                        onChange={handleEditChange}
                        className="mt-2 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center text-lg font-medium w-full"
                      />
                    ) : (
                      <h3 className="text-lg font-medium mt-2">{user.username}</h3>
                    )}

                    {isGoogleUser && (
                      <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-300 mt-1">Google Account</span>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p>{user.useremail}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-400">Date of Birth</p>
                        {isEditing ? (
                          <input
                            type="date"
                            name="dob"
                            value={editedUser.dob}
                            onChange={handleEditChange}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 w-full"
                          />
                        ) : (
                          <p>{user.userdob ? formatDate(user.userdob) : "Not set"}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Biography</p>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={editedUser.bio}
                          onChange={handleEditChange}
                          rows={4}
                          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 w-full"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-sm">{user.userbio || "No biography set"}</p>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium mb-3">Teams</h4>
                      {teams.length > 0 ? (
                        <div className="space-y-3">
                          {teams.map((team) => (
                            <div
                              key={team.teamid}
                              className="bg-gray-800 rounded-md p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={() => handleTeamClick(team)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-medium">{team.teamname}</h5>
                                    <ChevronRight size={16} className="text-gray-400" />
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300 mr-2">
                                      {team.createdbyuserid === user.userid ? "Creator" : "Member"}
                                    </span>
                                    <Users size={12} className="text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-400">
                                      {team.meetings ? team.meetings.length : 0} meetings
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {team.teamdescription && (
                                <p className="text-sm text-gray-400 mt-1">{team.teamdescription}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">You are not a member of any teams.</p>
                      )}
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex justify-between mb-6">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 mr-2"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          "Saving..."
                        ) : (
                          <>
                            <Save size={16} className="mr-1" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {isChangingPassword && (
                    <div className="mb-6 bg-gray-800 rounded-md p-4">
                      <h4 className="text-lg font-medium mb-3">Change Password</h4>
                      <form onSubmit={handleChangePassword}>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">New Password</label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-between mt-4">
                          <button
                            type="button"
                            onClick={() => setIsChangingPassword(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 mr-2"
                            disabled={isLoading}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            disabled={isLoading}
                          >
                            {isLoading ? "Changing..." : "Change Password"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-3">
                  {!isEditing && !isChangingPassword && (
                    <>
                        <button
                        onClick={() => {
                            setIsEditing(true)
                            setEditedUser({
                            username: user.username || "",
                            bio: user.userbio || "",
                            dob: user.userdob ? user.userdob.split("T")[0] : "",
                            profilePicture: user.userprofilepicture || "",
                            })
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                        <Edit2 size={16} className="mr-2" />
                        Edit Profile
                        </button>
                        {!isGoogleUser && (
                        <button
                            onClick={() => setIsChangingPassword(true)}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 rounded-md hover:bg-gray-700"
                        >
                            <Lock size={16} className="mr-2" />
                            Change Password
                        </button>
                        )}
                        <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 rounded-md hover:bg-gray-700"
                        >
                        <LogOut size={16} className="mr-2" />
                        Logout
                        </button>
                        <button
                        onClick={handleDeleteAccount}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                        <Trash2 size={16} className="mr-2" />
                        Delete Account
                        </button>
                    </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400">Loading profile...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSidebar
