"use client";

import { authService } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// Cache auth state globally to prevent repeated checks
const authCache = {
  lastChecked: 0,
  isValid: false,
  checkInterval: 5 * 60 * 1000, // 5 minutes
};

/**
 * Route Guard component for protecting routes that require authentication and specific roles
 */
export default function RouteGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check if we have a token in localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Check token expiration client-side if possible
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        const currentTime = Date.now();
        const needsServerCheck = currentTime - authCache.lastChecked > authCache.checkInterval || !authCache.isValid;

        // Only check with server if necessary
        if (needsServerCheck) {
          const isValid = await authService.checkAuth();

          authCache.lastChecked = currentTime;
          authCache.isValid = isValid;

          if (!isValid) {
            Swal.fire({
              title: "Session Expired",
              text: "Your session has expired. Please log in again.",
              icon: "warning",
              confirmButtonText: "OK",
              didClose: () => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login");
              },
            });
            return;
          }
        }

        // Check role restrictions
        if (allowedRoles && allowedRoles.length > 0) {
          if (user && user.role && allowedRoles.includes(user.role)) {
            setAuthorized(true);
          } else {
            router.push("/access-denied");
            return;
          }
        } else {
          setAuthorized(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  // Show minimal loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return authorized ? children : null;
}

// Usage example:
// <RouteGuard allowedRoles={["admin", "billing_counter"]}>
//   <YourProtectedComponent />
// </RouteGuard>
