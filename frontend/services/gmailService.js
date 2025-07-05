// Gmail API service
class GmailService {
  constructor() {
    this.gapi = null
  }

  setGapi(gapiInstance) {
    this.gapi = gapiInstance
  }

  async getMessages(maxResults = 50, query = "", pageToken = null) {
    if (!this.gapi) {
      throw new Error("Gmail service not initialized. Please call setGapi first.")
    }

    try {
      // Get list of message IDs
      const listResponse = await this.gapi.client.gmail.users.messages.list({
        userId: "me",
        maxResults: maxResults,
        q: query,
        pageToken: pageToken,
      })

      const result = listResponse.result;

      if (!result.messages) {
        return { messages: [], nextPageToken: null };
      }

      // Get full message details for each message
      const messages = await Promise.all(
        result.messages.map(async (message) => {
          const messageResponse = await this.gapi.client.gmail.users.messages.get({
            userId: "me",
            id: message.id,
          })

          return this.parseMessage(messageResponse.result)
        }),
      )

      return { messages, nextPageToken: result.nextPageToken };
    } catch (error) {
      console.error("Error fetching messages:", error)
      throw error
    }
  }

  findPart = (parts, mimeType) => {
    for (const part of parts) {
      if (part.mimeType === mimeType) {
        return part;
      }
      if (part.parts) {
        const found = this.findPart(part.parts, mimeType);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  parseMessage(message) {
    const headers = message.payload.headers
    const getHeader = (name) => {
      const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
      return header ? header.value : ""
    }

    let body = ""
    if (message.payload.parts) {
        const htmlPart = this.findPart(message.payload.parts, 'text/html');
        if (htmlPart && htmlPart.body.data) {
            body = this.decodeBase64(htmlPart.body.data);
        } else {
            const plainPart = this.findPart(message.payload.parts, 'text/plain');
            if (plainPart && plainPart.body.data) {
                body = this.decodeBase64(plainPart.body.data);
            }
        }
    } else if (message.payload.body.data) {
        body = this.decodeBase64(message.payload.body.data);
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
  
  async deleteMessage(messageId) {
    if (!this.gapi) {
      throw new Error("Gmail service not initialized");
    }

    try {
      await this.gapi.client.gmail.users.messages.trash({
        userId: "me",
        id: messageId,
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
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
