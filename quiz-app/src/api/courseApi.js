import axios from "axios";

const API = axios.create({
  baseURL: "https://quiz-1-lgpj.onrender.com",
  headers: {
    "x-api-key": "12345",
  },
});

export const fetchCourse = async (courseId) => {
  const res = await API.get(`/courses/${courseId}`);
  return res.data;
};

export const getProgress = async (courseId, userId) => {
  const res = await API.get(`/courses/${courseId}/progress/${userId}`);
  return res.data;
};

export const saveProgress = async (data) => {
  if (!data || !data.courseId) {
    throw new Error("saveProgress requires data.courseId");
  }
  const res = await API.post(`/courses/${data.courseId}/progress`, data);
  return res.data;
};

