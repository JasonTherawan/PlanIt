class AIService {
  constructor() {
    this.apiEndpoint = "/api/ai/generate";
  }

  async analyzeEmailForEvents(emailContent) {
    try {
      if (!this.apiKey) {
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

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response from AI API");
      }
      
      const aiResponse = data.candidates[0].content.parts[0].text;

      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          return {
            hasEvent: false,
            events: [],
          }
        }

        const parsedResponse = JSON.parse(jsonMatch[0])

        if (typeof parsedResponse.hasEvent !== "boolean") {
          return {
            hasEvent: false,
            events: [],
          }
        }

        if (!parsedResponse.hasEvent || !parsedResponse.events || parsedResponse.events.length === 0) {
          return {
            hasEvent: false,
            events: [],
          }
        }

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
      if (!this.apiKey) {
        return {
          success: false,
          suggestions: [],
          error: "AI service not configured",
        }
      }

      const memberScheduleAnalysis = {}
      Object.keys(memberSchedules).forEach((userId) => {
        const member = teamMembers.find((m) => m.userid === userId)
        const memberName = member ? member.username : userId

        const schedule = memberSchedules[userId]
        const conflicts = []

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
        8.  **Last Resort:** If all members have activities colliding each other, suggest the time where most of them are free.

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

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response from AI API");
      }
      
      const aiResponse = data.candidates[0].content.parts[0].text;

      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          return {
            success: false,
            suggestions: [],
            error: "Invalid AI response format",
          }
        }

        const parsedResponse = JSON.parse(jsonMatch[0])

        if (!parsedResponse.success || !Array.isArray(parsedResponse.suggestions)) {
          return {
            success: false,
            suggestions: [],
            error: "Invalid response structure",
          }
        }

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

        return {
          success: true,
          suggestions: validSuggestions.slice(0, 10),
          error: null,
        }
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError)
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

  isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(dateString)) return false

    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date)
  }

  isValidTime(timeString) {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return regex.test(timeString)
  }
}

export default new AIService()
