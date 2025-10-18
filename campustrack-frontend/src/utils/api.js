import axios from "axios";
export const apiPost = (url, data) => axios.post(`http://localhost:8080${url}`, data);
export const apiGet = (url) => axios.get(`http://localhost:8080${url}`);
