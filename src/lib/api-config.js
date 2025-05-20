"use client";

// This file centralizes API URL configuration for client components
export const getApiBaseUrl = () => {
  // Use NEXT_PUBLIC_API_URL environment variable if available (set in next.config.js)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback logic based on environment
  if (process.env.NODE_ENV === "production") {
    return "https://nabil-backend.projectsample.info";
  }

  // Default for local development
  return "http://localhost:8000";
};

// Helper function to get the stored authentication token
export const getAuthToken = () => {
  if (typeof window === "undefined") return null;

  // First try to get token from localStorage directly
  const token = localStorage.getItem("token");
  if (token) return token;

  // If not found, try to get it from the user object
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.token || null;
    }
  } catch (e) {
    console.error("Error parsing user data:", e);
  }

  return null;
};
