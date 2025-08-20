import axios from "axios";
import { type SignInInterface } from "../../interfaces/SignIn";


const apiUrl = "http://localhost:8000";

const SignIn = async (data: SignInInterface) => {
    try {
        const response = await axios.post(`${apiUrl}/signin`,data);

        // บันทึก token ที่ได้รับลง localStorage
       /* localStorage.setItem("token", response.data.token);
        localStorage.setItem("token_type" , "Bearer");
        localStorage.setItem("role" , response.data.role);
        localStorage.setItem("username", response.data.username);*/
        return response.data;
    } 
    catch (error) {
        console.error("Error signin:", error);
        throw error;
    }
};

export default SignIn;