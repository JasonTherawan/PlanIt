import Navbar from "./Navbar"
import "./Header.css"

import planitlogo from "../../assets/planitlogo.png"

function Header (){

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

export default Header;