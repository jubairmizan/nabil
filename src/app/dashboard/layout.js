"use client";

import { authService } from "@/lib/api";
import { Bell, Fullscreen, LogOut, Menu, Package, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import Sidebar from "../../components/Sidebar";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import styles from "./dashboard.module.css";

function DashboardLayoutContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarVisible, toggleSidebar, hideSidebar, showSidebar } = useSidebar();
  const initialHideApplied = useRef(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [userData, setUserData] = useState(null);
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Basic auth check on client side
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
    } else {
      setUserData(JSON.parse(user));

      // Validate token
      checkToken();
    }
  }, [router, pathname]);

  // Function to check if token is valid
  const checkToken = async () => {
    try {
      const isValid = await authService.checkAuth();

      if (!isValid && localStorage.getItem("token")) {
        // Token exists but is invalid - user was likely logged out by another session
        Swal.fire({
          title: "Session Expired",
          text: "You have been logged out because your account was logged in elsewhere.",
          icon: "warning",
          confirmButtonText: "OK",
          didClose: () => {
            // Clear auth data and redirect to login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
          },
        });
        setIsTokenValid(false);
      }
    } catch (error) {
      console.error("Token validation error:", error);
    }
  };

  // Hide sidebar by default on POS page, but only once when first navigating to the page
  useEffect(() => {
    if (pathname.includes("/dashboard/pos") && !initialHideApplied.current) {
      hideSidebar();
      initialHideApplied.current = true;
    } else if (!pathname.includes("/dashboard/pos")) {
      showSidebar();
      initialHideApplied.current = false;
    }
  }, [pathname, hideSidebar, showSidebar]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={`${styles.sidebarWrapper} ${!sidebarVisible ? styles.sidebarHidden : ""}`}>
        <Sidebar />
      </div>
      <div className={`${styles.mainContent} ${!sidebarVisible ? styles.mainContentFull : ""}`}>
        <div className={styles.topNavbar}>
          <div className={styles.topNavLeft}>
            <button className={`${styles.menuButton} ${!sidebarVisible ? styles.menuButtonActive : ""}`} onClick={toggleSidebar}>
              <Menu size={20} />
            </button>
          </div>
          <div className={styles.topNavCenter}>
            {/* POS */}
            <Link href="/dashboard/pos" className={styles.navLink}>
              <span className={styles.navIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </span>
              POS
            </Link>
            {/* Orders */}
            <Link href="/dashboard/shift-orders" className={styles.navLink}>
              <span className={styles.navIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8H3M21 12H3M21 16H3" />
                </svg>
              </span>
              Order List
            </Link>
            {/* Products */}
            <Link href="/dashboard/products" className={styles.navLink}>
              <span className={styles.navIcon}>
                <Package size={20} />
              </span>
              Products
            </Link>
            {/* Kitchen */}
            <Link href="/dashboard/kitchen" className={styles.navLink}>
              <span className={styles.navIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                  <line x1="6" y1="17" x2="18" y2="17" />
                </svg>
              </span>
              Kitchen Dashboard
            </Link>
          </div>
          <div className={styles.topNavRight}>
            <button className={styles.navIconBtn} onClick={toggleFullscreen}>
              <Fullscreen size={20} />
            </button>
            <button className={styles.navIconBtn}>
              <Bell size={20} />
              <span className={styles.notificationBadge}>3</span>
            </button>
            <div className={styles.userDropdownContainer} ref={dropdownRef}>
              <button className={styles.navIconBtn} onClick={toggleUserDropdown}>
                <User size={20} />
              </button>
              {userDropdownOpen && (
                <div className={styles.userDropdown}>
                  <div className={styles.userDropdownHeader}>
                    <div className={styles.userAvatar}>
                      <User size={24} />
                    </div>
                    <div className={styles.userDropdownInfo}>
                      <p className={styles.userDropdownName}>{userData?.name || "User"}</p>
                      <p className={styles.userDropdownEmail}>{userData?.email || "No email"}</p>
                    </div>
                  </div>
                  <div className={styles.userDropdownDivider}></div>
                  <div className={styles.userDropdownMenu}>
                    <Link href="#" className={styles.userDropdownItem}>
                      <Settings size={16} />
                      <span>Profile Settings</span>
                    </Link>
                    <button onClick={handleLogout} className={styles.userDropdownItem}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* add logout button with icon and text and logout function and color black */}
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={20} color="black" />
            </button>
            <button className={styles.langButton}>ENG</button>
          </div>
        </div>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
