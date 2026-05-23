import api from "./api.js";

export async function fetchCandidates(params = {}) {
  const { data } = await api.get("/candidates", { params });
  return data;
}

export async function fetchCandidate(id) {
  const { data } = await api.get(`/candidates/${id}`);
  return data.candidate;
}

export async function uploadCandidates(files, options = {}, onUploadProgress) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (options.positionApplied) {
    formData.append("position_applied", options.positionApplied);
  }
  if (options.recruiterName) {
    formData.append("recruiter_name", options.recruiterName);
  }

  const { data } = await api.post("/candidates/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return data;
}

export async function updateCandidateStatus(id, payload) {
  const { data } = await api.patch(`/candidates/${id}/status`, payload);
  return data.candidate;
}

export async function updateCandidateNotes(id, recruiterNotes) {
  const { data } = await api.patch(`/candidates/${id}/notes`, {
    recruiter_notes: recruiterNotes,
  });
  return data.candidate;
}

export async function downloadCandidateResume(id, fileName) {
  const response = await api.get(`/candidates/${id}/resume/download`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName || "resume");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
