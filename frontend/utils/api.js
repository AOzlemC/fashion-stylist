import Constants from "expo-constants";

// Expo SDK 49+ uyumlu
const API_HOST = Constants.expoConfig?.extra?.API_HOST || "192.168.1.100";
const API_PORT = Constants.expoConfig?.extra?.API_PORT || 5050;

const BASE_URL = `http://${API_HOST}:${API_PORT}/auth`;

// Signup
export const signup = async (name, email, password) => {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email: email.toLowerCase(), password }),
  });
  return res.json();
};

// Login
export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/Loginscreen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.toLowerCase(), password }),
  });
  return res.json();
};