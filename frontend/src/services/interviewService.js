import api from "./api.js";

export async function scheduleInterview(payload) {
  const { data } = await api.post("/interviews/schedule", payload);
  return data;
}

export async function fetchCandidateInterviews(candidateId) {
  const { data } = await api.get(`/interviews/candidate/${candidateId}`);
  return data.interviews;
}
