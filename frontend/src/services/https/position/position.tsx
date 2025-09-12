import { type PositionInterface } from "../../../interfaces/Position";
import { api } from "../api";

export const getPositionAll = async(): Promise <PositionInterface[]> => {
    try {
        const responce = await api.get(`/positions/`);
        return responce.data
    }
    catch (error) {
        console.error("Error fetching position:", error);
        throw error;
    }
}