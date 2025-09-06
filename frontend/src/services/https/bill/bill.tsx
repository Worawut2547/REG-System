import axios from "axios";

import { apiUrl } from "../../api";


export const getBillByStudentID = async() => {
    try{
        const sid = localStorage.getItem('username');
        const response = await axios.get(`${apiUrl}/bills/${sid}`);
        console.log("api bill student:",response.data)
        return response.data
    }
    catch(error){
        console.error("Error fetching bill student data:", error);
        throw error;
    }
}