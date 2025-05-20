"use client";

import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { BarChart2, ChevronLeft, ChevronRight, FileDown, Search, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./shift-orders.module.css";

export default function ShiftOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch shift orders report
  const fetchShiftOrdersReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const API_BASE_URL = getApiBaseUrl();
      const queryParams = new URLSearchParams({
        per_page: itemsPerPage,
        page: currentPage,
      }).toString();

      const response = await fetch(`${API_BASE_URL}/api/shift-orders-report?${queryParams}`, {
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
      setFilteredOrders(data.orders.data || []);

      // Calculate total pages
      const total = data.orders.total || 0;
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error("Error fetching shift orders report:", error);
      setError(error.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchShiftOrdersReport();
  }, [currentPage, itemsPerPage]);

  // Filter orders when search term changes
  useEffect(() => {
    if (!reportData?.orders?.data) return;

    if (searchTerm.trim() === "") {
      setFilteredOrders(reportData.orders.data);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = reportData.orders.data.filter(
        (order) =>
          (order.id && String(order.id).toLowerCase().includes(searchLower)) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(searchLower)) ||
          (order.payment_method && order.payment_method.toLowerCase().includes(searchLower)) ||
          (order.total_amount && String(order.total_amount).toLowerCase().includes(searchLower)) ||
          (order.order_number && String(order.order_number).toLowerCase().includes(searchLower))
      );
      setFilteredOrders(filtered);
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
    if (!reportData?.orders?.data) return;

    // Define the columns for CSV
    const headers = ["Order #", "Date & Time", "Items", "Total Amount"];

    // Map orders data to CSV rows
    const csvRows = reportData.orders.data.map((order) => [
      order.order_number || order.id,
      formatDateTime(order.created_at),
      order.items ? order.items.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0) : 0,
      order.total_amount,
    ]);

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
    const filename = `${shiftName.replace(/\s+/g, "-").toLowerCase()}-orders-${dateStr}`;

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
        <p>Loading shift orders report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.shiftOrdersContainer}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Shift Orders</h1>
            <p>There was an error loading your shift orders report</p>
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
    <div className={styles.shiftOrdersContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Shift Orders</h1>
          <p>View detailed order information for your current or last shift</p>
        </div>
        <div className={styles.headerActions}>
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
          <div className={styles.summaryIcon}>
            <ShoppingBag size={20} />
          </div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryLabel}>Total Orders</h3>
            <p className={styles.summaryValue}>{reportData.totals.order_count}</p>
          </div>
        </div>

        <div className={styles.summaryItem}>
          <div className={styles.summaryIcon}>
            <BarChart2 size={20} />
          </div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryLabel}>Total Sales</h3>
            <p className={styles.summaryValue}>{formatCurrency(reportData.totals.total_amount)}</p>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className={styles.ordersSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Order List</h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className={styles.card}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <ShoppingBag size={48} strokeWidth={1} />
              </div>
              <h2 className={styles.emptyTitle}>No orders found</h2>
              <p className={styles.emptyText}>No orders have been placed during this shift</p>
            </div>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.tableTools}>
              <div>
                Showing {filteredOrders.length} of {reportData.totals.order_count} orders
              </div>

              <div className={styles.searchInputWrapper}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.ordersTable}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th>Order #</th>
                    <th>Date & Time</th>
                    <th>Total</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number || order.id}</td>
                      <td>{formatDateTime(order.created_at)}</td>
                      <td className={styles.amountCell}>{formatCurrency(order.total_amount)}</td>
                      <td className={styles.itemsCell}>
                        <div className={styles.itemsList}>
                          <span>{order.items.length} items</span>
                          <div className={styles.itemsTooltip}>
                            <ul>
                              {order.items.map((item, index) => (
                                <li key={index}>
                                  {item.quantity} x {item.name} ({formatCurrency(item.subtotal)})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                  className={styles.pageNavButton}
                >
                  <ChevronLeft size={16} />
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`${styles.pageButton} ${pageNum === currentPage ? styles.pageButtonActive : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages}
                  className={styles.pageNavButton}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
