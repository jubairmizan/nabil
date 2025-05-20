"use client";

import { authService } from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./login.module.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const router = useRouter();

  // Helper function to redirect based on user role
  const redirectBasedOnRole = (userData) => {
    try {
      if (!userData) return;

      const parsedUser = typeof userData === "string" ? JSON.parse(userData) : userData;

      if (parsedUser.role === "billing_counter") {
        console.log("Billing counter user detected, redirecting to POS");
        router.push("/dashboard/pos");
      } else if (parsedUser.role === "admin") {
        console.log("Admin user detected, redirecting to dashboard");
        router.push("/dashboard");
      } else {
        // Default case for other roles
        console.log("Other user role detected, redirecting to dashboard");
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Error parsing user data or redirecting:", e);
      // Fallback to dashboard as default
      router.push("/dashboard");
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    // Clear any previous session storage messages to avoid showing on fresh login
    if (window.location.pathname === "/login" && !window.location.search) {
      sessionStorage.removeItem("auth_message");
    }

    const checkExistingAuth = () => {
      try {
        // Check for auth message from token invalidation
        const authMessage = sessionStorage.getItem("auth_message");
        if (authMessage) {
          setError(authMessage);
          // Clear the message to prevent showing it again on refresh
          sessionStorage.removeItem("auth_message");
        }

        const user = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (user && token) {
          console.log("User already logged in, redirecting based on role");
          redirectBasedOnRole(user);
        } else {
          console.log("No authentication found, staying on login page");
          setDebugInfo({ hasUser: !!user, hasToken: !!token });
        }
      } catch (e) {
        console.error("Error checking authentication:", e);
      }
    };

    checkExistingAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple validation
    if (!username || !password) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      // Connect to Laravel backend
      const response = await authService.login(username, password);

      if (response.token) {
        console.log("Login successful, token received");

        // Double-check token is properly stored
        setTimeout(() => {
          const user = localStorage.getItem("user");
          const token = localStorage.getItem("token");

          if (user && token) {
            console.log("Authentication data stored successfully");
            redirectBasedOnRole(user);
          } else {
            setError("Authentication failed: Could not store credentials. Please try again.");
            console.error("Failed to store authentication data", { user, token });
          }
        }, 100); // Small delay to ensure storage completes
      } else {
        setError("Server returned success but no authentication token was provided");
      }
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Invalid username or password";

      // Get more specific error message if available
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.animatedBackground}>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
        <div className={styles.bubbles}></div>
      </div>

      <div className={styles.loginPanel}>
        <div className={styles.leftPanel}>
          <div className={styles.logoWrapper}>
            <Image
              src="/assets/images/logo.png"
              alt="Restaurant Logo"
              width={542}
              height={149}
              style={{
                width: "100%",
                height: "auto",
                maxWidth: "300px",
                objectFit: "contain",
              }}
              priority
            />
          </div>
          <h2 className={styles.welcomeText}>Welcome Back</h2>
          <p className={styles.tagline}>Manage your restaurant with ease</p>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.formWrapper}>
            <h2 className={styles.loginHeader}>Sign In</h2>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Email</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={styles.input}
                    autoComplete="email"
                    placeholder="admin@nabil.com"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelWrapper}>
                  <label htmlFor="password">Password</label>
                  <a href="#" className={styles.forgotPassword}>
                    Forgot password?
                  </a>
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? (
                  <div className={styles.buttonLoader}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
