import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"
import { PlanItLogo } from "../../assets";
import "./AuthCard.css"

function LoginCard() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorUsername, setErrorUsername] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [error, setError] = useState("");

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
        setErrorUsername("");
        setErrorPassword("");
        setError("");
        e.preventDefault();

        if (!username) {

            setErrorUsername("Username cannot be empty")
        }

        if (!password) {

            setErrorPassword("Password cannot be empty")
        }

        if (username === "dummy") {
            alert("Login Success");
            navigate('/main');
        }
        else {
            setError("Login Failed")
        }
    }

    return (

        <>

            <div className="planit-intro">
                <img src={PlanItLogo} alt="" />
                <h2>PLANIT</h2>
                <p>Plan Smarter. Work Better.</p>
            </div>

            <form className="login-form" action="login-form" onSubmit={handleSubmit}>
                <div className="login-credential">
                    <label>Username / Email</label>
                    <div className="username-login">
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameInput}
                            placeholder="Enter your username/email"
                            className={errorUsername ? "username-login-error" : "username-login-textbox"}
                        />
                        {errorUsername && <p className="usernameError-message">{errorUsername}</p>}
                    </div>
                    <label>Password</label>
                    <div className="password-login">
                        <input
                            type="text"
                            value={password}
                            onChange={handlePasswordInput}
                            placeholder="Enter your password"
                            className={errorPassword ? "password-login-error" : "password-login-textbox"}
                        />
                        {errorPassword && <p className="passwordError-message">{errorPassword}</p>}
                    </div>
                </div>
                <button type="submit" className="login-button">Login</button>
                {error && <p className="authError-message">{error}</p>}
            </form>

            <div className="auth-footer-link">
                <p>
                    Don’t have an account yet?{" "}
                    <Link to="/register">Register here</Link>
                </p>
            </div>
        </>
    )
}

export default LoginCard;
