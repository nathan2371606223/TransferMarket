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
  if (team && team.trim()) {
    params.team = team.trim();
  }
  const res = await axios.get(`${API_BASE}/history`, {
    params,
    headers: authHeaders(token) // Send JWT token for editor site
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

export async function fetchTeams(token) {
  const res = await axios.get(`${API_BASE}/teams`, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function checkDuplicateNames(token) {
  const res = await axios.get(`${API_BASE}/history/check-duplicate-names`, {
    headers: authHeaders(token)
  });
  return res.data;
}

// Token alerts (shared table)
export async function fetchTokenAlerts(token, resolved = false) {
  const res = await axios.get(`${API_BASE}/token-alerts`, {
    params: { resolved },
    headers: authHeaders(token)
  });
  return res.data;
}

export async function resolveTokenAlert(token, id) {
  const res = await axios.post(`${API_BASE}/token-alerts/${id}/resolve`, {}, { headers: authHeaders(token) });
  return res.data;
}

export async function deleteTokenAlert(token, id) {
  const res = await axios.delete(`${API_BASE}/token-alerts/${id}`, { headers: authHeaders(token) });
  return res.data;
}

// Announcement
export async function fetchAnnouncement(token) {
  const res = await axios.get(`${API_BASE}/announcement`, {
    headers: authHeaders(token)
  });
  return res.data;
}

export async function updateAnnouncement(token, content) {
  const res = await axios.put(`${API_BASE}/announcement`, { content }, {
    headers: authHeaders(token)
  });
  return res.data;
}
