import { Link } from "react-router-dom"
import { Lightbulb, Users, Zap, Mail, Linkedin, Github } from "lucide-react"
import bottomleftshape from "../assets/bottomleftshape.png"
import toprightshape from "../assets/toprightshape.png"

const AboutUs = () => {
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
          <Link to="/learn-more" className="hover:underline">Learn More</Link>
          <Link to="/login" className="hover:underline">Login</Link>
          <Link to="/register" className="hover:underline">Register</Link>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto mt-20 px-6 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">Our Mission</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            To provide a seamless and intelligent planning experience that helps individuals and teams reclaim their time and focus on what matters most.
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">The Story Behind PlanIt</h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            PlanIt was born out of a simple frustration: too many tools, too little focus. In a world filled with countless apps for calendars, to-do lists, and team collaboration, we found ourselves spending more time managing our tools than actually getting work done. We knew there had to be a better way.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed">
            We envisioned a single platform that could unify all aspects of planning, from daily tasks to long-term ambitions. A tool that was not only powerful but also intelligent, capable of automating the tedious aspects of scheduling so that you can focus on execution. That vision became PlanIt.
          </p>
        </div>

        <h2 className="text-4xl font-extrabold text-gray-900 mb-10 text-center mt-16">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-blue-100 rounded-full">
              <Lightbulb className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-2xl font-semibold text-gray-800">Simplicity</h4>
            <p className="mt-2 text-lg text-gray-600">
              Powerful tools don't have to be complicated. We believe in creating an intuitive experience that is easy to use from day one.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-green-100 rounded-full">
              <Zap className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-2xl font-semibold text-gray-800">Integration</h4>
            <p className="mt-2 text-lg text-gray-600">
              Your planner should work with you, not against you. We seamlessly connect with the tools you already use, like email, to create a unified workflow.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-purple-100 rounded-full">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-2xl font-semibold text-gray-800">Intelligence</h4>
            <p className="mt-2 text-lg text-gray-600">
              We use AI to automate complex scheduling tasks, so you can spend less time planning and more time doing what you do best.
            </p>
          </div>
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center mt-16">Meet the Developer</h2>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            PlanIt was designed and developed by a solo developer passionate about productivity and clean design. This application is a testament to the idea that with the right tools, anyone can bring their vision to life.
          </p>
          <p className="text-2xl font-bold text-gray-800 mb-6">Jason Therawan</p>
        
          <div className="flex flex-row items-center justify-center space-x-16">
            <a href="mailto:therawan.jason@gmail.com" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
              <Mail size={24} className="mr-3" />
              <span>therawan.jason@gmail.com</span>
            </a>
            <a href="https://www.linkedin.com/in/JasonTherawan" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
              <Linkedin size={24} className="mr-3" />
              <span>JasonTherawan</span>
            </a>
            <a href="https://github.com/JasonTherawan" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
              <Github size={24} className="mr-3" />
              <span>JasonTherawan</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AboutUs
