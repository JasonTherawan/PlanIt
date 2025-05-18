import './App.css'
import { Routes, Route } from 'react-router-dom';

import LandingPage from './Views/landingPage'
import LoginPage from './Views/loginPage'

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  )
}

export default App
