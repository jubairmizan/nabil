"use client";

import RouteGuard from "@/components/RouteGuard";
import { BarChart3, DownloadCloud, ExternalLink, Filter } from "lucide-react";
import { useState } from "react";
import styles from "../products/products.module.css";

function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Reports</h1>
          <p>View and analyze business performance</p>
        </div>
        <div className={styles.headerActions} style={{ display: "flex", gap: "10px" }}>
          <button
            className={styles.filterButton}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "#f8f9fa",
              color: "#333",
              border: "1px solid #dee2e6",
              padding: "8px 16px",
              borderRadius: "6px",
            }}
          >
            <Filter size={16} />
            <span>Filters</span>
          </button>
          <button className={styles.addButton} style={{ background: "var(--primary-color)" }}>
            <DownloadCloud size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: "20px" }}>
        <div className={styles.reportTabs} style={{ display: "flex", borderBottom: "1px solid #eaedf1", marginBottom: "20px" }}>
          <button
            onClick={() => setActiveTab("sales")}
            className={`${styles.reportTab} ${activeTab === "sales" ? styles.activeTab : ""}`}
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "sales" ? "2px solid var(--primary-color)" : "2px solid transparent",
              color: activeTab === "sales" ? "var(--primary-color)" : "#555",
              fontWeight: activeTab === "sales" ? "500" : "400",
              cursor: "pointer",
            }}
          >
            Sales Reports
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`${styles.reportTab} ${activeTab === "inventory" ? styles.activeTab : ""}`}
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "inventory" ? "2px solid var(--primary-color)" : "2px solid transparent",
              color: activeTab === "inventory" ? "var(--primary-color)" : "#555",
              fontWeight: activeTab === "inventory" ? "500" : "400",
              cursor: "pointer",
            }}
          >
            Inventory Reports
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`${styles.reportTab} ${activeTab === "staff" ? styles.activeTab : ""}`}
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "staff" ? "2px solid var(--primary-color)" : "2px solid transparent",
              color: activeTab === "staff" ? "var(--primary-color)" : "#555",
              fontWeight: activeTab === "staff" ? "500" : "400",
              cursor: "pointer",
            }}
          >
            Staff Performance
          </button>
        </div>

        <div className={styles.reportContent}>
          {activeTab === "sales" && (
            <div className={styles.reportSection}>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <BarChart3 size={60} style={{ color: "#d1d5db", margin: "0 auto 20px" }} />
                <h3 style={{ color: "#374151", marginBottom: "10px", fontWeight: "500" }}>Sales Analytics</h3>
                <p style={{ color: "#6b7280", maxWidth: "500px", margin: "0 auto" }}>
                  This feature is being developed. Soon you'll be able to see detailed sales reports and analytics here.
                </p>
                <button
                  style={{
                    marginTop: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "var(--primary-color)",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  <ExternalLink size={16} />
                  <span>Request Feature Details</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className={styles.reportSection}>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <BarChart3 size={60} style={{ color: "#d1d5db", margin: "0 auto 20px" }} />
                <h3 style={{ color: "#374151", marginBottom: "10px", fontWeight: "500" }}>Inventory Reports</h3>
                <p style={{ color: "#6b7280", maxWidth: "500px", margin: "0 auto" }}>
                  Track inventory levels, usage patterns, and stock valuation with detailed reports. Coming soon.
                </p>
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className={styles.reportSection}>
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <BarChart3 size={60} style={{ color: "#d1d5db", margin: "0 auto 20px" }} />
                <h3 style={{ color: "#374151", marginBottom: "10px", fontWeight: "500" }}>Staff Performance Analytics</h3>
                <p style={{ color: "#6b7280", maxWidth: "500px", margin: "0 auto" }}>
                  Analyze staff productivity, sales performance, and service metrics to optimize your team. Coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <h3 style={{ marginBottom: "15px", color: "#374151", fontWeight: "500" }}>Reports Summary</h3>
        <p style={{ color: "#6b7280" }}>
          The Reports section allows administrators to gain insights into restaurant operations, track business performance, and make data-driven
          decisions. Choose a report type from the tabs above to view more details.
        </p>
      </div>
    </div>
  );
}

export default function ProtectedReportsPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ReportsPage />
    </RouteGuard>
  );
}
