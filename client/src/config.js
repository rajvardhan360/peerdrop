const apiUrlFromEnv = import.meta.env.VITE_API_URL;

const fallbackLocalApi = "http://localhost:5000";

export const API_URL = apiUrlFromEnv || fallbackLocalApi;

export const APP_URL = window.location.origin;

export default {
  API_URL,
  APP_URL,
};