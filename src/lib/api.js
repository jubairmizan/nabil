import axios from "axios";
import { getApiBaseUrl } from "./api-config";

// Get the API base URL
const baseURL = getApiBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Important for cookies/CSRF token
});

// Request interceptor to add authentication token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't show logout message for login attempts or when no user is logged in
    const isLoginAttempt = error.config.url.includes("/login");
    const hasUserData = localStorage.getItem("user") && localStorage.getItem("token");

    if (error.response && error.response.status === 401 && typeof window !== "undefined" && !isLoginAttempt && hasUserData) {
      // Unauthorized - clear token and store a message for the login page
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Add a message to sessionStorage indicating that the user has been logged out
      sessionStorage.setItem("auth_message", "You have been logged out because your session expired.");

      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Separate instance for CSRF token requests
const csrfInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

// Authentication services
export const authService = {
  // Get CSRF token
  getCsrfToken: async () => {
    try {
      await csrfInstance.get("/sanctum/csrf-cookie");
      return true;
    } catch (error) {
      console.error("Failed to get CSRF token:", error);
      return false;
    }
  },

  // Login with credentials
  login: async (email, password) => {
    try {
      // First get CSRF token
      try {
        await authService.getCsrfToken();
      } catch (csrfError) {
        console.warn("CSRF token fetch failed, continuing login attempt anyway:", csrfError);
        // Continue with login even if CSRF fails - it might not be required for token-based auth
      }

      // Send login request
      const response = await api.post("/login", { email, password });

      // Store token and user data
      if (response.data.token) {
        // Store token separately for API calls
        localStorage.setItem("token", response.data.token);

        // Create user object with token included
        const userData = {
          ...(response.data.user || { email }),
          token: response.data.token, // Include token in the user object
        };

        // Store complete user data with token
        localStorage.setItem("user", JSON.stringify(userData));

        console.log("Authentication successful. Token stored with user data.");
      } else {
        console.error("No token received from server during login");
        throw new Error("No authentication token was provided");
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.post("/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local storage even if API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return false;
    }
  },

  // Get current user
  getUser: async () => {
    try {
      const response = await api.get("/user");
      return response.data;
    } catch (error) {
      console.error("Get user error:", error);
      const cachedUser = localStorage.getItem("user");
      return cachedUser ? JSON.parse(cachedUser) : null;
    }
  },

  // Check if user is authenticated
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      await api.get("/user");
      return true;
    } catch (error) {
      return false;
    }
  },
};

// POS related services
export const posService = {
  // Get all menu items
  getMenuItems: async () => {
    try {
      const response = await api.get("/menu-items");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
      return [];
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get("/categories");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return [];
    }
  },

  // Create order
  createOrder: async (orderData) => {
    try {
      const response = await api.post("/orders", orderData);
      return response.data;
    } catch (error) {
      console.error("Failed to create order:", error);
      throw error;
    }
  },

  // Get all orders
  getOrders: async () => {
    try {
      const response = await api.get("/orders");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      return [];
    }
  },

  // Get order by ID
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch order ${orderId}:`, error);
      return null;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.patch(`/orders/${orderId}`, { status });
      return response.data;
    } catch (error) {
      console.error(`Failed to update order ${orderId}:`, error);
      throw error;
    }
  },
};

export default api;
