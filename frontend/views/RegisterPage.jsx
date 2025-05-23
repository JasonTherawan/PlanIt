import RegisterCard from "../components/auth/RegisterCard";
import { LoginPageImage } from "../assets";
import "./AuthPage.css";

function RegisterPage() {
    return (
        <>
            <div className="loginpage-container">
                <div className="loginpage-left">
                    <div className="login-welcome">
                        <h2>Register your account</h2>
                        <img src={LoginPageImage} alt="Welcome" />
                    </div>
                </div>

                <div className="loginpage-right">
                    <RegisterCard />
                </div>
            </div>
        </>
    );
}

export default RegisterPage;