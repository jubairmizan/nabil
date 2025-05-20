"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./access-denied.module.css";

export default function AccessDeniedPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [homeLink, setHomeLink] = useState("/dashboard");

  // Function to determine the appropriate home link based on user role
  const getHomeLink = (userData) => {
    if (!userData || !userData.role) return "/dashboard";

    if (userData.role === "billing_counter") {
      return "/dashboard/pos";
    } else if (userData.role === "admin") {
      return "/dashboard";
    }

    // Default fallback
    return "/dashboard";
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setHomeLink(getHomeLink(parsedUser));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      // If no user is logged in, redirect to login
      router.push("/login");
    }
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <AlertTriangle size={48} className={styles.icon} />
        </div>
        <h1 className={styles.title}>Access Denied</h1>
        <p className={styles.message}>Sorry, you don&apos;t have permission to access this page.</p>
        {user && (
          <div className={styles.userInfo}>
            <p className={styles.userDetails}>
              Logged in as: <span className={styles.userName}>{user.name}</span>
            </p>
            <p className={styles.roleInfo}>
              Current role: <span className={styles.roleBadge}>{user.role || "guest"}</span>
            </p>
          </div>
        )}
        <div className={styles.actions}>
          <Link href={homeLink} className={styles.backButton}>
            <ArrowLeft size={18} />
            <span>Back to {user?.role === "billing_counter" ? "POS" : "Dashboard"}</span>
          </Link>
          <button onClick={() => router.back()} className={styles.secondaryButton}>
            Return to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
}
