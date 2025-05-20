"use client";

import RouteGuard from "@/components/RouteGuard";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { ChevronLeft, ChevronRight, Clock, FileDown, Pencil, Plus, Search, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../products/products.module.css";

function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ field: "name", direction: "asc" });

  const router = useRouter();

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        // Check if user is authenticated
        const user = localStorage.getItem("user");
        if (!user) {
          router.push("/login");
          return;
        }

        // Parse user data and get token using our helper
        const parsedUser = JSON.parse(user);
        const token = parsedUser.token || getAuthToken();

        if (!token) {
          console.error("No auth token found - redirecting to login");
          router.push("/login");
          return;
        }

        setAuthInfo({
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenStart: token ? token.substring(0, 10) + "..." : "None",
        });

        const API_BASE_URL = getApiBaseUrl();
        console.log("Making API request to:", `${API_BASE_URL}/api/shifts`);
        console.log("With auth token:", token ? "Bearer " + token.substring(0, 10) + "..." : "None");

        const response = await fetch(`${API_BASE_URL}/api/shifts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error response:", errorData);
          throw new Error(`Error: ${response.status}${errorData.message ? " - " + errorData.message : ""}`);
        }

        const data = await response.json();
        console.log("Shifts data received:", data);
        setShifts(data);
        setFilteredShifts(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching shifts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [router]);

  // Update filtered shifts when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredShifts(shifts);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = shifts.filter(
        (shift) =>
          String(shift.name || "")
            .toLowerCase()
            .includes(searchLower) ||
          (shift.description && String(shift.description).toLowerCase().includes(searchLower))
      );
      setFilteredShifts(filtered);
    }
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, shifts]);

  // Sort functionality
  const requestSort = (field) => {
    let direction = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ field, direction });

    // Apply sorting
    const sortedShifts = [...filteredShifts].sort((a, b) => {
      if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
      if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredShifts(sortedShifts);
  };

  // CSV Download functionality
  const downloadCSV = () => {
    // Define the columns for CSV
    const headers = ["ID", "Name", "Start Time", "End Time", "Description", "Status"];

    // Map shifts data to CSV rows
    const csvRows = filteredShifts.map((shift) => [shift.id, shift.name, shift.start_time, shift.end_time, shift.description || "", shift.status]);

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
    link.setAttribute("download", `shifts-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredShifts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredShifts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this shift?")) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user.token || getAuthToken();

      if (!token) {
        alert("Authentication token missing. Please log in again.");
        router.push("/login");
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/shifts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      // Remove deleted shift from state
      const updatedShifts = shifts.filter((shift) => shift.id !== id);
      setShifts(updatedShifts);
      setFilteredShifts(
        updatedShifts.filter(
          (shift) =>
            searchTerm.trim() === "" ||
            String(shift.name || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (shift.description && String(shift.description).toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    } catch (err) {
      alert(err.message);
      console.error("Error deleting shift:", err);
    }
  };

  // Format time to 12-hour format with AM/PM
  const formatTime = (timeString) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading shifts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>!</div>
          <h2>Error Loading Shifts</h2>
          <p>{error}</p>
          <div className={styles.errorDetails}>
            <p>
              <strong>API URL:</strong> {getApiBaseUrl()}/api/shifts
            </p>
            {authInfo && (
              <>
                <p>
                  <strong>Token Status:</strong> {authInfo.hasToken ? "Present" : "Missing"}
                </p>
                <p>
                  <strong>Token Preview:</strong> {authInfo.tokenStart}
                </p>
              </>
            )}
          </div>
          <button onClick={() => router.push("/login")} className={styles.errorButton}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Shifts</h1>
          <p>Manage your restaurant staff shifts</p>
        </div>
        <Link href="/dashboard/shifts/add" className={styles.addButton}>
          <Plus size={16} />
          <span>New Shift</span>
        </Link>
      </div>

      {shifts.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Clock size={48} strokeWidth={1} />
            </div>
            <h2 className={styles.emptyTitle}>No shifts found</h2>
            <p className={styles.emptyText}>You haven't created any shifts yet</p>
            <Link href="/dashboard/shifts/add" className={styles.addButton}>
              <Plus size={16} />
              <span>Create your first shift</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableTools}>
            <div className={styles.leftActions}>
              <div className={styles.tableLength}>
                <label>Show</label>
                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>

              <div className={styles.totalCount}>
                Total: <span>{filteredShifts.length}</span> shifts
              </div>
            </div>

            <div className={styles.rightActions}>
              <button onClick={downloadCSV} className={styles.downloadButton}>
                <FileDown size={16} />
                <span>Export CSV</span>
              </button>

              <div className={styles.searchInputWrapper}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search shifts..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.productsTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th onClick={() => requestSort("id")} style={{ cursor: "pointer" }} data-sort="true">
                    ID
                    {sortConfig.field === "id" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }} data-sort="true">
                    Name
                    {sortConfig.field === "name" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("start_time")} style={{ cursor: "pointer" }} data-sort="true">
                    Start Time
                    {sortConfig.field === "start_time" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("end_time")} style={{ cursor: "pointer" }} data-sort="true">
                    End Time
                    {sortConfig.field === "end_time" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("description")} style={{ cursor: "pointer" }} className={styles.hiddenMobile} data-sort="true">
                    Description
                    {sortConfig.field === "description" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th onClick={() => requestSort("status")} style={{ cursor: "pointer" }} data-sort="true">
                    Status
                    {sortConfig.field === "status" && <span className={styles.sortIcon}>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {currentItems.map((shift) => (
                  <tr key={shift.id}>
                    <td>{shift.id}</td>
                    <td className={styles.productName}>{shift.name}</td>
                    <td>{formatTime(shift.start_time)}</td>
                    <td>{formatTime(shift.end_time)}</td>
                    <td className={styles.hiddenMobile}>
                      {shift.description ? (
                        shift.description.length > 60 ? (
                          `${shift.description.substring(0, 60)}...`
                        ) : (
                          shift.description
                        )
                      ) : (
                        <span style={{ fontStyle: "italic", color: "#aaa" }}>No description</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${shift.status === "active" ? styles.statusActive : styles.statusInactive}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/dashboard/shifts/edit/${shift.id}`} className={styles.editButton} aria-label={`Edit ${shift.name}`}>
                          <Pencil size={16} />
                        </Link>
                        <button onClick={() => handleDelete(shift.id)} className={styles.deleteButton} aria-label={`Delete ${shift.name}`}>
                          <Trash size={16} />
                        </button>
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
              <button onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)} disabled={currentPage === 1} className={styles.pageNavButton}>
                <ChevronLeft size={16} />
              </button>

              {[...Array(totalPages)].map((_, index) => {
                // Show limited page numbers with ellipsis
                const pageNum = index + 1;
                const showPageNumber = pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                if (showPageNumber) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`${styles.pageButton} ${pageNum === currentPage ? styles.pageButtonActive : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
                  return <span key={pageNum}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
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
  );
}

export default function ProtectedShiftsPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <ShiftsPage />
    </RouteGuard>
  );
}
