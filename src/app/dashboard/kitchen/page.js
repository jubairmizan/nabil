"use client";

import { ArrowUpRight, Clock } from "lucide-react";
import styles from "../dashboard.module.css";

export default function KitchenDashboard() {
  return (
    <div className={styles.dashboardContent}>
      <div
        className={styles.upcomingContainer}
        style={{
          textAlign: "center",
          padding: "3rem",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          maxWidth: "800px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            margin: "0 auto 2rem",
            borderRadius: "50%",
            background: "rgba(56, 189, 248, 0.1)",
            color: "rgb(56, 189, 248)",
          }}
        >
          <Clock size={40} />
        </div>
        <h2
          style={{
            fontSize: "2.5rem",
            fontWeight: "600",
            marginBottom: "1.5rem",
            background: "linear-gradient(90deg, #3498db, #8e44ad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          UPCOMING
        </h2>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#64748b",
            marginBottom: "2rem",
          }}
        >
          The Kitchen Dashboard is under development and will be available soon
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1.5rem",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.05)",
              border: "1px dashed rgba(56, 189, 248, 0.3)",
              width: "220px",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>Order Management</h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", textAlign: "center" }}>View and manage incoming kitchen orders</p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "1.5rem",
              borderRadius: "8px",
              background: "rgba(124, 58, 237, 0.05)",
              border: "1px dashed rgba(124, 58, 237, 0.3)",
              width: "220px",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem", fontSize: "1.1rem" }}>Order Status</h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", textAlign: "center" }}>Track preparation status of all orders</p>
          </div>
        </div>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: "2rem auto 0",
            background: "rgb(56, 189, 248)",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "6px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Learn More
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}
