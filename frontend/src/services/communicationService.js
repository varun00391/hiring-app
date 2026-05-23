import api from "./api.js";

export async function fetchCandidateEmails(candidateId) {
  const { data } = await api.get(`/emails/candidate/${candidateId}`);
  return data.emails;
}

export async function sendCandidateEmail(payload) {
  const { data } = await api.post("/emails/send", payload);
  return data;
}

export async function updateCommunicationStatus(candidateId, payload) {
  const { data } = await api.patch(
    `/emails/candidate/${candidateId}/communication-status`,
    payload,
  );
  return data;
}
