import RegisterBox from "../components/RegisterBox"
import LoginPageImage from "../assets/loginpageimage.png"
import "./registerPage.css"

function RegisterPage (){

    return(

       <>
        <div className="registerpage-container">
            <div className="registerpage-left">
                <div className="register-welcome">
                    <h2>Log in to your account</h2>
                    <img src={LoginPageImage} alt="" />
                </div>
            </div>

            <div className="registerpage-right">
                    <RegisterPage/>
            </div>
        </div>
    
       </>
    )
}

export default RegisterPage;