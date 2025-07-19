import { Link } from "react-router-dom"
import bottomleftshape from "../assets/bottomleftshape.png"
import toprightshape from "../assets/toprightshape.png"
import planitLogo from '/planitLogo.png'

const TermsAndConditions = () => {
  return (
    <div className="bg-white">
      <div className="fixed top-0 left-0 z-0">
        <img src={toprightshape} alt="Top right shape" className="w-auto h-auto" />
      </div>
      <div className="fixed bottom-0 right-0 z-0">
        <img src={bottomleftshape} alt="Bottom left shape" className="w-auto h-auto" />
      </div>

      <header className="bg-[#001a33] text-white py-4 px-6 flex items-center justify-between fixed top-0 w-full z-20">
        <Link to="/" className="flex items-center space-x-4">
          <img src={planitLogo} alt="PlanIt Logo" className="w-10 h-10"/>
          <div className="font-bold">
            <h1 className="text-2xl tracking-wider">PLANIT</h1>
            <p className="text-sm text-gray-300">Plan Smarter. Work Better.</p>
          </div>
        </Link>
        <nav className="flex items-center space-x-8">
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <Link to="/about" className="hover:underline">About us</Link>
          <Link to="/learn-more" className="hover:underline">Learn More</Link>
          <Link to="/login" className="hover:underline">Login</Link>
          <Link to="/register" className="hover:underline">Register</Link>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto mt-20 px-6 py-20">
        <div className="max-w-4xl mx-auto bg-gray-100 backdrop-blur-sm p-8 md:p-12 rounded-lg shadow-2xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900">Terms and Conditions</h1>
            <p className="mt-4 text-sm text-gray-500">Last updated: July 10, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <h2 className="!text-2xl !font-semibold !text-gray-800">1. Introduction</h2>
            <p>Welcome to PlanIt! These Terms and Conditions ("Terms") govern your use of our website located at plannerplanit.com (the "Service") operated by PlanIt. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.</p>

            <h2 className="!text-2xl !font-semibold !text-gray-800 pt-4 border-t border-gray-200 !mt-8">2. Accounts</h2>
            <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>

            <h2 className="!text-2xl !font-semibold !text-gray-800 pt-4 border-t border-gray-200 !mt-8">3. Intellectual Property</h2>
            <p>The Service and its original content, features and functionality are and will remain the exclusive property of PlanIt and its licensors. The Service is protected by copyright, trademark, and other laws of both the Indonesia and foreign countries.</p>

            <h2 className="!text-2xl !font-semibold !text-gray-800 pt-4 border-t border-gray-200 !mt-8">4. Links To Other Web Sites</h2>
            <p>Our Service may contain links to third-party web sites or services that are not owned or controlled by PlanIt. PlanIt has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that PlanIt shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.</p>

            <h2 className="!text-2xl !font-semibold !text-gray-800 pt-4 border-t border-gray-200 !mt-8">5. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
            
            <h2 className="!text-2xl !font-semibold !text-gray-800 pt-4 border-t border-gray-200 !mt-8">6. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of Indonesia, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>

            <h2 className="!text-2xl !font-semibold !text-gray-800 pt-4 border-t border-gray-200 !mt-8">7. Changes</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

            <h2 className="!text-2xl !font-semibold !text-gray-800 pt-4 border-t border-gray-200 !mt-8">8. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:planner.planit.app@gmail.com" className="text-blue-600 hover:underline">planner.planit.app@gmail.com</a>.</p>
          </div>
        </div>
        
        <div className="bottom-0 w-full text-center mt-16 z-10">
          <p className="text-sm text-gray-400">&copy; 2025 PlanIt. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}

export default TermsAndConditions
