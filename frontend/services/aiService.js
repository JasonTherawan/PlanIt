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
        You are an intelligent meeting scheduler. Analyze the following data and suggest the best meeting times that avoid ALL conflicts.

        TEAM MEMBERS: ${teamMembers.map((m) => m.username).join(", ")}
        
        DATE RANGE: ${dateRange.startDate} to ${dateRange.endDate}
        MEETING DURATION: ${duration} minutes
        WORKING HOURS: ${workingHours.start} to ${workingHours.end}
        CREATOR PREFERENCE: "${creatorPreference}"
        
        DETAILED MEMBER SCHEDULES AND CONFLICTS:
        ${JSON.stringify(memberScheduleAnalysis, null, 2)}

        CRITICAL INSTRUCTIONS:
        1. NEVER suggest times that conflict with ANY member's existing activities, goals, or meetings
        2. For activities/meetings with specific times, avoid those exact time slots
        3. For goal timelines with specific times, avoid those time periods on relevant dates
        4. For all-day goals/activities, consider them as lower priority but still note as potential conflicts
        5. Respect working hours (${workingHours.start} to ${workingHours.end})
        6. Consider the creator's time preference: "${creatorPreference}"
        7. Suggest 5-10 optimal meeting times with NO conflicts
        8. Prioritize times that match the creator's preference
        9. Consider lunch breaks (12:00-13:00) as less optimal but not forbidden
        10. Score based on actual availability and preference matching

        CONFLICT DETECTION RULES:
        - If a member has an activity from 10:00-11:00 on a date, DO NOT suggest any overlapping times
        - If a member has a goal timeline with specific hours, avoid those hours on dates within the timeline
        - If a member has team meetings, avoid those exact times
        - High urgency activities should be weighted more heavily in conflict detection

        Return a JSON response with this exact structure:
        {
          "success": true,
          "suggestions": [
            {
              "date": "YYYY-MM-DD",
              "startTime": "HH:MM",
              "endTime": "HH:MM",
              "score": 85,
              "reasoning": "No conflicts detected for any team member, matches morning preference",
              "conflicts": [],
              "advantages": ["All members available", "Matches creator preference", "No scheduling conflicts"],
              "memberAvailability": {
                "memberName": "available/conflict details"
              }
            }
          ]
        }

        SCORING CRITERIA (0-100):
        - Start with 100 points
        - Subtract 50 points for ANY direct time conflict
        - Subtract 30 points for high urgency activity conflicts
        - Subtract 20 points for goal timeline conflicts
        - Subtract 15 points for lunch time scheduling
        - Subtract 10 points for preference mismatch
        - Subtract 5 points for end-of-day scheduling

        Only suggest times with scores above 60. Sort suggestions by score (highest first).
        Be extremely careful about conflict detection - it's better to suggest fewer times than to suggest conflicting times.
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
          temperature: 0.1, // Lower temperature for more consistent conflict detection
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
            this.isValidTime(suggestion.endTime) &&
            suggestion.score >= 60 // Only include suggestions with decent scores
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
