import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // 🟢 Tambahkan Link
import planitlogo from "../assets/planitlogo.png";
import "./RegisterForm.css";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    setErrorUsername("");
    setErrorPassword("");
    setErrorConfirmPassword("");
    setError("");

    let valid = true;

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
        <img src={planitlogo} alt="PLANIT Logo" />
        <h2>PLANIT</h2>
        <p>Plan Smarter. Work Better.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="register-credential">
          <label>Username / Email</label>
          <div className="username">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username/email"
              className={errorUsername ? "error" : ""}
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={errorPassword ? "error" : ""}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className={errorConfirmPassword ? "error" : ""}
            />
            {errorConfirmPassword && (
              <p className="confirmPasswordError-message">{errorConfirmPassword}</p>
            )}
          </div>
        </div>

        <button type="submit" className="register-button">
          Register
        </button>

        {error && <p className="registerError-message">{error}</p>}

        <p className="register-login-link">
          Already have an account?
          <Link to="/login"> Login here</Link>
        </p>
      </form>
    </>
  );
}

export default RegisterForm;
