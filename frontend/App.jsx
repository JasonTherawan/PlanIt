"use client"

import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainPage from './views/MainPage'
import LandingPage from './views/LandingPage'
import LoginPage from './views/LoginPage'
import RegisterPage from './views/RegisterPage'
import LearnMore from './views/LearnMore'
import AboutUs from './views/AboutUs'
import PrivacyPolicy from './views/PrivacyPolicy'
import TermsAndConditions from './views/TermsAndConditions'
import googleAuthService from './services/googleAuth'

function App() {
  // Initialize Google Auth Service once when the app loads
  useEffect(() => {
    googleAuthService.initialize();
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/learn-more" element={<LearnMore />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      </Routes>
    </Router>
  )
}

export default App
