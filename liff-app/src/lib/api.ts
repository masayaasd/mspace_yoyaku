import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE;

export const api = axios.create({
    baseURL: apiBase,
});

export const setAuthToken = (token: string) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
};
