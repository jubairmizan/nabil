"use client";

import { BarChart2, ClipboardList, Clock, LayoutDashboard, List, LogOut, Package, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState("guest");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUserRole(parsedUser.role || "guest");
        setUserName(parsedUser.name || "");
        setUserEmail(parsedUser.email || "");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Define what menu items are visible to each role
  const isMenuItemVisible = (menuItem) => {
    // Admin can see everything
    if (userRole === "admin") return true;

    // billing_counter role can only see specific pages
    if (userRole === "billing_counter") {
      return ["pos", "products", "orders", "shift_orders", "sale_out"].includes(menuItem);
    }

    // Default fallback - users can see dashboard and their own profile
    return ["dashboard"].includes(menuItem);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        {/* <h2>Restaurant POS</h2> */}
        {/* make height with according to the original size */}
        <img src="/assets/images/logo.png" alt="Restaurant Logo" style={{ height: "auto", width: "60%" }} />
        {/* <div className={styles.userInfo}>
          <p className={styles.userName}>{userName}</p>
          <p className={styles.userEmail}>{userEmail}</p>
          <p className={styles.userRole}>{userRole}</p>
        </div> */}
      </div>
      <nav className={styles.nav}>
        <ul>
          {isMenuItemVisible("dashboard") && (
            <li>
              <Link href="/dashboard" className={pathname === "/dashboard" ? styles.active : ""}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("pos") && (
            <li>
              <Link href="/dashboard/pos" className={pathname === "/dashboard/pos" ? styles.active : ""}>
                <ShoppingCart size={18} />
                <span>POS</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("categories") && (
            <li>
              <Link href="/dashboard/categories" className={pathname.startsWith("/dashboard/categories") ? styles.active : ""}>
                <List size={18} />
                <span>Categories</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("shifts") && (
            <li>
              <Link href="/dashboard/shifts" className={pathname.startsWith("/dashboard/shifts") ? styles.active : ""}>
                <Clock size={18} />
                <span>Shifts</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("products") && (
            <li>
              <Link href="/dashboard/products" className={pathname.startsWith("/dashboard/products") ? styles.active : ""}>
                <Package size={18} />
                <span>Products</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("orders") && (
            <li>
              <Link href="/dashboard/orders" className={pathname === "/dashboard/orders" ? styles.active : ""}>
                <ClipboardList size={18} />
                <span>Orders</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("shift_orders") && (
            <li>
              <Link href="/dashboard/shift-orders" className={pathname === "/dashboard/shift-orders" ? styles.active : ""}>
                <BarChart2 size={18} />
                <span>Shift Orders</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("sale_out") && (
            <li>
              <Link href="/dashboard/sale-out" className={pathname === "/dashboard/sale-out" ? styles.active : ""}>
                <Package size={18} />
                <span>Sale Out</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("reports") && (
            <li>
              <Link href="/dashboard/reports" className={pathname === "/dashboard/reports" ? styles.active : ""}>
                <BarChart2 size={18} />
                <span>Reports</span>
              </Link>
            </li>
          )}

          {isMenuItemVisible("users") && (
            <li>
              <Link href="/dashboard/users" className={pathname.startsWith("/dashboard/users") ? styles.active : ""}>
                <Users size={18} />
                <span>Users</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <div className={styles.logout}>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
