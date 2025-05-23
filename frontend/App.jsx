import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainPage from './views/MainPage'
import LandingPage from './views/LandingPage'
import LoginPage from './views/LoginPage'
import TeamsPage from './views/TeamsPage'
import RegisterPage from './views/RegisterPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/main" element={<MainPage />}/>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  )
}

export default App