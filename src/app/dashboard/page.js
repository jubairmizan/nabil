"use client";

import RouteGuard from "@/components/RouteGuard";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { ArrowDown, ArrowUp, Clock, CreditCard, DollarSign, ShoppingBag, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
// Chart imports
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from "chart.js";
import { Bar, Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

// Functional component for stat cards
const StatCard = ({ title, value, subtitle, icon, color, percentChange }) => {
  return (
    <div className={styles.statCard} style={{ borderTop: `4px solid ${color}` }}>
      <div className={styles.statCardIcon} style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div className={styles.statCardContent}>
        <h3>{title}</h3>
        <p className={styles.statValue}>{value}</p>
        {subtitle && <p className={styles.statSubtitle}>{subtitle}</p>}
        {percentChange !== undefined && (
          <div
            className={styles.percentChange}
            style={{
              color: percentChange >= 0 ? "#10b981" : "#ef4444",
              backgroundColor: percentChange >= 0 ? "#10b98120" : "#ef444420",
            }}
          >
            {percentChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <span>{Math.abs(percentChange)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ShiftCard = ({ shiftData, yesterday, title, color }) => {
  // Calculate percent change when both values exist and aren't zero
  const calculateChange = (today, yesterday) => {
    if (yesterday === 0) {
      return today > 0 ? 100 : 0;
    }
    return Math.round(((today - yesterday) / yesterday) * 100);
  };

  const percentChange = calculateChange(shiftData.total_amount, yesterday?.total_amount || 0);

  return (
    <div className={styles.shiftCard} style={{ borderLeft: `4px solid ${color}` }}>
      <div className={styles.shiftCardHeader}>
        <h4>{title}</h4>
        <div
          className={styles.percentChange}
          style={{
            color: percentChange >= 0 ? "#10b981" : "#ef4444",
            backgroundColor: percentChange >= 0 ? "#10b98120" : "#ef444420",
          }}
        >
          {percentChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          <span>{Math.abs(percentChange)}%</span>
        </div>
      </div>
      <div className={styles.shiftCardBody}>
        <div className={styles.shiftMetric}>
          <span>Amount:</span>
          <strong>৳ {shiftData.total_amount.toLocaleString()}</strong>
        </div>
        <div className={styles.shiftMetric}>
          <span>Orders:</span>
          <strong>{shiftData.total_orders}</strong>
        </div>
      </div>
    </div>
  );
};

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Function to clear auth data if token is invalid
  const clearAuthData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Format currency in BDT
  const formatCurrency = (amount) => {
    return "৳ " + parseFloat(amount || 0).toLocaleString();
  };

  // Calculate percent change between two values
  const calculatePercentChange = (oldValue, newValue) => {
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    return Math.round(((newValue - oldValue) / oldValue) * 100);
  };

  useEffect(() => {
    // Check authentication and get user data
    async function loadData() {
      try {
        // Check auth
        const userData = localStorage.getItem("user");
        if (!userData) {
          router.push("/login");
          return;
        }

        // Parse user data
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Get dashboard stats
        const token = parsedUser.token || getAuthToken();

        if (!token) {
          console.error("No authentication token found");
          setError("Authentication failed. Please log in again.");
          router.push("/login");
          return;
        }

        console.log("Fetching from:", `${getApiBaseUrl()}/api/dashboard/stats`);

        const response = await fetch(`${getApiBaseUrl()}/api/dashboard/stats`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Response:", response.status, errorText);

          // If unauthorized, clear tokens and redirect to login
          if (response.status === 401) {
            clearAuthData();
            throw new Error("Session expired. Please login again.");
          }

          throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>!</div>
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return <div>No data available. Please refresh or try again later.</div>;
  }

  // Prepare data for sales by day of week chart
  const weekdayLabels = stats.current_week.sales_by_day.map((day) => day.day);
  const weekdaySalesData = stats.current_week.sales_by_day.map((day) => day.total_amount);
  const weekdayOrdersData = stats.current_week.sales_by_day.map((day) => day.total_orders);

  const weekdayChartData = {
    labels: weekdayLabels,
    datasets: [
      {
        label: "Sales (৳)",
        data: weekdaySalesData,
        backgroundColor: "rgba(56, 189, 248, 0.8)",
        borderColor: "rgba(56, 189, 248, 1)",
        borderWidth: 2,
      },
    ],
  };

  // Prepare data for monthly sales chart
  const monthlySalesData = {
    labels: stats.current_month.sales_chart.map((item) => item.day),
    datasets: [
      {
        label: "Sales (৳)",
        data: stats.current_month.sales_chart.map((item) => item.total_amount),
        fill: true,
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        borderColor: "rgba(124, 58, 237, 1)",
        tension: 0.4,
      },
    ],
  };

  // Prepare data for popular items chart
  const popularItemsData = {
    labels: stats.popular_items.map((item) => (item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name)),
    datasets: [
      {
        label: "Items Sold",
        data: stats.popular_items.map((item) => item.total_quantity),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Find top performing shifts
  const sortedShifts = [...stats.shift_performance].sort((a, b) => b.this_month.total_amount - a.this_month.total_amount);

  // Find yesterday's shift by ID to compare
  const findYesterdayShift = (shiftId) => {
    return stats.yesterday.shift_wise.find((shift) => shift.shift_id === shiftId);
  };

  return (
    <div className={styles.dashboardContent}>
      <div className={styles.dashboardHeader}>
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name || "User"}! Here's what's happening today.</p>
      </div>

      {/* Main Stats Row */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.today.total_sales)}
          subtitle={`${stats.today.total_orders} orders`}
          icon={<DollarSign size={24} />}
          color="#7c3aed"
          percentChange={calculatePercentChange(stats.yesterday.total_sales, stats.today.total_sales)}
        />

        <StatCard
          title="Today's Orders"
          value={stats.today.total_orders}
          subtitle="Total orders processed"
          icon={<ShoppingBag size={24} />}
          color="#0ea5e9"
          percentChange={calculatePercentChange(stats.yesterday.total_orders, stats.today.total_orders)}
        />

        <StatCard
          title="Avg. Order Value"
          value={formatCurrency(stats.today.total_orders > 0 ? stats.today.total_sales / stats.today.total_orders : 0)}
          subtitle="Average value per order"
          icon={<CreditCard size={24} />}
          color="#10b981"
        />

        <StatCard
          title="Yesterday's Sales"
          value={formatCurrency(stats.yesterday.total_sales)}
          subtitle={`${stats.yesterday.total_orders} orders`}
          icon={<TrendingUp size={24} />}
          color="#f97316"
        />
      </div>

      {/* Shift Stats Section */}
      <div className={styles.sectionTitle}>
        <Clock size={20} />
        <h2>Shift Performance (Today)</h2>
      </div>

      <div className={styles.shiftsContainer}>
        {stats.today.shift_wise.map((shift, index) => (
          <ShiftCard
            key={shift.shift_id}
            shiftData={shift}
            yesterday={findYesterdayShift(shift.shift_id)}
            title={shift.shift_name}
            color={index === 0 ? "#7c3aed" : index === 1 ? "#0ea5e9" : index === 2 ? "#10b981" : "#f97316"}
          />
        ))}
      </div>

      {/* Chart Section */}
      <div className={styles.chartsSection}>
        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h3>Sales by Day of Week</h3>
            <span className={styles.chartSubtitle}>Current week performance</span>
          </div>
          <Bar
            data={weekdayChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return "৳ " + value.toLocaleString();
                    },
                  },
                },
              },
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                },
              },
            }}
            height={300}
          />
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h3>Monthly Sales Trend</h3>
            <span className={styles.chartSubtitle}>Daily sales for current month</span>
          </div>
          <Line
            data={monthlySalesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return "৳ " + value.toLocaleString();
                    },
                  },
                },
              },
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                },
              },
            }}
            height={300}
          />
        </div>
      </div>

      {/* Popular Items & Shift Performance Section */}
      <div className={styles.secondarySection}>
        <div className={styles.popularItemsContainer}>
          <div className={styles.chartHeader}>
            <h3>Popular Items</h3>
            <span className={styles.chartSubtitle}>Top selling items this month</span>
          </div>
          <div className={styles.popularItemsList}>
            {stats.popular_items.slice(0, 5).map((item, index) => (
              <div key={index} className={styles.popularItem}>
                <div className={styles.popularItemRank}>{index + 1}</div>
                <div className={styles.popularItemInfo}>
                  <div className={styles.popularItemName}>{item.name}</div>
                  <div className={styles.popularItemDetails}>
                    <span>{item.total_quantity} sold</span>
                    <span>{formatCurrency(item.total_amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.shiftPerformanceContainer}>
          <div className={styles.chartHeader}>
            <h3>Shift Performance</h3>
            <span className={styles.chartSubtitle}>This month vs last month</span>
          </div>
          <div className={styles.shiftPerformanceList}>
            {sortedShifts.map((shift, index) => (
              <div key={shift.shift_id} className={styles.shiftPerformanceItem}>
                <div className={styles.shiftPerformanceName}>{shift.shift_name}</div>
                <div className={styles.shiftPerformanceMetrics}>
                  <div className={styles.shiftPerformanceMetric}>
                    <div className={styles.metricValue}>{formatCurrency(shift.this_month.total_amount)}</div>
                    <div className={styles.metricLabel}>Total Sales</div>
                  </div>
                  <div className={styles.shiftPerformanceMetric}>
                    <div className={styles.metricValue}>{shift.this_month.total_orders}</div>
                    <div className={styles.metricLabel}>Orders</div>
                  </div>
                  <div
                    className={styles.shiftPerformanceGrowth}
                    style={{
                      color: shift.growth.total_amount >= 0 ? "#10b981" : "#ef4444",
                    }}
                  >
                    {shift.growth.total_amount >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    <span>{Math.abs(shift.growth.total_amount)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedDashboard() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <Dashboard />
    </RouteGuard>
  );
}
