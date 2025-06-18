"use client"

import { useState, useEffect, useRef } from "react"
import { User, Mail, Calendar, Edit2, Lock, LogOut, Trash2, X, Camera, Save, AlertCircle, Users, ChevronRight, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const ProfileSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [teams, setTeams] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [googleProfilePicture, setGoogleProfilePicture] = useState("")
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [teamDetails, setTeamDetails] = useState(null)
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [isAddingMeeting, setIsAddingMeeting] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState(null)
  const sidebarRef = useRef(null)

  // Form states
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
  })

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Get user data on component mount
  useEffect(() => {
    if (isOpen) {
      fetchUserData()
      fetchUserTeams()
    }
  }, [isOpen])

  const fetchUserData = async () => {
    try {
      // Get user from localStorage first
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) {
        navigate("/login")
        return
      }

      // Check if this is a Google user and store their Google profile picture
      const isGoogleUser = !!storedUser.googleId || !!storedUser.accessToken
      setIsGoogleUser(isGoogleUser)

      if (isGoogleUser && storedUser.imageUrl) {
        setGoogleProfilePicture(storedUser.imageUrl)
      }

      // Always fetch from API for the most up-to-date data
      try {
        const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`)

        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)

          // Initialize edit form with user data
          setEditedUser({
            username: userData.user.username || "",
            bio: userData.user.userbio || "",
            dob: userData.user.userdob ? userData.user.userdob.split("T")[0] : "",
            // For Google users, if no custom profile picture, use empty string (will show Google's)
            profilePicture: userData.user.userprofilepicture || "",
          })
        } else {
          console.error("Failed to fetch user data")
          // For Google users, if API fails, use stored data as fallback
          if (isGoogleUser) {
            const userData = {
              userid: storedUser.id,
              username: storedUser.username || storedUser.name,
              useremail: storedUser.email,
              userprofilepicture: null, // Google users start with null in DB
              userbio: "",
              userdob: null,
              isgoogleuser: true,
            }
            setUser(userData)

            // Initialize edit form with user data
            setEditedUser({
              username: userData.username || "",
              bio: userData.userbio || "",
              dob: userData.userdob ? userData.userdob.split("T")[0] : "",
              profilePicture: "",
            })
          } else {
            navigate("/login")
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        // For Google users, use stored data as fallback
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

          // Initialize edit form with user data
          setEditedUser({
            username: userData.username || "",
            bio: userData.userbio || "",
            dob: userData.userdob ? userData.userdob.split("T")[0] : "",
            profilePicture: "",
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
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTeamDetails(data.team)
        setEditedTeam({
          teamName: data.team.teamname,
          teamDescription: data.team.teamdescription || "",
          teamStartWorkingHour: data.team.teamstartworkinghour || "",
          teamEndWorkingHour: data.team.teamendworkinghour || "",
        })
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
    setIsEditingTeam(false)
    setIsAddingMeeting(false)
    setEditingMeeting(null)
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

    // For this demo, we'll just use a FileReader to get a data URL
    // In a real app, you would upload to a server or cloud storage
    const reader = new FileReader()
    reader.onload = () => {
      setEditedUser((prev) => ({
        ...prev,
        profilePicture: reader.result,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) {
        setError("User not authenticated")
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

        // Update localStorage user data
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            username: data.user.username,
          }),
        )
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Network error. Please try again.")
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
        fetchTeamDetails(selectedTeam.teamid)
        fetchUserTeams()

        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update team")
      }
    } catch (error) {
      console.error("Error updating team:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
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
        })
        fetchTeamDetails(selectedTeam.teamid)
        fetchUserTeams()

        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to add meeting")
      }
    } catch (error) {
      console.error("Error adding meeting:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMeeting = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`http://localhost:5000/api/meetings/${editingMeeting.teammeetingid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingTitle: editingMeeting.meetingtitle,
          meetingDescription: editingMeeting.meetingdescription,
          meetingDate: editingMeeting.meetingdate,
          meetingStartTime: editingMeeting.meetingstarttime,
          meetingEndTime: editingMeeting.meetingendtime,
          invitationType: editingMeeting.invitationtype,
          invitedEmails: editingMeeting.members?.map((member) => member.useremail) || [],
        }),
      })

      if (response.ok) {
        setSuccess("Meeting updated successfully!")
        setEditingMeeting(null)
        fetchTeamDetails(selectedTeam.teamid)
        fetchUserTeams()

        setTimeout(() => setSuccess(""), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to update meeting")
      }
    } catch (error) {
      console.error("Error updating meeting:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords don't match")
      setIsLoading(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!storedUser.id) {
        setError("User not authenticated")
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
        setIsChangingPassword(false)
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to change password")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleLogout function to handle both Google and non-Google users
  const handleLogout = async () => {
    try {
      // Sign out from Google if it's a Google user
      if (isGoogleUser && window.googleAuthService) {
        await window.googleAuthService.signOut()
      }

      localStorage.removeItem("user")
      localStorage.removeItem("googleAccessToken")
      navigate("/login")
    } catch (error) {
      console.error("Error during logout:", error)
      // Still navigate to login even if Google signout fails
      localStorage.removeItem("user")
      localStorage.removeItem("googleAccessToken")
      navigate("/login")
    }
  }

  // Update the handleDeleteAccount function to handle both Google and non-Google users
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
        return
      }

      const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Sign out from Google if it's a Google user
        if (isGoogleUser && window.googleAuthService) {
          await window.googleAuthService.signOut()
        }

        localStorage.removeItem("user")
        localStorage.removeItem("googleAccessToken")
        navigate("/login")
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Failed to delete account")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not set"

    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  // Get the profile picture to display
  const getDisplayProfilePicture = () => {
    if (isEditing && editedUser.profilePicture) {
      return editedUser.profilePicture
    }

    // If user has custom profile picture, use it
    if (user?.userprofilepicture) {
      return user.userprofilepicture
    }

    // For Google users, use their Google profile picture if no custom one
    if (isGoogleUser && googleProfilePicture) {
      return googleProfilePicture
    }

    return null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div ref={sidebarRef} className="bg-[#002147] text-white w-full max-w-80 h-full overflow-y-auto">
        {/* Header */}
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

        {/* Content */}
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
            // Team Detail View
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Team Information</h3>
                  {selectedTeam.createdbyuserid === user?.userid && (
                    <button
                      onClick={() => setIsEditingTeam(!isEditingTeam)}
                      className="p-1 text-blue-400 hover:text-blue-300 rounded"
                      title="Edit Team"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>

                {isEditingTeam ? (
                  <div className="bg-gray-800 rounded-md p-4 space-y-3">
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
                  <div className="bg-gray-800 rounded-md p-4 space-y-3">
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
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={handleAddMeeting}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                          disabled={isLoading}
                        >
                          {isLoading ? "Adding..." : "Add Meeting"}
                        </button>
                        <button
                          onClick={() => setIsAddingMeeting(false)}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                        >
                          Cancel
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
                            {selectedTeam.createdbyuserid === user?.userid && (
                              <button
                                onClick={() => setEditingMeeting(meeting)}
                                className="p-1 text-blue-400 hover:text-blue-300 rounded"
                                title="Edit Meeting"
                              >
                                <Edit2 size={12} />
                              </button>
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
                        <div className="mb-2">
                          <span className="text-xs text-gray-400">Members ({meeting.members?.length || 0}):</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {meeting.members?.map((member) => (
                              <span
                                key={member.userid}
                                className={`text-xs px-2 py-1 rounded ${
                                  member.status === "accepted"
                                    ? "bg-green-900 text-green-300"
                                    : member.status === "declined"
                                      ? "bg-red-900 text-red-300"
                                      : "bg-yellow-900 text-yellow-300"
                                }`}
                              >
                                {member.username} ({member.status})
                              </span>
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

              {/* Edit Meeting Modal */}
              {editingMeeting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-medium mb-4">Edit Meeting</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Meeting Title</label>
                        <input
                          type="text"
                          value={editingMeeting.meetingtitle}
                          onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingtitle: e.target.value })}
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                          value={editingMeeting.meetingdescription}
                          onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingdescription: e.target.value })}
                          rows="2"
                          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                          <input
                            type="date"
                            value={editingMeeting.meetingdate}
                            onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingdate: e.target.value })}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Start</label>
                          <input
                            type="time"
                            value={editingMeeting.meetingstarttime}
                            onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingstarttime: e.target.value })}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">End</label>
                          <input
                            type="time"
                            value={editingMeeting.meetingendtime}
                            onChange={(e) => setEditingMeeting({ ...editingMeeting, meetingendtime: e.target.value })}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4 justify-end">
                      <button
                        onClick={handleUpdateMeeting}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update"}
                      </button>
                      <button
                        onClick={() => setEditingMeeting(null)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Profile View
            <>
              {user ? (
                <>
                  {/* Profile Picture and Name Section */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 mb-2">
                        {getDisplayProfilePicture() ? (
                          <img
                            src={getDisplayProfilePicture() || "/placeholder.svg"}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to default avatar if image fails to load
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
                        <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 cursor-pointer">
                          <Camera size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProfilePictureChange}
                          />
                        </label>
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

                  {/* User Details */}
                  <div className="space-y-4 mb-6">
                    {/* Email */}
                    <div className="flex items-start">
                      <Mail className="w-5 h-5 mr-3 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p>{user.useremail}</p>
                      </div>
                    </div>

                    {/* Date of Birth */}
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

                    {/* Biography */}
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

                  {/* Teams */}
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

                  {/* Edit Profile Form */}
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

                  {/* Change Password Form */}
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

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {!isEditing && !isChangingPassword && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                        <Edit2 size={16} className="mr-2" />
                        Edit Profile
                      </button>
                    )}

                    {!isEditing && !isChangingPassword && !isGoogleUser && (
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                      >
                        <Lock size={16} className="mr-2" />
                        Change Password
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>

                    <button
                      onClick={handleDeleteAccount}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-900 hover:bg-red-800 rounded-md"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Account
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
