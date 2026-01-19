import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";
const TOKEN_KEY = "team_token";

export function getStoredToken() {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (typeof localStorage === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const client = axios.create({ baseURL: API_BASE });
client.interceptors.request.use((config) => {
  // Check for admin token (JWT) first, then fall back to team token
  const adminToken = localStorage.getItem("token"); // JWT token from editor login
  const teamToken = getStoredToken(); // Team token
  
  if (adminToken) {
    // Admin token takes precedence
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${adminToken}`;
  } else if (teamToken) {
    // Fall back to team token
    config.headers = config.headers || {};
    config.headers["X-Team-Token"] = teamToken;
  }
  return config;
});

export async function validateToken(token) {
  const res = await client.get("/teams", {
    headers: { "X-Team-Token": token }
  });
  return res.data;
}

export async function submitApplications(applications, force = false) {
  const res = await client.post(`/applications`, { applications, force });
  return res.data;
}

export async function fetchApplications() {
  const res = await client.get(`/applications`);
  return res.data;
}

export async function fetchMyTeamApplications() {
  const res = await client.get(`/applications/my-team`);
  return res.data;
}

export async function updateApplication(id, data) {
  const res = await client.put(`/applications/${id}`, data);
  return res.data;
}

export async function fetchHistory(page = 1, pageSize = 10, team = null) {
  const params = { page, pageSize };
  if (team) {
    params.team = team;
  }
  const res = await client.get(`/history`, { params });
  return res.data;
}

export async function exportHistoryCsv() {
  const res = await client.get(`/history/export`, { responseType: "blob" });
  return res.data;
}

export async function fetchTeams() {
  const res = await client.get(`/teams`);
  return res.data;
}

export async function fetchAnnouncement() {
  const res = await client.get(`/announcement`);
  return res.data;
}
