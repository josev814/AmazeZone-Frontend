import axios from "axios";

/**
 * @author Ankur Mundra on June, 2023
 */

// Get the API URL from environment variables, defaulting to localhost if not set
const apiUrl = `${import.meta.env.VITE_RUBY_API_URL || "http://localhost:3005"}`;

const axiosClient = axios.create({
  baseURL: apiUrl,
  timeout: 10000, // Increased from 1000ms to 10 seconds
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const axiosClientWithAuth = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach the current auth token from localStorage to every request.
// Reading the token at client-creation time (as a static default header) would
// freeze whatever value existed at page load, so it is resolved per request.
// The "Bearer " prefix matches the convention used by the backend's specs;
// the backend also accepts the bare token (it reads the last whitespace-
// separated part of the header).
axiosClientWithAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { axiosClient, axiosClientWithAuth };