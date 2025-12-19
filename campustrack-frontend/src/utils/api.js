import axios from "axios";

// Central API base — Vite uses `import.meta.env.VITE_API_BASE` for runtime config.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export const apiPost = (url, data) => axios.post(`${API_BASE}${url}`, data, { withCredentials: true });
export const apiGet = (url) => axios.get(`${API_BASE}${url}`, { withCredentials: true });