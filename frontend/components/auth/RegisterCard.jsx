import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PlanItLogo } from "../../assets";
import "./AuthCard.css";

function RegisterCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    setErrorUsername("");
    setErrorPassword("");
    setErrorConfirmPassword("");
    setError("");
    e.preventDefault();

    if (!username) {
      setErrorUsername("Username cannot be empty");
    }

    if (!password) {
      setErrorPassword("Password cannot be empty");
    }

    if (!confirmPassword) {
      setErrorConfirmPassword("Please confirm your password");
    } else if (confirmPassword !== password) {
      setErrorConfirmPassword("Passwords do not match");
    }

    if (username === "dummy") {
      alert("Register Success");
      navigate('/main');
    } else {
      setError("Register Failed");
    }
  };

  return (
    <>
      <div className="planit-intro">
        <img src={PlanItLogo} alt="PLANIT Logo" />
        <h2>PLANIT</h2>
        <p>Plan Smarter. Work Better.</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-credential">
          <label>Username / Email</label>
          <div className="username-login">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username/email"
              className={errorUsername ? "username-login-error" : "username-login-textbox"}
            />
            {errorUsername && <p className="usernameError-message">{errorUsername}</p>}
          </div>

          <label>Password</label>
          <div className="password-login" style={{ marginBottom: "0.5rem" }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={errorPassword ? "password-login-error" : "password-login-textbox"}
            />
            {errorPassword && <p className="passwordError-message">{errorPassword}</p>}
          </div>

          <label>Confirm Password</label>
          <div className="password-login" style={{ marginBottom: "1rem" }}>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={errorConfirmPassword ? "password-login-error" : "password-login-textbox"}
            />
            {errorConfirmPassword && <p className="confirmPasswordError-message">{errorConfirmPassword}</p>}
          </div>
        </div>

        <button type="submit" className="register-button" style={{ marginTop: "0.5rem" }}>Register</button>
        {error && <p className="authError-message">{error}</p>}

        <div className="auth-footer-link">
          <p>
            Already have an account?{" "}
            <Link to="/login">Login here</Link>
          </p>
        </div>
      </form>
    </>
  );
}

export default RegisterCard;