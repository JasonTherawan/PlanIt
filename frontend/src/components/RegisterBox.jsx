import { useState } from "react";
import { useNavigate } from "react-router-dom";
import planitlogo from "../assets/planitlogo.png";
import "./RegisterBox.css";

function RegisterBox() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errorUsername, setErrorUsername] = useState("");
    const [errorPassword, setErrorPassword] = useState("");
    const [errorConfirmPassword, setErrorConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleUsernameInput = (e) => {
        setUsername(e.target.value);
    };

    const handlePasswordInput = (e) => {
        setPassword(e.target.value);
    };

    const handleConfirmPasswordInput = (e) => {
        setConfirmPassword(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        let valid = true;
        setErrorUsername("");
        setErrorPassword("");
        setErrorConfirmPassword("");
        setError("");

        if (!username) {
            setErrorUsername("Username cannot be empty");
            valid = false;
        }

        if (!password) {
            setErrorPassword("Password cannot be empty");
            valid = false;
        }

        if (!confirmPassword) {
            setErrorConfirmPassword("Please confirm your password");
            valid = false;
        } else if (confirmPassword !== password) {
            setErrorConfirmPassword("Passwords do not match");
            valid = false;
        }

        if (!valid) return;

        if (username === "dummy") {
            setError("Register success");
            navigate("/home");
        } else {
            setError("Register failed");
        }
    };

    return (
        <>
            <div className="planit-intro">
                <img src={planitlogo} alt="" />
                <h2>PLANIT</h2>
                <p>Plan Smarter. Work Better.</p>
            </div>

            <form className="register-form" onSubmit={handleSubmit}>
                <div className="register-credential">
                    <label>Username / Email</label>
                    <div className="username">
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameInput}
                            placeholder="Enter your username/email"
                            className={errorUsername ? "Username error" : ""}
                        />
                        {errorUsername && (
                            <p className="usernameError-message">{errorUsername}</p>
                        )}
                    </div>

                    <label>Password</label>
                    <div className="password">
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordInput}
                            placeholder="Enter your password"
                            className={errorPassword ? "Password error" : ""}
                        />
                        {errorPassword && (
                            <p className="passwordError-message">{errorPassword}</p>
                        )}
                    </div>

                    <label>Confirm Password</label>
                    <div className="confirm-password">
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordInput}
                            placeholder="Re-enter your password"
                            className={errorConfirmPassword ? "ConfirmPassword error" : ""}
                        />
                        {errorConfirmPassword && (
                            <p className="confirmPasswordError-message">{errorConfirmPassword}</p>
                        )}
                    </div>
                </div>

                <button type="submit" className="register-button">Register</button>
                {error && <p className="registerError-message">{error}</p>}
            </form>
        </>
    );
}

export default RegisterBox;
