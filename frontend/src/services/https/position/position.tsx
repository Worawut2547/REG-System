import axios from "axios";
import { type PositionInterface } from "../../../interfaces/Position";
import { apiUrl } from "../../api";

export const getPositionAll = async(): Promise <PositionInterface[]> => {
    try {
        const responce = await axios.get(`${apiUrl}/positions/`);
        console.log("api position data:" , responce);
        return responce.data
    }
    catch (error) {
        console.error("Error creating position:", error);
        throw error;
    }
}