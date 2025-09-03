import axios from "axios";

import { apiUrl } from "../api";

export const GetNameStudent = async (username: string) => {
  //console.log("Fetching student data for:", username);
  if (!username) {
    throw new Error("Username is required");
  }
  try {
    const response = await axios.get(`${apiUrl}/student/${username}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student data:", error);
    throw error;
  }
};

export const GetNameAdmin = async (username: string) => {
  //console.log("Fetching student data for:", username);
  if (!username) {
    throw new Error("Username is required");
  }
  try {
    const response = await axios.get(`${apiUrl}/admin/${username}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin data:", error);
    throw error;
  }
};

export const GetNameTeacher = async (username: string) => {
  //console.log("Fetching student data for:", username);
  if (!username) {
    throw new Error("Username is required");
  }
  try {
    const response = await axios.get(`${apiUrl}/teacher/${username}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching teacher data:", error);
    throw error;
  }
};
