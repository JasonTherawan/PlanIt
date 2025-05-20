import { Link } from 'react-router-dom';
import "./Navbar.css";

function Navbar (){

    return (

        <nav className="navbar">
            <ul className="navbar-links">
                <li><Link to = "/aboutus">About us</Link></li>
                <li><Link to = "/login">Login/Register</Link></li>
            </ul>
        </nav>

    )
}

export default Navbar;