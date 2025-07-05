"use client"

import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainPage from './views/MainPage'
import LandingPage from './views/LandingPage'
import LoginPage from './views/LoginPage'
import RegisterPage from './views/RegisterPage'
import googleAuthService from './services/googleAuth'

function App() {
  useEffect(() => {
    googleAuthService.initialize();
  }, [])
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  )
}

export default App
