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
