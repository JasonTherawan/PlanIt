import Navbar from "../login/Navbar"
import "./LandingHeader.css"

import planitlogo from "../../assets/planitlogo.png"

function LandingHeader (){

    return (

        <header className="header">

            <div className="planit-header-left">
                <img className="planit-logo" src= {planitlogo} alt="Planit logo" />
                <div className="planit-intro">
                    <h1 className="planit-title">PLANIT</h1>
                    <p className="planit-vision">Plan Smarter. Work Better.</p>
                </div>
            </div>
            <Navbar/>
        </header>

    )

}

export default LandingHeader;