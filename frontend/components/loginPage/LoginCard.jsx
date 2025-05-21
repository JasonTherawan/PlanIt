import { useState } from "react";
import { useNavigate } from "react-router-dom"
import planitlogo from "../../assets/planitlogo.png"
import "./LoginCard.css"

function LoginCard () {

    const[username, setUsername] = useState("");
    const[password, setPassword] = useState("");
    const[errorUsername, setErrorUsername] = useState("");
    const[errorPassword, setErrorPassword] = useState("");
    const[error, setError] = useState("");
    const navigate = useNavigate();

    const handleUsernameInput = (input) => {

        const value = input.target.value;
        setUsername(value);
    };

    const handlePasswordInput = (input) => {

        const value = input.target.value;
        setPassword(value);
    }

    const handleSubmit = (e) => {

        e.preventDefault();

        if (!username){

            setErrorUsername("Username cannot be empty")
        }
        else if (!username.includes('@')){

            setErrorUsername("Invalid email format")
        }

        if (!password){

            setErrorPassword("Password cannot be empty")
        }

        if (username === "dummy"){

            setError("login success");
            navigate('/home');        
        }
        else {

            setError("Login failed")
        }
    }

    const handleRegisterClick = () => {

        navigate('/signup')
    }

    return (

        <>
        
        <div className="planit-intro">
            <img src = {planitlogo} alt="" />
            <h2>PLANIT</h2>
            <p>Plan Smarter. Work Better.</p>
        </div>

        <form action="login-form" onSubmit={handleSubmit}>
        <div className="login-credential">
            <label>Username / Email</label>
            <div className="username">
                <input 
                type = "text" 
                value = {username}
                onChange = {handleUsernameInput}
                placeholder = "Enter your username/email"
                className = {errorUsername ? "Username error" : ""}
                />
                {errorUsername && <p className="usernameError-message">{errorUsername}</p>}
            </div>
            <label>Password</label>
            <div className="password">
                <input 
                type="text" 
                value = {password}
                onChange = {handlePasswordInput}
                placeholder = "Enter your password"
                className = {errorPassword ? "Password error" : ""}
                />
                {errorPassword && <p className="passwordError-message">{errorPassword}</p>}
            </div>
        </div>
            <button type="submit" className="login-button">Login</button>
            {error &&  <p className="loginError-message">{error}</p>}
        </form>

        <div className="register-link">
            <p>Don't have account yet?</p>
            <button className="register-button" onClick={handleRegisterClick}>Register here</button>
        </div>
        </>
    )
}

export default LoginCard;
