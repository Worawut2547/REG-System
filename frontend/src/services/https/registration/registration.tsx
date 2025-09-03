// src/services/https/registration/registration.tsx
import axios, { AxiosError } from "axios";
import { apiUrl } from "../../api";
import type { RegistrationInterface } from "../../../interfaces/Registration";

const rootBase = apiUrl.startsWith("/")
  ? apiUrl
  : (apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl);

async function tryBoth<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await primary();
  } catch (e: any) {
    const err = e as AxiosError;
    if (!err.response || err.response.status >= 400) {
      return await fallback();
    }
    throw e;
  }
}

export const createRegistration = async (data: RegistrationInterface) => {
  return tryBoth(
    async () => (await axios.post(`${apiUrl}/registrations`, data)).data,
    async () => (await axios.post(`${rootBase}/registrations`, data)).data,
  );
};

export const createRegistrationBulk = async (
  studentID: string,
  items: { SubjectID: string; SectionID?: number }[]
) => {
  const body = {
    student_id: studentID,
    items: items.map((i) => ({
      Date: new Date().toISOString(),
      StudentID: studentID,
      SubjectID: i.SubjectID,
      SectionID: i.SectionID,
    })),
  };
  return tryBoth(
    async () => (await axios.post(`${apiUrl}/registrations/bulk`, body)).data,
    async () => (await axios.post(`${rootBase}/registrations/bulk`, body)).data,
  );
};

export const getMyRegistrations = async (studentID: string) => {
  return tryBoth(
    async () => (await axios.get(`${apiUrl}/registrations`, { params: { student_id: studentID } })).data,
    async () => (await axios.get(`${rootBase}/registrations`, { params: { student_id: studentID } })).data,
  );
};

export const deleteRegistration = async (registrationID: string | number) => {
  return tryBoth(
    async () => (await axios.delete(`${apiUrl}/registrations/${encodeURIComponent(registrationID)}`)).data,
    async () => (await axios.delete(`${rootBase}/registrations/${encodeURIComponent(registrationID)}`)).data,
  );
};
