"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"

const AddItemModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("activity")

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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    if (activeTab === "activity") {
      console.log("Activity submitted:", activity)
    } else {
      console.log("Goal submitted:", { ...goal, timelines })
    }

    // Reset forms and close modal
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

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg border-[#005bc3] border-1 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
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
        </div>

        {/* Form content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {activeTab === "activity" ? (
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Activity
                </button>
              </div>
            </form>
          ) : (
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
                  <div key={index} className="border rounded-md p-4 mb-4 bg-gray-100">
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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Goal
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
