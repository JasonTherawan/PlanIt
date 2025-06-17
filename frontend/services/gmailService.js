// Gmail API service
class GmailService {
  constructor() {
    this.gapi = null
  }

  setGapi(gapiInstance) {
    this.gapi = gapiInstance
  }

  async getMessages(maxResults = 50, query = "") {
    if (!this.gapi) {
      throw new Error("Gmail service not initialized. Please call setGapi first.")
    }

    try {
      // Get list of message IDs
      const listResponse = await this.gapi.client.gmail.users.messages.list({
        userId: "me",
        maxResults: maxResults,
        q: query,
      })

      if (!listResponse.result.messages) {
        return []
      }

      // Get full message details for each message
      const messages = await Promise.all(
        listResponse.result.messages.map(async (message) => {
          const messageResponse = await this.gapi.client.gmail.users.messages.get({
            userId: "me",
            id: message.id,
          })

          return this.parseMessage(messageResponse.result)
        }),
      )

      return messages
    } catch (error) {
      console.error("Error fetching messages:", error)
      throw error
    }
  }

  parseMessage(message) {
    const headers = message.payload.headers
    const getHeader = (name) => {
      const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
      return header ? header.value : ""
    }

    // Get message body
    let body = ""
    if (message.payload.body && message.payload.body.data) {
      body = this.decodeBase64(message.payload.body.data)
    } else if (message.payload.parts) {
      // Multi-part message
      const textPart = message.payload.parts.find((part) => part.mimeType === "text/plain")
      if (textPart && textPart.body && textPart.body.data) {
        body = this.decodeBase64(textPart.body.data)
      } else {
        // Try HTML part if no plain text
        const htmlPart = message.payload.parts.find((part) => part.mimeType === "text/html")
        if (htmlPart && htmlPart.body && htmlPart.body.data) {
          body = this.decodeBase64(htmlPart.body.data)
          // Strip HTML tags for plain text display
          body = body.replace(/<[^>]*>/g, "")
        }
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader("Subject") || "(No Subject)",
      from: getHeader("From"),
      to: getHeader("To"),
      date: new Date(Number.parseInt(message.internalDate)),
      body: body,
      snippet: message.snippet,
      isUnread: message.labelIds && message.labelIds.includes("UNREAD"),
    }
  }

  decodeBase64(data) {
    // Gmail API returns base64url encoded data
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/")
    try {
      return decodeURIComponent(escape(atob(base64)))
    } catch (error) {
      console.error("Error decoding base64:", error)
      return data
    }
  }

  async markAsRead(messageId) {
    if (!this.gapi) {
      throw new Error("Gmail service not initialized")
    }

    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        removeLabelIds: ["UNREAD"],
      })
    } catch (error) {
      console.error("Error marking message as read:", error)
      throw error
    }
  }

  async sendReply(originalMessage, replyText) {
    if (!this.gapi) {
      throw new Error("Gmail service not initialized")
    }

    try {
      const subject = originalMessage.subject.startsWith("Re:")
        ? originalMessage.subject
        : `Re: ${originalMessage.subject}`

      const email = [
        `To: ${originalMessage.from}`,
        `Subject: ${subject}`,
        `In-Reply-To: ${originalMessage.id}`,
        `References: ${originalMessage.id}`,
        "",
        replyText,
      ].join("\n")

      const encodedEmail = btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

      await this.gapi.client.gmail.users.messages.send({
        userId: "me",
        raw: encodedEmail,
      })
    } catch (error) {
      console.error("Error sending reply:", error)
      throw error
    }
  }

  async forwardEmail(originalMessage, forwardTo, additionalText = "") {
    if (!this.gapi) {
      throw new Error("Gmail service not initialized")
    }

    try {
      const subject = originalMessage.subject.startsWith("Fwd:")
        ? originalMessage.subject
        : `Fwd: ${originalMessage.subject}`

      const forwardedContent = [
        additionalText,
        "",
        "---------- Forwarded message ---------",
        `From: ${originalMessage.from}`,
        `Date: ${originalMessage.date.toLocaleString()}`,
        `Subject: ${originalMessage.subject}`,
        `To: ${originalMessage.to}`,
        "",
        originalMessage.body,
      ].join("\n")

      const email = [`To: ${forwardTo}`, `Subject: ${subject}`, "", forwardedContent].join("\n")

      const encodedEmail = btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

      await this.gapi.client.gmail.users.messages.send({
        userId: "me",
        raw: encodedEmail,
      })
    } catch (error) {
      console.error("Error forwarding email:", error)
      throw error
    }
  }
}

export default new GmailService()
