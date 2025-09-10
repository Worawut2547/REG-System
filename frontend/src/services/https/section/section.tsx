// services/https/section/section.tsx
import axios from "axios";
import { apiUrl } from "../../api";
import type { SectionInterface } from "../../../interfaces/Section";

export const getAllSections = async (): Promise<SectionInterface[]> => {
  const res = await axios.get(`${apiUrl}/sections/`);
  return Array.isArray(res.data) ? res.data : [];
};

export const getSectionsBySubject = async (subjectId: string): Promise<SectionInterface[]> => {
  if (!subjectId) throw new Error("subjectId is required");
  const res = await axios.get(`${apiUrl}/subjects/${encodeURIComponent(subjectId)}/sections`);
  return Array.isArray(res.data) ? res.data : [];
};

export const getSectionById = async (sectionId: string): Promise<SectionInterface | null> => {
  if (!sectionId) throw new Error("sectionId is required");
  const res = await axios.get(`${apiUrl}/sections/${encodeURIComponent(sectionId)}`);
  return res.data ?? null;
};

export const createSection = async (data: SectionInterface): Promise<SectionInterface> => {
  const payload = {
    Group: data.Group,
    DateTeaching: data.DateTeaching,
    SubjectID: data.SubjectID,
  } as SectionInterface;
  if (!payload.SubjectID) throw new Error("SubjectID is required");
  const res = await axios.post(`${apiUrl}/sections/`, payload);
  return res.data as SectionInterface;
};

export const updateSection = async (sectionId: string, data: Partial<SectionInterface>): Promise<void> => {
  if (!sectionId) throw new Error("sectionId is required");
  await axios.put(`${apiUrl}/sections/${encodeURIComponent(sectionId)}`, data);
};

export const deleteSection = async (sectionId: string): Promise<void> => {
  if (!sectionId) throw new Error("sectionId is required");
  await axios.delete(`${apiUrl}/sections/${encodeURIComponent(sectionId)}`);
};
