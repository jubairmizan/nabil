"use client";

import ReceiptModal from "@/components/ReceiptModal";
import ShiftSummaryReport from "@/components/ShiftSummaryReport";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, CreditCard, FileDown, Search, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../products/products.module.css";
import orderStyles from "./orders.module.css";

export default function OrdersPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  const [selectedShift, setSelectedShift] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSales, setFilteredSales] = useState([]);
  const [totals, setTotals] = useState({
    count: 0,
    total_amount: 0,
    payment_methods: {},
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0); // Total items from backend for pagination

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [sortConfig, setSortConfig] = useState({ field: "created_at", direction: "desc" });

  // Filter UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState("today");
  const [isDateRange, setIsDateRange] = useState(false);

  // Receipt modal state
  const [selectedSale, setSelectedSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // User state
  const [userRole, setUserRole] = useState(null);
  const [userShift, setUserShift] = useState(null);
  const [isNightShift, setIsNightShift] = useState(false);

  // Refs to prevent duplicate fetches
  const isDataFetched = useRef(false);
  const isShiftsFetched = useRef(false);
  const abortControllerRef = useRef(null);

  // New state to handle the active tab
  const [activeTab, setActiveTab] = useState("orders");

  const router = useRouter();

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

  // Get display text for the active date filter
  const getDateFilterDisplayText = () => {
    if (isDateRange && dateRange.start_date !== dateRange.end_date) {
      return `${formatDate(dateRange.start_date)} - ${formatDate(dateRange.end_date)}`;
    }

    switch (activeDateFilter) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "last2days":
        return "2 days ago";
      case "last3days":
        return "3 days ago";
      case "last7days":
        return "Last 7 days";
      case "thisWeek":
        return "This week";
      case "thisMonth":
        return "This month";
      case "custom":
        return formatDate(dateRange.start_date);
      default:
        return formatDate(dateRange.start_date);
    }
  };

  // Date helper functions
  const getYesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
  };

  const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  };

  const getStartOfWeek = () => {
    const date = new Date();
    const day = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const getStartOfMonth = () => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  };

  // Handle shift change
  const handleShiftChange = (shiftId) => {
    setSelectedShift(shiftId);
    setShowShiftDropdown(false);
    setCurrentPage(1); // Reset to first page when filter changes
    setSearchTerm(""); // Clear search when filter changes

    // When shift changes, we need to fetch new data
    // The fetchSales and fetchOrderReport will be called via the useEffect
    // dependencies already in place
  };

  // Quick date selection handlers
  const handleQuickDateSelect = (filterType) => {
    const today = new Date().toISOString().split("T")[0];
    let start_date = today;
    let end_date = today;

    switch (filterType) {
      case "today":
        start_date = today;
        end_date = today;
        setIsDateRange(false);
        break;
      case "yesterday":
        start_date = getYesterday();
        end_date = getYesterday();
        setIsDateRange(false);
        break;
      case "last2days":
        start_date = getDaysAgo(2);
        end_date = getDaysAgo(2);
        setIsDateRange(false);
        break;
      case "last3days":
        start_date = getDaysAgo(3);
        end_date = getDaysAgo(3);
        setIsDateRange(false);
        break;
      case "last7days":
        start_date = getDaysAgo(7);
        end_date = today;
        setIsDateRange(true);
        break;
      case "thisWeek":
        start_date = getStartOfWeek();
        end_date = today;
        setIsDateRange(true);
        break;
      case "thisMonth":
        start_date = getStartOfMonth();
        end_date = today;
        setIsDateRange(true);
        break;
      default:
        start_date = today;
        end_date = today;
        setIsDateRange(false);
    }

    setDateRange({ start_date, end_date });
    setActiveDateFilter(filterType);
    setShowDatePicker(false);
    setCurrentPage(1); // Reset to first page when filter changes
    setSearchTerm(""); // Clear search when filter changes

    // For billing_counter with night shift, we might need additional adjustments
    if (userRole === "billing_counter" && isNightShift && !isDateRange) {
      // If selecting a single day for a night shift, the backend query needs special handling
      // which happens in fetchSales
    }

    // The fetchSales and fetchOrderReport will be called via the useEffect
    // dependencies already in place
  };

  // Handle date range selection
  const handleDateRangeChange = (type, value) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: value,
    }));
    setActiveDateFilter("custom");
    setIsDateRange(true);

    // We don't reset the page here since this might be called rapidly
    // as user selects dates. The page reset will happen when they close the
    // date picker or when they click a quick select option.
  };

  // Show receipt modal
  const handleViewReceipt = (sale) => {
    setSelectedSale(sale);
    setIsReceiptModalOpen(true);
  };

  // Close receipt modal
  const handleCloseModal = () => {
    setIsReceiptModalOpen(false);
  };

  // Memoized fetch shifts function
  const fetchShifts = useCallback(async () => {
    if (isShiftsFetched.current) return;

    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/shifts`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "force-cache",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setShifts(data);
      isShiftsFetched.current = true;

      // If user data is already loaded, set up user's shift
      if (userRole === "billing_counter") {
        setupUserShift(data);
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  }, [router, userRole]);

  // Check if a user has night shift and set up initial date ranges accordingly
  const setupUserShift = useCallback(
    (shiftsData) => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (userData && userData.shift_id && shiftsData.length > 0) {
          const shift = shiftsData.find((s) => s.id === userData.shift_id);

          if (shift) {
            setUserShift(shift);

            // Check if it's a night shift (end time is less than start time)
            const isNightShift = shift.start_time > shift.end_time;
            setIsNightShift(isNightShift);

            // Always set the selected shift to the user's shift for billing_counter
            setSelectedShift(shift.id.toString());

            if (userRole === "billing_counter") {
              const now = new Date();
              const today = now.toISOString().split("T")[0];
              const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

              // Helper function to check if current time is within shift
              const isWithinShift = () => {
                if (isNightShift) {
                  // For night shift (e.g. 4:00 PM to 4:00 AM), time is within shift if:
                  // - Current time is after start time OR
                  // - Current time is before end time
                  return currentTime >= shift.start_time || currentTime < shift.end_time;
                } else {
                  // For day shift, time is within shift if:
                  // - Current time is between start and end time
                  return currentTime >= shift.start_time && currentTime < shift.end_time;
                }
              };

              // Get yesterday date string
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split("T")[0];

              // Get tomorrow date string
              const tomorrow = new Date(now);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split("T")[0];

              if (isNightShift) {
                // Night shift handling (e.g. 4:00 PM to 4:00 AM)
                if (isWithinShift()) {
                  // Currently within the night shift
                  if (currentTime < shift.end_time) {
                    // If current time is before end time (e.g. 2:00 AM),
                    // the shift started yesterday and ends today
                    setDateRange({
                      start_date: yesterdayStr,
                      end_date: today,
                    });
                    setIsDateRange(true);
                    setActiveDateFilter("custom");
                  } else {
                    // If current time is after start time (e.g. 8:00 PM),
                    // the shift started today and ends tomorrow
                    setDateRange({
                      start_date: today,
                      end_date: tomorrowStr,
                    });
                    setIsDateRange(true);
                    setActiveDateFilter("custom");
                  }
                } else {
                  // Outside of shift hours - show the last completed shift
                  // If we're between end time and start time (e.g. 5:00 AM to 4:00 PM)
                  // Show yesterday's full night shift
                  const dayBeforeYesterday = new Date(yesterday);
                  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
                  const dayBeforeYesterdayStr = dayBeforeYesterday.toISOString().split("T")[0];

                  if (currentTime >= shift.end_time && currentTime < shift.start_time) {
                    // Between end and start time - show the shift that just ended
                    setDateRange({
                      start_date: yesterdayStr,
                      end_date: today,
                    });
                    setIsDateRange(true);
                    setActiveDateFilter("custom");
                  } else {
                    // Otherwise, show the previous day's shift
                    setDateRange({
                      start_date: dayBeforeYesterdayStr,
                      end_date: yesterdayStr,
                    });
                    setIsDateRange(true);
                    setActiveDateFilter("custom");
                  }
                }
              } else {
                // Day shift handling (e.g. 4:00 AM to 4:00 PM)
                if (isWithinShift()) {
                  // Current time is within shift, show today's data
                  setDateRange({
                    start_date: today,
                    end_date: today,
                  });
                  setActiveDateFilter("today");
                } else if (currentTime < shift.start_time) {
                  // Before shift starts, show yesterday's completed shift
                  setDateRange({
                    start_date: yesterdayStr,
                    end_date: yesterdayStr,
                  });
                  setActiveDateFilter("yesterday");
                } else {
                  // After shift ends, show today's completed shift
                  setDateRange({
                    start_date: today,
                    end_date: today,
                  });
                  setActiveDateFilter("today");
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error setting up user shift:", error);
      }
    },
    [userRole]
  );

  // Memoized fetch sales function
  const fetchSales = useCallback(async () => {
    // Cancel any in-progress fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this fetch
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Set up API parameters
      const API_BASE_URL = getApiBaseUrl();
      let queryParams;

      if (userRole === "billing_counter" && userShift) {
        // For billing_counter users, always include their shift ID and use the date range
        // that was set up in setupUserShift
        queryParams = new URLSearchParams({
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          shift_id: userShift.id.toString(),
          sort_field: sortConfig.field,
          sort_direction: sortConfig.direction,
          per_page: itemsPerPage,
          page: currentPage,
        }).toString();
      } else {
        // For admin and other users, use the selected shift and handle night shifts
        let adjustedStartDate = dateRange.start_date;
        let adjustedEndDate = dateRange.end_date;

        // Handle selected shift that crosses date boundaries
        if (selectedShift !== "all") {
          const selectedShiftData = shifts.find((shift) => shift.id.toString() === selectedShift.toString());

          if (selectedShiftData) {
            // Check if this is a night shift (end time is less than start time)
            const isSelectedNightShift = selectedShiftData.start_time > selectedShiftData.end_time;

            if (isSelectedNightShift && dateRange.start_date === dateRange.end_date) {
              // For night shifts with a single date selected, extend the range to capture overnight data
              const endDateObj = new Date(dateRange.end_date);
              endDateObj.setDate(endDateObj.getDate() + 1);
              adjustedEndDate = endDateObj.toISOString().split("T")[0];
            }
          }
        }

        queryParams = new URLSearchParams({
          start_date: adjustedStartDate,
          end_date: adjustedEndDate,
          shift_id: selectedShift,
          sort_field: sortConfig.field,
          sort_direction: sortConfig.direction,
          per_page: itemsPerPage,
          page: currentPage,
        }).toString();
      }

      const response = await fetch(`${API_BASE_URL}/api/sales?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setSales(data.sales.data);
      setTotalItems(data.sales.total); // Store the total count for pagination
      setFilteredSales(data.sales.data);
      setTotals(data.totals);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching sales:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedShift, sortConfig, currentPage, itemsPerPage, shifts, router, userRole, userShift]);

  // Memoized fetch report data function - gets accurate totals for all records matching filter
  const fetchOrderReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Set up API parameters
      const API_BASE_URL = getApiBaseUrl();
      let queryParams;

      if (userRole === "billing_counter" && userShift) {
        // For billing_counter users, use the date range set in setupUserShift
        queryParams = new URLSearchParams({
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          shift_id: userShift.id.toString(),
        }).toString();
      } else {
        // For admin and other users, use the selected shift
        queryParams = new URLSearchParams({
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          shift_id: selectedShift,
        }).toString();
      }

      const response = await fetch(`${API_BASE_URL}/api/order-report?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Update totals with the accurate data from the report
      setTotals({
        count: data.totals.count,
        total_amount: data.totals.total_amount,
        payment_methods: data.totals.payment_methods,
      });
    } catch (error) {
      console.error("Error fetching order report:", error);
    } finally {
      setReportLoading(false);
    }
  }, [dateRange, selectedShift, userRole, userShift, router]);

  // Initial data fetch
  useEffect(() => {
    // Get user data from localStorage
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role || null);
      }
    } catch (error) {
      console.error("Error getting user role:", error);
    }

    // Fetch shifts only once
    fetchShifts();

    // Cleanup function to cancel pending fetches when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchShifts]);

  // Setup user shift when both user role and shifts are loaded
  useEffect(() => {
    if (userRole === "billing_counter" && shifts.length > 0) {
      setupUserShift(shifts);
    }
  }, [userRole, shifts, setupUserShift]);

  // Fetch sales data when dependencies change
  useEffect(() => {
    fetchSales();
    fetchOrderReport(); // Fetch accurate totals for the filter
  }, [fetchSales, fetchOrderReport]);

  // Update filtered sales when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSales(sales);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = sales.filter(
        (sale) =>
          (sale.customer_name && sale.customer_name.toLowerCase().includes(searchLower)) ||
          (sale.payment_method && sale.payment_method.toLowerCase().includes(searchLower)) ||
          (sale.id && String(sale.id).toLowerCase().includes(searchLower)) ||
          (sale.total_amount && String(sale.total_amount).toLowerCase().includes(searchLower))
      );
      setFilteredSales(filtered);
    }
  }, [searchTerm, sales]);

  // Sort functionality
  const requestSort = (field) => {
    let direction = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ field, direction });
  };

  // CSV Download functionality
  const downloadCSV = () => {
    // Define the columns for CSV
    const headers = ["ID", "Date", "Items", "Total", "Shift"];

    // Map sales data to CSV rows
    const csvRows = filteredSales.map((sale) => [
      sale.id,
      formatDateTime(sale.created_at),
      sale.items ? sale.items.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0) : 0,
      sale.total_amount,
      sale.shift ? sale.shift.name : "No Shift",
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
    let filename = "orders";
    if (userRole === "billing_counter" && userShift) {
      // For billing_counter users, include shift info in the filename
      filename = `orders-${userShift.name.replace(/\s+/g, "-").toLowerCase()}`;
      if (isDateRange && dateRange.start_date !== dateRange.end_date) {
        filename += `-${dateRange.start_date}-to-${dateRange.end_date}`;
      } else {
        filename += `-${dateRange.start_date}`;
      }
    } else {
      // For other users, use date range in the filename
      filename = `orders-${dateRange.start_date}`;
      if (dateRange.start_date !== dateRange.end_date) {
        filename += `-to-${dateRange.end_date}`;
      }

      // If a specific shift is selected, include the shift name
      if (selectedShift !== "all") {
        const shiftName = shifts.find((s) => s.id.toString() === selectedShift)?.name;
        if (shiftName) {
          filename += `-${shiftName.replace(/\s+/g, "-").toLowerCase()}`;
        }
      }
    }

    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Add an effect to fetch data when pagination changes
  useEffect(() => {
    // Only fetch if we have already loaded the initial data
    if (!loading && !reportLoading) {
      fetchSales();
    }
  }, [currentPage, itemsPerPage, fetchSales, loading, reportLoading]); // Triggered on pagination changes

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Orders</h1>
          {userRole === "billing_counter" ? <p>View and manage orders from your shift</p> : <p>Manage all restaurant orders</p>}
        </div>
        <div className={styles.headerActions}>
          <button className={orderStyles.reportButton} onClick={downloadCSV}>
            <FileDown size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs - Only show Sale Out tab for billing_counter users */}
      {userRole === "billing_counter" && (
        <div className={orderStyles.orderTabs}>
          <button className={`${orderStyles.orderTab} ${activeTab === "orders" ? orderStyles.activeTab : ""}`} onClick={() => setActiveTab("orders")}>
            Order List
          </button>
          <button
            className={`${orderStyles.orderTab} ${activeTab === "saleOut" ? orderStyles.activeTab : ""}`}
            onClick={() => setActiveTab("saleOut")}
          >
            Sale Out
          </button>
        </div>
      )}

      {/* Show different content based on active tab */}
      {activeTab === "saleOut" ? (
        <ShiftSummaryReport />
      ) : (
        <>
          {/* Filters and Summary Section */}
          <div className={orderStyles.ordersControls}>
            <div className={orderStyles.filters}>
              {/* Only show date filter for non-billing_counter users */}
              {userRole !== "billing_counter" && (
                <div className={orderStyles.filterItem}>
                  <button className={orderStyles.filterButton} onClick={() => setShowDatePicker(!showDatePicker)}>
                    <Calendar size={16} />
                    <span>{getDateFilterDisplayText()}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showDatePicker && (
                    <div className={orderStyles.datePickerDropdown}>
                      <div className={orderStyles.datePickerHeader}>
                        <h4>Select Date</h4>
                      </div>
                      <div className={orderStyles.datePickerBody}>
                        <div className={orderStyles.dateRangeInputs}>
                          <div className={orderStyles.dateRangeInput}>
                            <label>From</label>
                            <input
                              type="date"
                              value={dateRange.start_date}
                              onChange={(e) => handleDateRangeChange("start_date", e.target.value)}
                              className={orderStyles.datePicker}
                            />
                          </div>
                          <div className={orderStyles.dateRangeInput}>
                            <label>To</label>
                            <input
                              type="date"
                              value={dateRange.end_date}
                              onChange={(e) => handleDateRangeChange("end_date", e.target.value)}
                              className={orderStyles.datePicker}
                            />
                          </div>
                        </div>

                        <div className={orderStyles.dateShortcuts}>
                          <div className={orderStyles.shortcutHeader}>Quick Select</div>
                          <button
                            className={`${orderStyles.dateShortcutButton} ${activeDateFilter === "today" ? orderStyles.activeShortcut : ""}`}
                            onClick={() => handleQuickDateSelect("today")}
                          >
                            Today
                          </button>
                          <button
                            className={`${orderStyles.dateShortcutButton} ${activeDateFilter === "yesterday" ? orderStyles.activeShortcut : ""}`}
                            onClick={() => handleQuickDateSelect("yesterday")}
                          >
                            Yesterday
                          </button>
                          <button
                            className={`${orderStyles.dateShortcutButton} ${activeDateFilter === "last7days" ? orderStyles.activeShortcut : ""}`}
                            onClick={() => handleQuickDateSelect("last7days")}
                          >
                            Last 7 days
                          </button>
                          <button
                            className={`${orderStyles.dateShortcutButton} ${activeDateFilter === "thisWeek" ? orderStyles.activeShortcut : ""}`}
                            onClick={() => handleQuickDateSelect("thisWeek")}
                          >
                            This week
                          </button>
                          <button
                            className={`${orderStyles.dateShortcutButton} ${activeDateFilter === "thisMonth" ? orderStyles.activeShortcut : ""}`}
                            onClick={() => handleQuickDateSelect("thisMonth")}
                          >
                            This month
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Only show shift filter for non-billing_counter users */}
              {userRole !== "billing_counter" && (
                <div className={orderStyles.filterItem}>
                  <button className={orderStyles.filterButton} onClick={() => setShowShiftDropdown(!showShiftDropdown)}>
                    <Clock size={16} />
                    <span>
                      {selectedShift === "all" ? "All Shifts" : shifts.find((shift) => shift.id === parseInt(selectedShift))?.name || "Select Shift"}
                    </span>
                    <ChevronDown size={14} />
                  </button>
                  {showShiftDropdown && (
                    <div className={orderStyles.shiftDropdown}>
                      <div className={orderStyles.shiftItem} onClick={() => handleShiftChange("all")}>
                        All Shifts
                      </div>
                      {shifts.map((shift) => (
                        <div key={shift.id} className={orderStyles.shiftItem} onClick={() => handleShiftChange(shift.id.toString())}>
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* For billing_counter users, show date range and their shift info as a static display */}
              {userRole === "billing_counter" && userShift && (
                <>
                  <div className={orderStyles.filterItem}>
                    <div className={orderStyles.userShiftInfo}>
                      <Calendar size={16} />
                      <span>
                        {isDateRange && dateRange.start_date !== dateRange.end_date
                          ? `${formatDate(dateRange.start_date)} - ${formatDate(dateRange.end_date)}`
                          : formatDate(dateRange.start_date)}
                      </span>
                    </div>
                  </div>
                  <div className={orderStyles.filterItem}>
                    <div className={orderStyles.userShiftInfo}>
                      <Clock size={16} />
                      <span>
                        {userShift.name} ({userShift.start_time} - {userShift.end_time})
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={orderStyles.summaryCards}>
              <div className={orderStyles.summaryCard}>
                <div className={orderStyles.summaryIcon}>
                  <ShoppingBag size={20} />
                </div>
                <div className={orderStyles.summaryInfo}>
                  <span className={orderStyles.summaryLabel}>Total Orders</span>
                  <span className={orderStyles.summaryValue}>
                    {reportLoading ? <span className={orderStyles.summaryLoading}>Loading...</span> : totals.count}
                  </span>
                </div>
              </div>

              <div className={orderStyles.summaryCard}>
                <div className={orderStyles.summaryIcon}>
                  <CreditCard size={20} />
                </div>
                <div className={orderStyles.summaryInfo}>
                  <span className={orderStyles.summaryLabel}>Total Sales</span>
                  <span className={orderStyles.summaryValue}>
                    {reportLoading ? <span className={orderStyles.summaryLoading}>Loading...</span> : formatCurrency(totals.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {filteredSales.length === 0 ? (
            <div className={styles.card}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <ShoppingBag size={48} strokeWidth={1} />
                </div>
                <h2 className={styles.emptyTitle}>No orders found</h2>
                <p className={styles.emptyText}>
                  {dateRange.start_date === new Date().toISOString().split("T")[0] && dateRange.end_date === new Date().toISOString().split("T")[0]
                    ? "No orders have been placed today"
                    : `No orders found for the selected date range`}
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.tableTools}>
                <div className={styles.leftActions}>
                  <div className={styles.tableLength}>
                    <label>Show</label>
                    <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                      <option value={200}>200</option>
                      <option value={300}>300</option>
                      <option value={400}>400</option>
                      <option value={500}>500</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className={styles.totalCount}>
                    Total: <span>{totals.count}</span> orders
                    {totalItems > itemsPerPage && (
                      <span className={styles.paginationInfo}>
                        (Showing page {currentPage} of {totalPages})
                      </span>
                    )}
                  </div>
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
                <table className={styles.productsTable}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th onClick={() => requestSort("created_at")} style={{ cursor: "pointer" }}>
                        Date & Time
                        {sortConfig.field === "created_at" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                      </th>
                      <th onClick={() => requestSort("total_amount")} style={{ cursor: "pointer" }}>
                        Total
                        {sortConfig.field === "total_amount" && (
                          <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                        )}
                      </th>
                      <th>Items</th>
                      <th>Order Number</th>
                      <th onClick={() => requestSort("shift_id")} style={{ cursor: "pointer" }}>
                        Shift
                        {sortConfig.field === "shift_id" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                      </th>
                      <th>Order Taker</th>
                      {/* <th>Actions</th> */}
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{formatDateTime(sale.created_at)}</td>
                        <td className={orderStyles.amountCell}>{formatCurrency(sale.total_amount)}</td>
                        <td className={orderStyles.itemsCell}>
                          <div className={orderStyles.itemsList}>
                            {sale.items?.length > 0 ? (
                              <>
                                <span>{sale.items.length} items</span>
                                <div className={orderStyles.itemsTooltip}>
                                  <ul>
                                    {sale.items.map((item, index) => (
                                      <li key={index}>
                                        {item.quantity} x {item.name} ({formatCurrency(item.subtotal)})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </>
                            ) : (
                              <span>No items</span>
                            )}
                          </div>
                        </td>
                        <td>{sale.order_number}</td>
                        <td>
                          {sale.shift ? (
                            <span className={orderStyles.shiftBadge}>{sale.shift.name}</span>
                          ) : (
                            <span className={orderStyles.noShift}>No shift</span>
                          )}
                        </td>
                        <td>{sale.user.name}</td>
                        {/* <td>
                          <button
                            onClick={() => handleViewReceipt(sale)}
                            className={orderStyles.viewReceiptButton}
                            aria-label={`View Receipt for Order #${sale.id}`}
                          >
                            <Eye size={16} />
                            <span>Receipt</span>
                          </button>
                        </td> */}
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

                  {/* Display all page numbers */}
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

          {/* Receipt Modal */}
          {selectedSale && <ReceiptModal sale={selectedSale} isOpen={isReceiptModalOpen} onClose={handleCloseModal} />}
        </>
      )}
    </div>
  );
}
