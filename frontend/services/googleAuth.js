class GoogleAuthService {
  constructor() {
    this.gapi = null
    this.tokenClient = null
    this.isInitialized = false
    this.initPromise = null
    this.accessToken = null
    this.currentUser = null
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise
    }

    if (this.isInitialized) {
      return Promise.resolve()
    }

    this.initPromise = this._doInitialize()
    return this.initPromise
  }

  async _doInitialize() {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        throw new Error("VITE_GOOGLE_CLIENT_ID is not set in environment variables")
      }
      await this.loadGoogleIdentityScript()
      await this.loadGoogleApiScript()
      await this.initializeGoogleApi()
      this.initializeGoogleIdentity()
      await this.checkExistingAuth()
      this.isInitialized = true
    } catch (error) {
      console.error("Google Identity Services initialization failed:", error)
      this.initPromise = null
      throw error
    }
  }

  loadGoogleIdentityScript() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.onload = resolve
      script.onerror = () => reject(new Error("Failed to load Google Identity Services script"))
      document.head.appendChild(script)
    })
  }

  loadGoogleApiScript() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://apis.google.com/js/api.js"
      script.onload = resolve
      script.onerror = () => reject(new Error("Failed to load Google API script"))
      document.head.appendChild(script)
    })
  }

  async initializeGoogleApi() {
    return new Promise((resolve, reject) => {
      window.gapi.load("client", {
        callback: async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
            })
            this.gapi = window.gapi
            resolve()
          } catch (error) {
            console.error("gapi.client.init failed:", error)
            reject(error)
          }
        },
        onerror: (error) => {
          console.error("Failed to load gapi client:", error)
          reject(new Error("Failed to load Google API client"))
        },
      })
    })
  }

  initializeGoogleIdentity() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: [
        "email",
        "profile",
        "openid",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
      ].join(" "),
      callback: (tokenResponse) => {
        this.handleTokenResponse(tokenResponse)
      },
    })
  }

  handleTokenResponse(tokenResponse) {
    if (tokenResponse.error) {
      console.error("Token error:", tokenResponse.error)
      throw new Error(tokenResponse.error)
    }

    this.accessToken = tokenResponse.access_token
    localStorage.setItem("googleAccessToken", tokenResponse.access_token)

    if (this.gapi) {
      this.gapi.client.setToken({ access_token: tokenResponse.access_token })
    }
  }

  async signIn() {
    try {
      await this.initialize()

      if (!this.tokenClient) {
        throw new Error("Google Identity Services not initialized properly")
      }

      // Request access token
      return new Promise((resolve, reject) => {
        this.tokenClient.callback = async (tokenResponse) => {
          try {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error))
              return
            }

            this.handleTokenResponse(tokenResponse)

            const userInfo = await this.getUserInfo()

            const user = {
              id: userInfo.id,
              email: userInfo.email,
              name: userInfo.name,
              imageUrl: userInfo.picture,
              accessToken: tokenResponse.access_token,
            }

            this.currentUser = user
            resolve(user)
          } catch (error) {
            console.error("Error processing token response:", error)
            reject(error)
          }
        }

        this.tokenClient.requestAccessToken({ prompt: "consent" })
      })
    } catch (error) {
      console.error("Google sign-in error:", error)
      throw error
    }
  }

  async getUserInfo() {
    if (!this.accessToken) {
      throw new Error("No access token available")
    }

    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch user info")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching user info:", error)
      throw error
    }
  }

  async signOut() {
    try {
      if (this.accessToken) {
        window.google.accounts.oauth2.revoke(this.accessToken)
      }

      this.accessToken = null
      this.currentUser = null
      localStorage.removeItem("user")
      localStorage.removeItem("googleAccessToken")

      if (this.gapi) {
        this.gapi.client.setToken(null)
      }
    } catch (error) {
      console.error("Sign-out error:", error)
      throw error
    }
  }

  isSignedIn() {
    return !!this.accessToken && !!this.currentUser
  }

  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser
    }

    const userData = localStorage.getItem("user")
    if (userData) {
      this.currentUser = JSON.parse(userData)
      return this.currentUser
    }

    return null
  }

  getAccessToken() {
    return this.accessToken || localStorage.getItem("googleAccessToken")
  }

  async checkExistingAuth() {
    try {
      const storedToken = localStorage.getItem("googleAccessToken")
      const storedUser = localStorage.getItem("user")

      if (storedToken && storedUser) {
        try {
          const response = await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          })

          if (response.ok) {
            this.accessToken = storedToken
            this.currentUser = JSON.parse(storedUser)

            if (this.gapi) {
              this.gapi.client.setToken({ access_token: storedToken })
            }

            return this.currentUser
          } else {
            this.signOut()
          }
        } catch (error) {
          console.error("Error validating stored token:", error)
          this.signOut()
        }
      }
    } catch (error) {
      console.error("Error checking existing auth:", error)
    }
    return null
  }
}

export default new GoogleAuthService()
