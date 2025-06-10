"use client"

import { useState, useEffect } from "react"
import { User, Mail, Calendar, Edit2, Lock, LogOut, Trash2, X, Camera, Save, AlertCircle } from "lucide-react"
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

      // Fetch full user data from API
      const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`)

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)

        // Initialize edit form with user data
        setEditedUser({
          username: userData.user.username || "",
          bio: userData.user.userbio || "",
          dob: userData.user.userdob ? userData.user.userdob.split("T")[0] : "",
          profilePicture: userData.user.userprofilepicture || "",
        })
      } else {
        console.error("Failed to fetch user data")
        navigate("/login")
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

  const handleLogout = () => {
    localStorage.removeItem("user")
    navigate("/login")
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
        return
      }

      const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        localStorage.removeItem("user")
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="bg-[#002147] text-white w-full max-w-80 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Profile</h2>
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

          {user ? (
            <>
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 mb-2">
                    {(isEditing ? editedUser.profilePicture : user.userprofilepicture) ? (
                      <img
                        src={isEditing ? editedUser.profilePicture : user.userprofilepicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-900">
                        <User size={40} className="text-blue-300" />
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 cursor-pointer">
                      <Camera size={16} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
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
                      <div key={team.teamid} className="bg-gray-800 rounded-md p-3">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">{team.teamname}</h5>
                          <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300">
                            {team.createdbyuserid === user.userid ? "Creator" : "Member"}
                          </span>
                        </div>
                        {team.teamdescription && <p className="text-sm text-gray-400 mt-1">{team.teamdescription}</p>}
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

                {!isEditing && !isChangingPassword && (
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
        </div>
      </div>
    </div>
  )
}

export default ProfileSidebar
