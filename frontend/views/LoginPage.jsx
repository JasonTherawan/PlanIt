import LoginCard from "../components/LoginPage/LoginCard"
import LoginPageImage from "../assets/loginpageimage.png"
import "./LoginPage.css"

function LoginPage (){

    return(

       <>
        <div className="loginpage-container">
            <div className="loginpage-left">
                <div className="login-welcome">
                    <h2>Login to your account</h2>
                    <img src={LoginPageImage} alt="" />
                </div>
            </div>

            <div className="loginpage-right">
                    <LoginCard/>
            </div>
        </div>
    
       </>
    )
}

export default LoginPage;