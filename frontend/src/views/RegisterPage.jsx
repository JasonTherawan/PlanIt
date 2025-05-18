import RegisterForm from "../components/RegisterForm";
import LoginPageImage from "../assets/loginpageimage.png";
import "./RegisterPage.css";

function RegisterPage() {
  return (
    <div className="registerpage-container">
      <div className="registerpage-left">
        <div className="register-welcome">
          <h2>Log in to your account</h2>
          <img src={LoginPageImage} alt="Login" />
        </div>
      </div>

      <div className="registerpage-right">
        <RegisterForm />
      </div>
    </div>
  );
}

export default RegisterPage;
