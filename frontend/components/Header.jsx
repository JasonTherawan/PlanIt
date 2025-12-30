"use client"

import { Search, ChevronLeft, ChevronRight, User, X, Bell } from "lucide-react"
import { useState, useEffect, useRef } from "react"
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Header = ({ currentDate, setCurrentDate, onProfileClick, onNotificationClick, dataUpdateTrigger }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [activities, setActivities] = useState([])
  const [goals, setGoals] = useState([])
  const [teams, setTeams] = useState([])
  const [userProfileData, setUserProfileData] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const searchRef = useRef(null)

  const getUserId = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
    return storedUser.id || storedUser.userId || null
  }

  const fetchNotifications = async () => {
    try {
      const userId = getUserId()
      if (!userId) return;
      const response = await fetch(`/api/notifications?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      if (!storedUser.id) return

      const response = await fetch(`/api/users/${storedUser.id}`)
      if (response.ok) {
        const { user: apiUser } = await response.json()
        setUserProfileData({
          imageUrl: apiUser.userprofilepicture || null,
          username: apiUser.username,
          isGoogleUser: !!apiUser.isgoogleuser,
        })
      } else {
         setUserProfileData({
          imageUrl: null,
          username: storedUser.name || storedUser.username,
          isGoogleUser: !!storedUser.googleId || !!storedUser.accessToken,
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      if (storedUser.id) {
          setUserProfileData({
              imageUrl: null,
              username: storedUser.name || storedUser.username,
              isGoogleUser: !!storedUser.googleId || !!storedUser.accessToken,
          })
      }
    }
  }

  useEffect(() => {
    fetchAllData()
    fetchNotifications()
    fetchUserProfile()

    const notificationInterval = setInterval(fetchNotifications, 30000)
    
    const handleNotificationsUpdate = () => fetchNotifications()
    window.addEventListener("notificationsUpdated", handleNotificationsUpdate)

    const handleProfileUpdate = () => fetchUserProfile()
    window.addEventListener("profileUpdated", handleProfileUpdate)

    return () => {
      clearInterval(notificationInterval)
      window.removeEventListener("notificationsUpdated", handleNotificationsUpdate)
      window.removeEventListener("profileUpdated", handleProfileUpdate)
    }
  }, [dataUpdateTrigger])

  const fetchAllData = async () => {
    try {
      const userId = getUserId()
      if (!userId) return;

      const [activitiesRes, goalsRes, teamsRes] = await Promise.all([
        fetch(`/api/activities?userId=${userId}`),
        fetch(`/api/goals?userId=${userId}`),
        fetch(`/api/teams?userId=${userId}`)
      ]);
      
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData.activities || [])
      } else {
        console.error("Failed to fetch activities:", activitiesRes.status)
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData.goals || [])
      } else {
        console.error("Failed to fetch goals:", goalsRes.status)
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData.teams || [])
      } else {
        console.error("Failed to fetch teams:", teamsRes.status)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const performSearch = (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const results = []
    const lowerQuery = query.toLowerCase()

    activities.forEach((activity) => {
      if (activity.activitytitle?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: activity.activityid,
          type: "activity",
          title: activity.activitytitle,
          subtitle: `Activity - ${activity.activitydate}`,
          data: activity,
        })
      }
    })

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
              data: { ...goal, ...timeline },
            })
          }
        })
      }
    })

    teams.forEach((team) => {
      if (team.meetings) {
        team.meetings.forEach((meeting) => {
          if (meeting.meetingtitle?.toLowerCase().includes(lowerQuery)) {
            results.push({
              id: meeting.teammeetingid,
              type: "meeting",
              title: meeting.meetingtitle,
              subtitle: `Meeting - ${team.teamname} - ${meeting.meetingdate}`,
              data: { ...meeting, teamname: team.teamname },
            })
          }
        })
      }
    })

    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === lowerQuery
      const bExact = b.title.toLowerCase() === lowerQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return a.title.localeCompare(b.title)
    })

    setSearchResults(results.slice(0, 10))
    setShowResults(true)
  }

  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    performSearch(query)
  }

  const handleResultClick = (result) => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)

    let itemDate;
    if (result.type === "activity") {
      itemDate = new Date(result.data.activitydate);
    } else if (result.type === "meeting") {
      itemDate = new Date(result.data.meetingdate);
    } else if (result.type === "goal") {
      itemDate = new Date(result.data.timelinestartdate);
    }

    if (itemDate) {
      setCurrentDate(new Date(itemDate));
    }

    const highlightDetail = {
      id: result.id,
      type: result.type,
      timelineId: result.timelineId || null,
    };

    window.dispatchEvent(new CustomEvent("highlightCalendarItem", { detail: highlightDetail }));
    window.dispatchEvent(new CustomEvent("highlightSidebarItem", { detail: highlightDetail }));

    setTimeout(() => {
      const completeItemData = { ...result.data, id: result.id, type: result.type, timelineId: result.timelineId || null };
      window.dispatchEvent(new CustomEvent("showInfoModal", { detail: { item: completeItemData } }));
    }, 500);
  }

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
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  const navigateToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
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
    <div className="relative flex justify-between items-center p-4 border-b">
      <div className="flex items-center space-x-4">
        <button onClick={navigateToPreviousMonth} className="p-1 rounded-full hover:bg-gray-200">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-medium">{formatMonthYear()}</h1>
        <button onClick={navigateToNextMonth} className="p-1 rounded-full hover:bg-gray-200">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative rounded-lg hover:ring-2 hover:ring-gray-400" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search activities, goals, meetings..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowResults(true)}
            className="pl-10 pr-10 py-2 bg-gray-100 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}

          {showResults && searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
            >
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}-${result.timelineId || ''}`}
                  onClick={() => handleResultClick(result)}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 truncate">{result.title}</div>
                  <div className="text-sm text-gray-500 truncate">{result.subtitle}</div>
                </div>
              ))}
            </div>
          )}

          {showResults && searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
              <div className="text-gray-500 text-center">No results found for "{searchQuery}"</div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={onNotificationClick}
            className="p-2 rounded-full hover:bg-gray-200 relative"
            title="Notifications"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        <button onClick={onProfileClick} className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden hover:ring-2 hover:ring-gray-400">
          {userProfileData?.imageUrl ? (
            <img
              src={userProfileData.imageUrl}
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
