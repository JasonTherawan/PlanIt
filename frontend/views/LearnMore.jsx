import { Link } from "react-router-dom"
import { Calendar, CheckSquare, Target, Users, Bot, Mail } from "lucide-react"
import bottomleftshape from "../assets/bottomleftshape.png"
import toprightshape from "../assets/toprightshape.png"

const FeatureCard = ({ icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
    <div className="flex items-center mb-4">
      <div className="p-3 bg-blue-100 rounded-full mr-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600">{children}</p>
  </div>
)

const LearnMore = () => {
  return (
    <div className="bg-gray-50">
      <div className="fixed top-0 left-0 z-0">
        <img src={toprightshape} alt="Top right shape" className="w-auto h-auto" />
      </div>
      <div className="fixed bottom-0 right-0 z-0">
        <img src={bottomleftshape} alt="Bottom left shape" className="w-auto h-auto" />
      </div>

      <header className="bg-[#001a33] text-white py-4 px-6 flex items-center justify-between fixed top-0 w-full z-20">
        <Link to="/" className="flex items-center space-x-4">
          <img src="/planitLogo.png" alt="PlanIt Logo" className="w-10 h-10"/>
          <div className="font-bold">
            <h1 className="text-2xl tracking-wider">PLANIT</h1>
            <p className="text-sm text-gray-300">Plan Smarter. Work Better.</p>
          </div>
        </Link>
        <nav className="flex items-center space-x-8">
          <Link to="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <Link to="/about" className="hover:underline">About us</Link>
          <Link to="/login" className="hover:underline">Login</Link>
          <Link to="/register" className="hover:underline">Register</Link>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto mt-20 px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Unlock Your Full Potential with PlanIt
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            PlanIt is more than just a calendar. It's a comprehensive productivity suite designed to bring clarity, focus, and efficiency to your personal and professional life.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard icon={<CheckSquare className="text-blue-600" />}>
            <div className="font-bold">Unified To-Do List</div>
            Manage your tasks with a fully integrated to-do list. Track progress with statuses like "Not Started," "In Progress," and "Done," and set urgency levels to prioritize what's important.
          </FeatureCard>

          <FeatureCard icon={<Target className="text-green-600" />}>
            <div className="font-bold">Long-Term Goal Tracking</div>
            Don't lose sight of the bigger picture. PlanIt allows you to set and track long-term goals with specific deadlines, helping you stay motivated and on track.
          </FeatureCard>

          <FeatureCard icon={<Mail className="text-red-600" />}>
            <div className="font-bold">Email-to-Task Automation</div>
            Turn your inbox into a productivity engine. Forward emails from Gmail to the app directly, and PlanIt's AI will automatically parse event details and add them to your calendar.
          </FeatureCard>

          <FeatureCard icon={<Users className="text-purple-600" />}>
            <div className="font-bold">Team Collaboration</div>
            Create and manage teams with ease. PlanIt supports company accounts and provides a centralized space for all team-related scheduling and planning.
          </FeatureCard>

          <FeatureCard icon={<Bot className="text-indigo-600" />}>
            <div className="font-bold">Smart Meeting Scheduler</div>
            Say goodbye to scheduling headaches. Our AI-powered scheduler analyzes your team's calendars to find the optimal meeting times, resolving conflicts in real-time.
          </FeatureCard>
          
          <FeatureCard icon={<Calendar className="text-orange-600" />}>
            <div className="font-bold">Unified Calendar View</div>
            See everything in one place. The monthly calendar view is integrated with a detailed time-block schedule, giving you a clear overview of your commitments.
          </FeatureCard>
        </div>

        <div className="text-center mt-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 text-lg mb-8">Join thousands of users who are planning smarter and working better with PlanIt.</p>
          <Link
            to="/register"
            className="px-8 py-4 bg-[#003366] text-white font-bold rounded-lg hover:bg-blue-800 transition-colors duration-300"
          >
            Sign Up for Free
          </Link>
        </div>
        
        <div className="bottom-0 w-full text-center mt-16 z-10">
          <p className="text-sm text-gray-400">&copy; 2025 PlanIt. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}

export default LearnMore
