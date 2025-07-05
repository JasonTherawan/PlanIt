// AI service for analyzing emails and extracting event information using Google Gemini
class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY
    this.apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
  }

  async analyzeEmailForEvents(emailContent) {
    try {
      // If no Gemini API key is configured, return no events
      if (!this.apiKey) {
        console.log("No Gemini API key configured")
        return {
          hasEvent: false,
          events: [],
        }
      }

      const prompt = `
        Analyze the following email content and extract any meeting, appointment, or event information.
        
        IMPORTANT: Only extract events if there is CLEAR, SPECIFIC event information with dates and times.
        Do NOT create events for general mentions or vague references.
        
        Return a JSON response with the following structure:
        {
          "hasEvent": boolean,
          "events": [
            {
              "title": "string",
              "description": "string", 
              "date": "YYYY-MM-DD",
              "startTime": "HH:MM" (24-hour format),
              "endTime": "HH:MM" (24-hour format),
              "category": "work|personal|meeting|appointment",
              "urgency": "low|medium|high|urgent"
            }
          ]
        }

        Rules:
        1. Only extract events with specific dates and times
        2. If no clear event information exists, return hasEvent: false with empty events array
        3. Do not create events for general discussions about scheduling
        4. Dates must be specific (not "next week" or "soon")
        5. Times must be specific (not "morning" or "afternoon")

        Email content:
        ${emailContent}
      `

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1000,
        },
      }

      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response from Gemini API")
      }

      const aiResponse = data.candidates[0].content.parts[0].text

      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          console.log("No JSON found in Gemini response")
          return {
            hasEvent: false,
            events: [],
          }
        }

        const parsedResponse = JSON.parse(jsonMatch[0])

        // Validate the response structure
        if (typeof parsedResponse.hasEvent !== "boolean") {
          console.log("Invalid response structure from Gemini")
          return {
            hasEvent: false,
            events: [],
          }
        }

        // If no events detected, return early
        if (!parsedResponse.hasEvent || !parsedResponse.events || parsedResponse.events.length === 0) {
          return {
            hasEvent: false,
            events: [],
          }
        }

        // Validate each event has required fields
        const validEvents = parsedResponse.events.filter((event) => {
          return (
            event.title &&
            event.date &&
            event.startTime &&
            event.endTime &&
            this.isValidDate(event.date) &&
            this.isValidTime(event.startTime) &&
            this.isValidTime(event.endTime)
          )
        })

        return {
          hasEvent: validEvents.length > 0,
          events: validEvents,
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError)
        return {
          hasEvent: false,
          events: [],
        }
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return {
        hasEvent: false,
        events: [],
      }
    }
  }

  async findOptimalMeetingTimes(teamMembers, dateRange, duration, workingHours, creatorPreference, memberSchedules) {
    try {
      // If no Gemini API key is configured, return empty suggestions
      if (!this.apiKey) {
        console.log("No Gemini API key configured")
        return {
          success: false,
          suggestions: [],
          error: "AI service not configured",
        }
      }

      // Create detailed schedule analysis for each member
      const memberScheduleAnalysis = {}
      Object.keys(memberSchedules).forEach((userId) => {
        const member = teamMembers.find((m) => m.userid === userId)
        const memberName = member ? member.username : userId

        const schedule = memberSchedules[userId]
        const conflicts = []

        // Add activities as conflicts
        schedule.activities.forEach((activity) => {
          conflicts.push({
            type: "activity",
            title: activity.activitytitle,
            date: activity.activitydate,
            startTime: activity.activitystarttime,
            endTime: activity.activityendtime,
            urgency: activity.activityurgency,
          })
        })

        // Add goal timelines as conflicts
        schedule.goals.forEach((goal) => {
          goal.timelines.forEach((timeline) => {
            conflicts.push({
              type: "goal",
              title: `${goal.goaltitle} - ${timeline.timelinetitle}`,
              startDate: timeline.timelinestartdate,
              endDate: timeline.timelineenddate,
              startTime: timeline.timelinestarttime,
              endTime: timeline.timelineendtime,
            })
          })
        })

        // Add team meetings as conflicts
        schedule.meetings.forEach((meeting) => {
          conflicts.push({
            type: "meeting",
            title: meeting.meetingtitle,
            date: meeting.meetingdate,
            startTime: meeting.meetingstarttime,
            endTime: meeting.meetingendtime,
          })
        })

        memberScheduleAnalysis[memberName] = conflicts
      })

      const prompt = `
        You are an intelligent meeting scheduler. Your task is to analyze team member schedules and suggest the best times for a new meeting.

        **Team & Meeting Details:**
        - **Team Members:** ${teamMembers.map((m) => m.username).join(", ")}
        - **Date Range:** ${dateRange.startDate} to ${dateRange.endDate}
        - **Meeting Duration:** ${duration} minutes
        - **Working Hours:** ${workingHours.start} to ${workingHours.end}
        - **Creator's Preference:** "${creatorPreference}"

        **Detailed Member Schedules & Conflicts:**
        ${JSON.stringify(memberScheduleAnalysis, null, 2)}

        **Critical Instructions:**
        1.  **Prioritize Standard Start Times:** Suggestions should start on the hour or half-hour (e.g., 09:00, 09:30, 10:00).
        2.  **Prioritize No-Conflict Times:** The best suggestions are times with zero conflicts. These should have the highest scores.
        3.  **Allow Low-Impact Conflicts:** You MAY suggest times that conflict with low-urgency activities, but these suggestions MUST receive a lower score. Clearly state the conflict in the "reasoning".
        4.  **Strictly Avoid High-Urgency Conflicts:** NEVER suggest a time that conflicts with another meeting, a goal with specific hours, or a high/urgent activity.
        5.  **Working Hours:** All suggestions must be within the specified working hours.
        6.  **Provide 5-10 Suggestions:** Generate a list of the best possible times, sorted by score.
        7.  **Scoring:** Use the provided scoring system to rate each suggestion accurately.

        **Scoring System (0-100):**
        - **Base Score:** 100
        - **Penalties:**
            -   **-20 points** for each conflict with a "medium" urgency activity.
            -   **-10 points** for each conflict with a "low" urgency activity.
            -   **-10 points** for scheduling during a typical lunch hour (12:00-13:00).
            -   **-10 points** if the time does not match the creator's preference.

        **Output Format:**
        Return a JSON object with the following structure. Ensure the JSON is valid.
        {
          "success": true,
          "suggestions": [
            {
              "date": "YYYY-MM-DD",
              "startTime": "HH:MM",
              "endTime": "HH:MM",
              "score": 85,
              "reasoning": "A brief explanation of why this time was chosen and any potential conflicts.",
              "conflicts": ["List of any conflicts, or an empty array."],
              "advantages": ["List of positive aspects, like 'All members available' or 'Matches creator preference'."],
              "memberAvailability": {
                "memberName": "available" 
              }
            }
          ]
        }
      `

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2, 
          topK: 1,
          topP: 1,
          maxOutputTokens: 3000,
        },
      }

      const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response from Gemini API")
      }

      const aiResponse = data.candidates[0].content.parts[0].text

      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          console.log("No JSON found in Gemini response:", aiResponse)
          return {
            success: false,
            suggestions: [],
            error: "Invalid AI response format",
          }
        }

        const parsedResponse = JSON.parse(jsonMatch[0])

        // Validate the response structure
        if (!parsedResponse.success || !Array.isArray(parsedResponse.suggestions)) {
          console.log("Invalid response structure from Gemini:", parsedResponse)
          return {
            success: false,
            suggestions: [],
            error: "Invalid response structure",
          }
        }

        // Validate each suggestion
        const validSuggestions = parsedResponse.suggestions.filter((suggestion) => {
          return (
            suggestion.date &&
            suggestion.startTime &&
            suggestion.endTime &&
            typeof suggestion.score === "number" &&
            suggestion.reasoning &&
            this.isValidDate(suggestion.date) &&
            this.isValidTime(suggestion.startTime) &&
            this.isValidTime(suggestion.endTime)
          )
        })

        console.log(`AI generated ${validSuggestions.length} valid suggestions`)

        return {
          success: true,
          suggestions: validSuggestions.slice(0, 10), // Limit to 10 suggestions
          error: null,
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError)
        console.log("Raw AI response:", aiResponse)
        return {
          success: false,
          suggestions: [],
          error: "Failed to parse AI response",
        }
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      return {
        success: false,
        suggestions: [],
        error: error.message || "AI service error",
      }
    }
  }

  // Validate date format YYYY-MM-DD
  isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date)
  }

  // Validate time format HH:MM
  isValidTime(timeString) {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return regex.test(timeString)
  }
}

export default new AIService()
