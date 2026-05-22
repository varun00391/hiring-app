const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function parseResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/resumes/parse`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.details = payload?.error?.details || {};
    error.code = payload?.error?.code;
    throw error;
  }

  return payload;
}
