"use client";

import SaleOutPrint from "@/components/SaleOutPrint";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { BarChart2, FileDown, Package, Search, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./sale-out.module.css";

export default function SaleOutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  // Fetch sale out report data
  const fetchSaleOutReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/sale-out-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data);
      setFilteredItems(data.items || []);
    } catch (error) {
      console.error("Error fetching sale out report:", error);
      setError(error.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchSaleOutReport();
  }, []);

  // Filter items when search term changes
  useEffect(() => {
    if (!reportData?.items) return;

    if (searchTerm.trim() === "") {
      setFilteredItems(reportData.items);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = reportData.items.filter((item) => item.name.toLowerCase().includes(searchLower));
      setFilteredItems(filtered);
    }
  }, [searchTerm, reportData]);

  // Format currency
  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date only
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time only
  const formatTime = (timeString) => {
    return timeString;
  };

  // Download CSV function
  const downloadCSV = () => {
    if (!reportData?.items) return;

    // Define the columns for CSV
    const headers = ["Item Name", "Quantity", "Unit Price", "Total Amount"];

    // Map items data to CSV rows
    const csvRows = reportData.items.map((item) => [item.name, item.quantity, formatCurrency(item.unit_price), formatCurrency(item.total_amount)]);

    // Add headers as the first row
    const csvData = [headers, ...csvRows];

    // Convert each row to comma-separated values
    const csvContent = csvData
      .map((row) =>
        row
          .map((cell) =>
            // Escape quotes and wrap content with quotes if it contains comma, quote or newline
            typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n")) ? `"${cell.replace(/"/g, '""')}"` : cell
          )
          .join(",")
      )
      .join("\n");

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Generate appropriate filename
    const shiftName = reportData.shift?.name || "shift";
    const dateStr = reportData.date_range?.start_date || new Date().toISOString().split("T")[0];
    const filename = `${shiftName.replace(/\s+/g, "-").toLowerCase()}-sale-out-${dateStr}`;

    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading sale out report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Sale Out Report</h1>
            <p>There was an error loading your sale out report</p>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <BarChart2 size={48} strokeWidth={1} />
            </div>
            <h2 className={styles.emptyTitle}>Error Loading Report</h2>
            <p className={styles.emptyText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Sale Out Report</h1>
          <p>View item-wise sales for your current or last shift</p>
        </div>
        <div className={styles.headerActions}>
          <SaleOutPrint reportData={reportData} />
          <button className={styles.exportButton} onClick={downloadCSV}>
            <FileDown size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Shift Information Card */}
      <div className={`${styles.card} ${styles.shiftInfoCard}`}>
        <div className={styles.shiftHeader}>
          <h2 className={styles.shiftTitle}>{reportData.shift.name}</h2>
          <span className={`${styles.shiftStatus} ${reportData.shift.status === "active" ? styles.activeStatus : styles.pastStatus}`}>
            {reportData.shift.status === "active" ? "Active Shift" : "Past Shift"}
          </span>
        </div>

        <div className={styles.shiftDetails}>
          <div className={styles.shiftDetail}>
            <div className={styles.detailLabel}>Shift Time</div>
            <div className={styles.detailValue}>
              {formatTime(reportData.shift.start_time)} - {formatTime(reportData.shift.end_time)}
            </div>
            <div className={styles.dateRange}>{reportData.shift.is_overnight ? "Overnight Shift" : "Same Day Shift"}</div>
          </div>

          <div className={styles.shiftDetail}>
            <div className={styles.detailLabel}>Date Range</div>
            <div className={styles.detailValue}>
              {formatDate(reportData.date_range.start_date)}
              {reportData.date_range.start_date !== reportData.date_range.end_date && ` - ${formatDate(reportData.date_range.end_date)}`}
            </div>
          </div>

          <div className={styles.shiftDetail}>
            <div className={styles.detailLabel}>Current Time</div>
            <div className={styles.detailValue}>{formatDateTime(reportData.current_time)}</div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryItem}>
          <div className={`${styles.summaryIcon} ${styles.ordersIcon}`}>
            <ShoppingBag size={20} />
          </div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryLabel}>Total Orders</h3>
            <p className={styles.summaryValue}>{reportData.totals.order_count}</p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={`${styles.summaryIcon} ${styles.itemsIcon}`}>
            <Package size={20} />
          </div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryLabel}>Total Items</h3>
            <p className={styles.summaryValue}>{reportData.totals.total_items}</p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={`${styles.summaryIcon} ${styles.salesIcon}`}>
            <BarChart2 size={20} />
          </div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryLabel}>Total Sales</h3>
            <p className={styles.summaryValue}>{formatCurrency(reportData.totals.total_amount)}</p>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className={styles.itemsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Items Sold</h2>
        </div>

        {filteredItems.length === 0 ? (
          <div className={styles.card}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Package size={48} strokeWidth={1} />
              </div>
              <h2 className={styles.emptyTitle}>No items found</h2>
              <p className={styles.emptyText}>No items have been sold during this shift</p>
            </div>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.tableTools}>
              <div>Showing {filteredItems.length} items</div>

              <div className={styles.searchInputWrapper}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search items..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.itemsTable}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th>Item Name</th>
                    <th className={styles.quantityCell}>Quantity</th>
                    <th className={styles.priceCell}>Unit Price</th>
                    <th className={styles.amountCell}>Total Amount</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td className={styles.quantityCell}>{item.quantity}</td>
                      <td className={styles.priceCell}>{formatCurrency(item.unit_price)}</td>
                      <td className={styles.amountCell}>{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
