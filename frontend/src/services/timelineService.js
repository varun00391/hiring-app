import api from "./api.js";

export async function fetchCandidateTimeline(candidateId) {
  const { data } = await api.get(`/timeline/candidate/${candidateId}`);
  return data.events;
}
