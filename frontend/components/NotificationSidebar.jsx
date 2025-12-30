"use client"

import { useState, useEffect, useRef } from "react"
import { X, Bell, Check, Users, Calendar, Trash2 } from "lucide-react"

const NotificationSidebar = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const sidebarRef = useRef(null)

  const getUserId = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
    return storedUser.id || storedUser.userId || null
  }

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

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const userId = getUserId()
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        setError("Failed to fetch notifications")
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Error fetching notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.notificationid === notificationId ? { ...notif, isread: true } : notif)),
        )
        window.dispatchEvent(new CustomEvent("notificationsUpdated"))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleInvitationResponse = async (meetingId, response) => {
    try {
      const userId = getUserId()
      const apiResponse = await fetch(`/api/meeting-invitations/${meetingId}/respond`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ response, userId }),
      })

      if (apiResponse.ok) {
        // Update the notification status locally
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.relatedid === meetingId ? { ...notif, invitationstatus: response, isread: true } : notif,
          ),
        )
        window.dispatchEvent(new CustomEvent("notificationsUpdated"))
      } else {
        setError("Failed to respond to invitation")
      }
    } catch (error) {
      console.error("Error responding to invitation:", error)
      setError("Error responding to invitation")
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setNotifications((prev) => prev.filter((notif) => notif.notificationid !== notificationId))
      } else {
        setError("Failed to delete notification")
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      setError("Error deleting notification")
    }
  }
  
  const markAllAsRead = async () => {
    try {
      const userId = getUserId()
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, isread: true })))
        window.dispatchEvent(new CustomEvent("notificationsUpdated"))
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "meeting_invitation":
        return <Users size={16} className="text-blue-400" />
      case "meeting_reminder":
        return <Calendar size={16} className="text-green-400" />
      case "team_update":
        return <Users size={16} className="text-purple-400" />
      case "member_left_team":
      case "team_deleted":
      case "meeting_removed":
      case "meeting_canceled":
        return <Users size={16} className="text-red-400" />
      default:
        return <Bell size={16} className="text-gray-400" />
    }
  }

  // Check if invitation can be responded to
  const canRespondToInvitation = (notification) => {
    return (
      notification.type === "meeting_invitation" &&
      notification.relatedid &&
      (!notification.invitationstatus || notification.invitationstatus === "pending")
    )
  }

  const getInvitationStatusDisplay = (notification) => {
    if (
      notification.type !== "meeting_invitation" || 
      !notification.invitationstatus ||
      (notification.invitationstatus === "accepted" && notification.invitationtype === "mandatory")
    ) {
      return null
    }

    const status = notification.invitationstatus
    if (status === "pending") {
      return null // Don't show pending status, show buttons instead
    }

    return (
      <span
        className={`text-xs px-2 py-1 rounded ${
          status === "accepted" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
        }`}
      >
        {status === "accepted" ? "Accepted" : "Declined"}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        ref={sidebarRef}
        className="bg-white border-l border-gray-200 w-full max-w-80 h-full overflow-y-auto shadow-lg"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <Bell size={20} className="mr-2 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.some((n) => !n.isread) && (
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800">
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.notificationid}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isread ? "bg-gray-50 border-gray-200" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      {getNotificationIcon(notification.type)}
                      <h4 className="font-medium text-gray-800 ml-2 text-sm">{notification.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.isread && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      <span className="text-xs text-gray-500">{formatDate(notification.createdat)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{notification.message}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {canRespondToInvitation(notification) ? (
                        <>
                          <button
                            onClick={() => handleInvitationResponse(notification.relatedid, "accepted")}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center"
                          >
                            <Check size={12} className="mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleInvitationResponse(notification.relatedid, "declined")}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center"
                          >
                            <X size={12} className="mr-1" />
                            Decline
                          </button>
                        </>
                      ) : (
                        getInvitationStatusDisplay(notification)
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {!notification.isread && (
                        <button
                          onClick={() => markAsRead(notification.notificationid)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Check size={12} className="mr-1" />
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.notificationid)}
                        className="text-xs text-red-600 hover:text-red-800 flex items-center"
                        title="Delete notification"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationSidebar
