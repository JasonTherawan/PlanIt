import { Link } from "react-router-dom"
import { Calendar } from "lucide-react"
import bgImage from '../assets/landingpagebg.png'

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Bar */}
      <header className="bg-[#003366] text-white py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-white">
            <Calendar className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider">PLANIT</h1>
            <p className="text-sm text-gray-300">Plan Smarter. Work Better.</p>
          </div>
        </div>
        <nav className="flex items-center space-x-8">
          <Link to="/about" className="hover:underline">
            About us
          </Link>
          <Link to="/login" className="hover:underline">
            Login
          </Link>
        </nav>
      </header>

      {/* Hero Section with Background Image */}
      <main className="flex-1 relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center px-4 text-center">
          <h2 className="text-white text-4xl font-bold mb-8">
            The all-in-one solution for scheduling, reminders, and productivity.
          </h2>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="px-8 py-3 border border-white text-white bg-transparent hover:bg-white hover:text-blue-900 transition-colors duration-300 rounded-md"
            >
              Sign up for free
            </Link>
            <Link
              to="/learn-more"
              className="px-8 py-3 border border-white text-white bg-transparent hover:bg-white hover:text-blue-900 transition-colors duration-300 rounded-md"
            >
              Learn more
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LandingPage
