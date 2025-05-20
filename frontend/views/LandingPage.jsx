import { useNavigate } from "react-router-dom"

import LandingHeader from "../components/landing/LandingHeader";
import "./LandingPage.css"

function LandingPage (){

    const navigate = useNavigate();

    const handleSignUpClick = () => {

        navigate('/register')
    }

    const handleLearnMoreClick = () => {

        navigate('/aboutus')
    }

    return (

        <>
            <div className="container">
                <LandingHeader/>
                <div className="overlay">
                    <h2>The all-in-one solution for scheduling, reminders, and productivity.</h2>
                    <button className="signup-btn" onClick={handleSignUpClick}>Sign up for free</button>
                    <button className="learnmore-btn" onClick={handleLearnMoreClick}>Learn more</button>
                </div>
            </div>
        </>
    )
}

export default LandingPage;