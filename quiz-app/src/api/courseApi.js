import axios from "axios";

const API = axios.create({
  baseURL: "https://quiz-efirejd4w-riya-yadavs-projects-29ff28d4.vercel.app",
  headers: {
    "x-api-key": "12345",
  },
});

export const fetchCourse = async (courseId) => {
  const res = await API.get(`/courses/${courseId}`);
  return res.data;
};

// Note: backend route is GET /courses/:id/progress/:userId
export const getProgress = async (courseId, userId) => {
  const res = await API.get(`/courses/${courseId}/progress/${userId}`);
  return res.data;
};

// Expects `data` to include `courseId` plus { userId, lessonId, answers }
export const saveProgress = async (data) => {
  if (!data || !data.courseId) throw new Error("saveProgress requires data.courseId");
  const res = await API.post(`/courses/${data.courseId}/progress`, data);
  return res.data;
};
