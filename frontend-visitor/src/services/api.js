import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export async function submitApplications(applications) {
  const res = await axios.post(`${API_BASE}/applications`, { applications });
  return res.data;
}

export async function fetchApplications() {
  const res = await axios.get(`${API_BASE}/applications`);
  return res.data;
}

export async function updateApplication(id, data) {
  const res = await axios.put(`${API_BASE}/applications/${id}`, data);
  return res.data;
}

export async function fetchHistory(page = 1, pageSize = 10) {
  const res = await axios.get(`${API_BASE}/history`, { params: { page, pageSize } });
  return res.data;
}

export async function exportHistoryCsv() {
  const res = await axios.get(`${API_BASE}/history/export`, { responseType: "blob" });
  return res.data;
}

