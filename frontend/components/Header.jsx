"use client"

import { Search, ChevronLeft, ChevronRight, User, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import googleAuthService from "../services/googleAuth"

const Header = ({ currentDate, setCurrentDate, onProfileClick }) => {
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])
  const [userProfileData, setUserProfileData] = useState(null)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  // Get user ID from localStorage or Google Auth
  const getUserId = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
    return storedUser.id || storedUser.userId || 1
  }

  // Get user info
  const fetchUser = async () => {
    try {
      // First try to get from Google Auth service
      const currentUser = googleAuthService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        return currentUser
      }

      // Fallback to localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      if (storedUser.id || storedUser.email) {
        setUser(storedUser)
        return storedUser
      }

      // If no user found, try to restore from existing auth
      const restoredUser = await googleAuthService.checkExistingAuth()
      if (restoredUser) {
        setUser(restoredUser)
        return restoredUser
      }

      console.log("No user found in storage or auth service")
      return null
    } catch (error) {
      console.error("Error fetching user in Header:", error)
      return null
    }
  }

  // Fetch all data for search
  useEffect(() => {
    fetchUser()
    fetchAllData()
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
        if (storedUser.id) {
          // Check if Google user
          const isGoogleUser = !!storedUser.googleId || !!storedUser.accessToken

          if (isGoogleUser) {
            // For Google users, try to get from API first, fallback to stored data
            try {
              const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`)
              if (response.ok) {
                const userData = await response.json()
                // If user has custom profile picture, use it; otherwise use Google's
                setUserProfileData({
                  imageUrl: userData.user.userprofilepicture || storedUser.imageUrl,
                  username: userData.user.username,
                  isGoogleUser: true,
                })
              } else {
                // Fallback to stored Google data
                setUserProfileData({
                  imageUrl: storedUser.imageUrl,
                  username: storedUser.username || storedUser.name,
                  isGoogleUser: true,
                })
              }
            } catch (error) {
              // Fallback to stored Google data
              setUserProfileData({
                imageUrl: storedUser.imageUrl,
                username: storedUser.username || storedUser.name,
                isGoogleUser: true,
              })
            }
          } else {
            // For regular users, fetch from API
            const response = await fetch(`http://localhost:5000/api/users/${storedUser.id}`)
            if (response.ok) {
              const userData = await response.json()
              setUserProfileData({
                imageUrl: userData.user.userprofilepicture,
                username: userData.user.username,
                isGoogleUser: false,
              })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    fetchUserProfile()
  }, [])

  const fetchAllData = async () => {
    try {
      const userId = getUserId()
      console.log("Fetching data for user ID:", userId)

      // Fetch activities
      const activitiesResponse = await fetch(`http://localhost:5000/api/activities?userId=${userId}`)
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      } else {
        console.error("Failed to fetch activities:", activitiesResponse.status)
      }

      // Fetch goals
      const goalsResponse = await fetch(`http://localhost:5000/api/goals?userId=${userId}`)
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(goalsData.goals || [])
      } else {
        console.error("Failed to fetch goals:", goalsResponse.status)
      }

      // Fetch teams
      const teamsResponse = await fetch(`http://localhost:5000/api/teams?userId=${userId}`)
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData.teams || [])
      } else {
        console.error("Failed to fetch teams:", teamsResponse.status)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  // Search function
  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const results = []
    const lowerQuery = query.toLowerCase()

    // Search activities
    activities.forEach((activity) => {
      if (activity.activitytitle?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: activity.activityid,
          type: "activity",
          title: activity.activitytitle,
          subtitle: `Activity - ${activity.activitydate}`,
          data: {
            id: activity.activityid,
            type: "activity",
            activitytitle: activity.activitytitle,
            activitydate: activity.activitydate,
            activitystarttime: activity.activitystarttime,
            activityendtime: activity.activityendtime,
            activitydescription: activity.activitydescription,
            activitycategory: activity.activitycategory,
            activityurgency: activity.activityurgency,
          },
        })
      }
    })

    // Search goal timelines
    goals.forEach((goal) => {
      if (goal.timelines) {
        goal.timelines.forEach((timeline) => {
          const goalTimelineTitle = `${goal.goaltitle} - ${timeline.timelinetitle}`
          if (
            goalTimelineTitle.toLowerCase().includes(lowerQuery) ||
            goal.goaltitle?.toLowerCase().includes(lowerQuery) ||
            timeline.timelinetitle?.toLowerCase().includes(lowerQuery)
          ) {
            results.push({
              id: goal.goalid,
              type: "goal",
              timelineId: timeline.timelineid,
              title: goalTimelineTitle,
              subtitle: `Goal - ${timeline.timelinestartdate} to ${timeline.timelineenddate}`,
              data: {
                id: goal.goalid,
                type: "goal",
                timelineId: timeline.timelineid,
                goaltitle: goal.goaltitle,
                timelinetitle: timeline.timelinetitle,
                timelinestartdate: timeline.timelinestartdate,
                timelineenddate: timeline.timelineenddate,
                timelinestarttime: timeline.timelinestarttime,
                timelineendtime: timeline.timelineendtime,
                goaldescription: goal.goaldescription,
                goalcategory: goal.goalcategory,
                goalprogress: goal.goalprogress,
                timelines: goal.timelines,
              },
            })
          }
        })
      }
    })

    // Search team meetings
    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          if (meeting.meetingtitle?.toLowerCase().includes(lowerQuery)) {
            results.push({
              id: meeting.teammeetingid,
              type: "meeting",
              title: meeting.meetingtitle,
              subtitle: `Meeting - ${team.teamname} - ${meeting.meetingdate}`,
              data: {
                id: meeting.teammeetingid,
                type: "meeting",
                meetingtitle: meeting.meetingtitle,
                meetingdate: meeting.meetingdate,
                meetingstarttime: meeting.meetingstarttime,
                meetingendtime: meeting.meetingendtime,
                meetingdescription: meeting.meetingdescription,
                teamname: team.teamname,
              },
            })
          }
        })
      }
    })

    // Sort results by relevance (exact matches first, then partial matches)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === lowerQuery
      const bExact = b.title.toLowerCase() === lowerQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return a.title.localeCompare(b.title)
    })

    setSearchResults(results.slice(0, 10)) // Limit to 10 results
    setShowResults(true)
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    performSearch(query)
  }

  // Handle search result click
  const handleResultClick = (result) => {
    // Clear search
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)

    // Navigate to the item's date
    let itemDate
    if (result.type === "activity") {
      itemDate = new Date(result.data.activitydate)
    } else if (result.type === "meeting") {
      itemDate = new Date(result.data.meetingdate)
    } else if (result.type === "goal") {
      itemDate = new Date(result.data.timelinestartdate)
    }

    if (itemDate) {
      setCurrentDate(new Date(itemDate))
    }

    // Highlight the item on calendar grid
    const highlightEvent = new CustomEvent("highlightCalendarItem", {
      detail: {
        id: result.id,
        type: result.type,
        timelineId: result.timelineId || null,
      },
    })
    window.dispatchEvent(highlightEvent)

    // Highlight the item in sidebar
    const sidebarEvent = new CustomEvent("highlightSidebarItem", {
      detail: {
        id: result.id,
        type: result.type,
        timelineId: result.timelineId || null,
      },
    })
    window.dispatchEvent(sidebarEvent)

    // Show info modal
    setTimeout(() => {
      // Prepare complete item data for info modal
      let completeItemData = result.data

      if (result.type === "goal") {
        // For goals, ensure we have the complete structure
        completeItemData = {
          ...result.data,
          id: result.id,
          type: "goal",
          timelineId: result.timelineId,
        }
      } else if (result.type === "activity") {
        completeItemData = {
          ...result.data,
          id: result.id,
          type: "activity",
        }
      } else if (result.type === "meeting") {
        completeItemData = {
          ...result.data,
          id: result.id,
          type: "meeting",
        }
      }

      const infoEvent = new CustomEvent("showInfoModal", {
        detail: { item: completeItemData },
      })
      window.dispatchEvent(infoEvent)
    }, 500)
  }

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const navigateToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const navigateToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const formatMonthYear = () => {
    return currentDate.toLocaleString("default", { month: "long", year: "numeric" })
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }
  
  return (
    <div className="flex justify-between items-center p-4 border-b">
      {/* Navigation Section */}
      <div className="flex items-center space-x-4">
        <button onClick={navigateToPreviousMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <button onClick={navigateToNextMonth} className="p-1 rounded-full hover:bg-gray-100">
          <ChevronRight size={20} />
        </button>
        <h1 className="text-xl font-medium">{formatMonthYear()}</h1>
      </div>

      {/* Search and Profile */}
      <div className="flex items-center space-x-4">
        <div className="relative" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search activities, goals, meetings..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowResults(true)}
            className="pl-10 pr-10 py-2 bg-gray-100 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div
              ref={resultsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
            >
              {searchResults.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}-${result.timelineId || index}`}
                  onClick={() => handleResultClick(result)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 truncate">{result.title}</div>
                  <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {showResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
              <div className="text-gray-500 text-center">No results found for "{searchQuery}"</div>
            </div>
          )}
        </div>

        <button
          onClick={onProfileClick}
          className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-500"
        >
          {userProfileData?.imageUrl ? (
            <img
              src={userProfileData.imageUrl}
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
            style={{ display: userProfileData?.imageUrl ? "none" : "flex" }}
          >
            <User size={20} className="text-blue-300" />
          </div>
        </button>
      </div>
    </div>
  )
}

export default Header
