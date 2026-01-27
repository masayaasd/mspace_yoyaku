import axios from "axios";

const apiBase = window.__ENV__?.VITE_API_BASE || import.meta.env.VITE_API_BASE || "/api";

export const api = axios.create({
    baseURL: apiBase,
});

export const setAuthToken = (token: string) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
};
