"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react"

const EditItemModal = ({ isOpen, onClose, item }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

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
      timelineId: null,
      timelineTitle: "",
      timelineStartDate: "",
      timelineEndDate: "",
      timelineStartTime: "",
      timelineEndTime: "",
    },
  ])

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      if (item.type === "activity") {
        setActivity({
          activityTitle: item.activitytitle || "",
          activityDescription: item.activitydescription || "",
          activityCategory: item.activitycategory || "",
          activityUrgency: item.activityurgency || "medium",
          activityDate: item.activitydate || "",
          activityStartTime: item.activitystarttime || "",
          activityEndTime: item.activityendtime || "",
        })
      } else if (item.type === "goal") {
        setGoal({
          goalTitle: item.goaltitle || "",
          goalDescription: item.goaldescription || "",
          goalCategory: item.goalcategory || "",
          goalProgress: item.goalprogress || "not-started",
        })

        if (item.timelines && item.timelines.length > 0) {
          setTimelines(
            item.timelines.map((timeline) => ({
              timelineId: timeline.timelineid,
              timelineTitle: timeline.timelinetitle || "",
              timelineStartDate: timeline.timelinestartdate || "",
              timelineEndDate: timeline.timelineenddate || "",
              timelineStartTime: timeline.timelinestarttime || "",
              timelineEndTime: timeline.timelineendtime || "",
            })),
          )
        }
      }
    }
  }, [item])

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
        timelineId: null,
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      if (item.type === "activity") {
        // Validate activity form
        if (!validateActivityForm()) {
          setIsLoading(false)
          return
        }

        // Prepare activity data for API
        const activityData = {
          activityTitle: activity.activityTitle,
          activityDescription: activity.activityDescription,
          activityCategory: activity.activityCategory,
          activityUrgency: activity.activityUrgency,
          activityDate: activity.activityDate,
          activityStartTime: activity.activityStartTime,
          activityEndTime: activity.activityEndTime,
        }

        // Make API call to update activity
        const response = await fetch(`http://localhost:5000/api/activities/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(activityData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Activity updated successfully:", data)
          setSuccessMessage("Activity updated successfully!")

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update activity:", data)
          setApiError(data.message || "Failed to update activity. Please try again.")
        }
      } else if (item.type === "goal") {
        // Validate goal form
        if (!validateGoalForm()) {
          setIsLoading(false)
          return
        }

        // Prepare goal data for API
        const goalData = {
          goalTitle: goal.goalTitle,
          goalDescription: goal.goalDescription,
          goalCategory: goal.goalCategory,
          goalProgress: goal.goalProgress,
          timelines: timelines.map((timeline) => ({
            timelineId: timeline.timelineId,
            timelineTitle: timeline.timelineTitle,
            timelineStartDate: timeline.timelineStartDate,
            timelineEndDate: timeline.timelineEndDate,
            timelineStartTime: timeline.timelineStartTime,
            timelineEndTime: timeline.timelineEndTime,
          })),
        }

        // Make API call to update goal
        const response = await fetch(`http://localhost:5000/api/goals/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(goalData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Goal updated successfully:", data)
          setSuccessMessage("Goal updated successfully!")

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update goal:", data)
          setApiError(data.message || "Failed to update goal. Please try again.")
        }
      } else if (item.type === "meeting") {
        // Validate meeting form
        if (!item.meetingtitle?.trim()) {
          setApiError("Meeting title is required")
          setIsLoading(false)
          return
        }
        if (!item.meetingdate) {
          setApiError("Meeting date is required")
          setIsLoading(false)
          return
        }

        // Prepare meeting data for API
        const meetingData = {
          meetingTitle: item.meetingtitle,
          meetingDescription: item.meetingdescription,
          meetingDate: item.meetingdate,
          meetingStartTime: item.meetingstarttime,
          meetingEndTime: item.meetingendtime,
        }

        // Make API call to update meeting
        const response = await fetch(`http://localhost:5000/api/meetings/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(meetingData),
        })

        const data = await response.json()

        if (response.ok) {
          console.log("Meeting updated successfully:", data)
          setSuccessMessage("Meeting updated successfully!")

          // Close modal after a delay
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          console.error("Failed to update meeting:", data)
          setApiError(data.message || "Failed to update meeting. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      setApiError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const [editingItem, setEditingItem] = useState(item)

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-[#005bc3] border-1 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit {item.type === "activity" ? "Activity" : item.type === "goal" ? "Goal" : "Meeting"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
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
          {item.type === "activity" ? (
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
                  {isLoading ? "Updating..." : "Update Activity"}
                </button>
              </div>
            </form>
          ) : item.type === "goal" ? (
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
                  {isLoading ? "Updating..." : "Update Goal"}
                </button>
              </div>
            </form>
          ) : item.type === "meeting" ? (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
                  <input
                    type="text"
                    value={item.meetingtitle || ""}
                    onChange={(e) => setEditingItem({ ...item, meetingtitle: e.target.value })}
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={item.meetingdescription || ""}
                    onChange={(e) => setEditingItem({ ...item, meetingdescription: e.target.value })}
                    rows="3"
                    className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={item.meetingdate || ""}
                    onChange={(e) => setEditingItem({ ...item, meetingdate: e.target.value })}
                    className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={item.meetingstarttime || ""}
                      onChange={(e) => setEditingItem({ ...item, meetingstarttime: e.target.value })}
                      className="text-gray-700 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={item.meetingendtime || ""}
                      onChange={(e) => setEditingItem({ ...item, meetingendtime: e.target.value })}
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
                  {isLoading ? "Updating..." : "Update Meeting"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default EditItemModal
