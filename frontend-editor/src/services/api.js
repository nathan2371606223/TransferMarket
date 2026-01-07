import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(password) {
  const res = await axios.post(`${API_BASE}/auth/login`, { password });
  return res.data;
}

export async function changePassword(token, oldPassword, newPassword) {
  const res = await axios.post(
    `${API_BASE}/auth/change-password`,
    { oldPassword, newPassword },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function fetchApplications(token, status) {
  const params = status ? { status } : {};
  const res = await axios.get(`${API_BASE}/applications`, {
    params,
    headers: authHeaders(token)
  });
  return res.data;
}

export async function updateApplication(token, id, data) {
  const res = await axios.put(`${API_BASE}/applications/${id}`, data, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function approveApplication(token, id) {
  const res = await axios.post(`${API_BASE}/applications/${id}/approve`, {}, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function rejectApplication(token, id) {
  const res = await axios.post(`${API_BASE}/applications/${id}/reject`, {}, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function fetchHistory(token, page = 1, pageSize = 10, team = null) {
  // History endpoint is public, but we can still send token for consistency
  const params = { page, pageSize };
  if (team) {
    params.team = team;
  }
  const res = await axios.get(`${API_BASE}/history`, {
    params
  });
  return res.data;
}

export async function updateHistory(token, id, data) {
  const res = await axios.put(`${API_BASE}/history/${id}`, data, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function archiveHistory(token) {
  const res = await axios.post(`${API_BASE}/history/archive`, {}, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function eraseHistory(token) {
  const res = await axios.delete(`${API_BASE}/history`, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function exportHistoryCsv() {
  const res = await axios.get(`${API_BASE}/history/export`, { responseType: "blob" });
  return res.data;
}

export async function fetchTeams() {
  const res = await axios.get(`${API_BASE}/teams`);
  return res.data;
}

