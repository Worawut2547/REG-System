import { type PositionInterface } from "../../../interfaces/Position";
import { api } from "../api";

export const getPositionAll = async(): Promise <PositionInterface[]> => {
    try {
        const responce = await api.get(`/positions/`);
        console.log("api position data:" , responce);
        return responce.data
    }
    catch (error) {
        console.error("Error fetching position:", error);
        throw error;
    }
}