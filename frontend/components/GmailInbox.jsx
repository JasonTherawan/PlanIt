"use client"

import { useState, useEffect, useRef } from "react"
import { X, Mail, Reply, Forward, Calendar, Search, RefreshCw, AlertCircle, Trash2 } from "lucide-react"
import googleAuthService from "../services/googleAuth"
import gmailService from "../services/gmailService"
import aiService from "../services/aiService"

const GmailInbox = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [forwardTo, setForwardTo] = useState("")
  const [forwardText, setForwardText] = useState("")
  const [isProcessingAI, setIsProcessingAI] = useState(false)
  const [authError, setAuthError] = useState("")
  const [nextPageToken, setNextPageToken] = useState(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const iframeRef = useRef(null)

  const decodeHtmlEntities = (text) => {
    // This is a browser-only solution
    if (typeof window === 'undefined') {
      return text
    }
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }

  useEffect(() => {
    if (isOpen) {
      initializeGmail()
    }
  }, [isOpen])

  // When a new message is selected, update the iframe content and add the click listener
  useEffect(() => {
    const iframe = iframeRef.current
    if (selectedMessage && iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow.document
      doc.open()
      doc.write(selectedMessage.body)
      doc.close()

      const handleLinkClick = (event) => {
        const link = event.target.closest('a')
        if (link && link.href) {
          event.preventDefault()
          window.open(link.href, '_blank', 'noopener,noreferrer')
        }
      }
      
      doc.addEventListener('click', handleLinkClick)

      return () => {
        doc.removeEventListener('click', handleLinkClick)
      }
    }
  }, [selectedMessage])

  const initializeGmail = async () => {
    try {
      setIsLoading(true)
      setAuthError("")

      console.log("Initializing Gmail...")

      await googleAuthService.initialize()

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      const isGoogleUser = !!storedUser.googleId || !!storedUser.accessToken

      if (!isGoogleUser) {
        setAuthError("Gmail access requires Google Sign In")
        setIsLoading(false)
        return
      }

      if (!googleAuthService.isSignedIn()) {
        console.log("User not signed in with Google, attempting to sign in...")
        try {
          await googleAuthService.signIn()
        } catch (error) {
          console.error("Google sign-in failed:", error)
          setAuthError("Please sign in with Google to access Gmail")
          return
        }
      }

      const accessToken = googleAuthService.getAccessToken()
      if (!accessToken) {
        setAuthError("No access token available. Please sign in with Google.")
        return
      }
      
      if (googleAuthService.gapi) {
        gmailService.setGapi(googleAuthService.gapi)
      } else {
        throw new Error("Google API not initialized")
      }

      await loadMessages()
    } catch (error) {
      console.error("Error initializing Gmail:", error)
      setAuthError(`Failed to initialize Gmail: ${error.message || 'An unknown error occurred'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (query = "", pageToken = null) => {
    const loadingMore = pageToken !== null
    if (loadingMore) {
        setIsLoadingMore(true)
    } else {
        setIsLoading(true)
    }
    setAuthError("")

    try {
      const accessToken = googleAuthService.getAccessToken()
      if (!accessToken) {
        throw new Error("No access token available")
      }

      if (googleAuthService.gapi) {
        googleAuthService.gapi.client.setToken({ access_token: accessToken })
      }

      const { messages: fetchedMessages, nextPageToken: newNextPageToken } = await gmailService.getMessages(50, query, pageToken)

      if (loadingMore) {
        setMessages((prev) => [...prev, ...fetchedMessages])
      } else {
        setMessages(fetchedMessages)
      }
      setNextPageToken(newNextPageToken)
    } catch (error) {
      console.error("Error loading messages:", error)
      if (error.message && error.message.includes("401")) {
        setAuthError("Authentication expired. Please refresh and sign in again.")
      } else {
        setAuthError(`Failed to load messages: ${error.message || 'An unknown error occurred'}`)
      }
    } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
    }
  }

  const handleSearch = () => {
    setSelectedMessage(null)
    loadMessages(searchQuery)
  }

  const handleRefresh = () => {
    setSelectedMessage(null)
    setSearchQuery("")
    loadMessages()
  }

  const handleLoadMore = () => {
    if (nextPageToken) {
        loadMessages(searchQuery, nextPageToken)
    }
  }

  const handleMessageClick = async (message) => {
    setSelectedMessage(message)

    if (message.isUnread) {
      try {
        await gmailService.markAsRead(message.id)
        setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isUnread: false } : m)))
      } catch (error) {
        console.error("Error marking message as read:", error)
      }
    }
  }
  
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return

    if (window.confirm("Are you sure you want to delete this email?")) {
      try {
        setIsLoading(true)
        await gmailService.deleteMessage(selectedMessage.id)
        
        setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id))
        setSelectedMessage(null)

        alert("Email moved to trash.")
      } catch (error) {
        console.error("Error deleting email:", error)
        alert("Failed to delete email.")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return

    try {
      setIsLoading(true)
      await gmailService.sendReply(selectedMessage, replyText)
      setShowReplyModal(false)
      setReplyText("")
      alert("Reply sent successfully!")
    } catch (error) {
      console.error("Error sending reply:", error)
      alert("Failed to send reply")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForward = async () => {
    if (!selectedMessage || !forwardTo.trim()) return

    try {
      setIsLoading(true)
      await gmailService.forwardEmail(selectedMessage, forwardTo, forwardText)
      
      setShowForwardModal(false)
      setForwardTo("")
      setForwardText("")
      alert("Email forwarded successfully!")

      setSelectedMessage(null)
      setSearchQuery("")
      await loadMessages()
    } catch (error) {
      console.error("Error forwarding email:", error)
      alert("Failed to forward email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForwardToPlanner = async () => {
    if (!selectedMessage) return

    try {
      setIsProcessingAI(true)

      // Analyze email content with AI
      const emailContent = `Subject: ${selectedMessage.subject}\n\nFrom: ${selectedMessage.from}\n\nContent:\n${selectedMessage.body}`
      const aiResult = await aiService.analyzeEmailForEvents(emailContent)

      if (aiResult.hasEvent && aiResult.events.length > 0) {
        // Process each detected event
        let createdCount = 0
        for (const event of aiResult.events) {
          try {
            const user = JSON.parse(localStorage.getItem("user") || "{}")
            const userId = user.id

            const activityData = {
              userId: userId,
              activityTitle: event.title,
              activityDescription: `${event.description}\n\nCreated from email: ${selectedMessage.subject}`,
              activityCategory: event.category || "work",
              activityUrgency: event.urgency || "medium",
              activityDate: event.date,
              activityStartTime: event.startTime,
              activityEndTime: event.endTime,
            }

            const response = await fetch("http://localhost:5000/api/activities", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(activityData),
            })

            if (response.ok) {
              createdCount++
            } else {
              console.error("Failed to create event from email")
            }
          } catch (error) {
            console.error("Error creating event from email:", error)
          }
        }

        if (createdCount > 0) {
          alert(`Successfully created ${createdCount} event(s) from this email!`)
          const refreshEvent = new CustomEvent("refreshCalendarData")
          window.dispatchEvent(refreshEvent)
        } else {
          alert("Failed to create events from this email.")
        }
      } else {
        alert("No event information detected in this email.")
      }
    } catch (error) {
      console.error("Error processing email with AI:", error)
      alert("Failed to process email. Please try again.")
    } finally {
      setIsProcessingAI(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden flex">
        {/* Header */}
        <div className="w-full flex flex-col">
          <div className="flex justify-between items-center p-3 border-b bg-gray-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Mail className="text-blue-700" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Gmail Inbox</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error Display */}
          {authError && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="text-red-500" size={16} />
                  <p className="text-red-700 text-sm">{authError}</p>
                </div>
                <button
                  onClick={initializeGmail}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-1 overflow-hidden">
            {/* Email List Column */}
            <div className="w-1/3 border-r bg-gray-100 flex flex-col">
              {/* Search Controls */}
              <div className="p-2 border-b bg-gray-100">
                  <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                      <input
                          type="text"
                          placeholder="Search emails..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      </div>
                      <button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Refresh"
                      >
                      <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                      </button>
                  </div>
              </div>

              {/* Scrollable Email List */}
              <div className="flex-1 overflow-y-auto">
                {isLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500 flex items-center space-x-2">
                      <RefreshCw className="animate-spin" size={16} />
                      <span>Loading emails...</span>
                    </div>
                  </div>
                ) : authError ? (
                  <div className="flex items-center justify-center h-32 p-4">
                    <div className="text-red-500 text-center">
                      <AlertCircle className="mx-auto mb-2" size={24} />
                      <p className="font-medium">Unable to load emails</p>
                      <button
                        onClick={initializeGmail}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500 text-center">
                      <Mail className="mx-auto mb-2" size={24} />
                      <p>No emails found</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-4 cursor-pointer hover:bg-gray-200 transition-colors ${
                          selectedMessage?.id === message.id ? "bg-blue-100 border-r-4 border-blue-500" : ""
                        } ${message.isUnread ? "font-semibold" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div
                                className={`text-sm ${message.isUnread ? "font-bold" : "font-medium"} text-gray-900 truncate`}
                              >
                                {decodeHtmlEntities(message.from.split("<")[0].trim() || message.from)}
                              </div>
                              {message.isUnread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>}
                            </div>
                            <div
                              className={`text-sm ${message.isUnread ? "font-semibold" : ""} text-gray-700 truncate mb-1`}
                            >
                              {decodeHtmlEntities(message.subject)}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{decodeHtmlEntities(message.snippet)}</div>
                          </div>
                          <div className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatDate(message.date)}</div>
                        </div>
                      </div>
                    ))}
                    {nextPageToken && (
                      <div className="p-4 text-center">
                          <button onClick={handleLoadMore} disabled={isLoadingMore} className="text-blue-600 hover:underline">
                              {isLoadingMore ? 'Loading...' : 'Load More'}
                          </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Email Content */}
            <div className="flex-1 flex flex-col bg-white min-w-0">
              {selectedMessage ? (
                <>
                  {/* Email Header */}
                  <div className="p-4 border-b bg-gray-100 flex-shrink-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{decodeHtmlEntities(selectedMessage.subject)}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <span className="font-medium w-12">From:</span>
                            <span className="ml-2">{selectedMessage.from}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium w-12">Date:</span>
                            <span className="ml-2">{formatDate(selectedMessage.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setShowReplyModal(true)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Reply"
                        >
                          <Reply size={18} />
                        </button>
                        <button
                          onClick={() => setShowForwardModal(true)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Forward"
                        >
                          <Forward size={18} />
                        </button>
                        <button
                          onClick={handleDeleteMessage}
                          disabled={isLoading}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={handleForwardToPlanner}
                          disabled={isProcessingAI}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center space-x-2 transition-colors"
                          title="Forward to Planner App"
                        >
                          <Calendar size={16} />
                          <span>{isProcessingAI ? "Processing..." : "To Planner"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="flex-1 overflow-auto">
                    <iframe
                      ref={iframeRef}
                      className="w-full h-full border-0"
                      title="Email Content"
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Mail className="mx-auto mb-4" size={48} />
                    <p className="text-lg">
                      {authError ? "Please resolve authentication issues first" : "Select an email to read"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg text-black font-semibold">Reply to: {selectedMessage?.subject}</h3>
              <button onClick={() => setShowReplyModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows="8"
                className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t bg-gray-100">
              <button
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={isLoading || !replyText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isLoading ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg text-black font-semibold">Forward: {selectedMessage?.subject}</h3>
              <button onClick={() => setShowForwardModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                <input
                  type="email"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full p-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional message (optional):</label>
                <textarea
                  value={forwardText}
                  onChange={(e) => setForwardText(e.target.value)}
                  placeholder="Add a message..."
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t bg-gray-100">
              <button
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={isLoading || !forwardTo.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {isLoading ? "Forwarding..." : "Forward"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GmailInbox
