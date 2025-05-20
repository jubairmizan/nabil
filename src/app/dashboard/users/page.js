"use client";

import RouteGuard from "@/components/RouteGuard";
import { getApiBaseUrl, getAuthToken } from "@/lib/api-config";
import { ChevronLeft, ChevronRight, FileDown, Key, Pencil, Plus, Search, Trash, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import styles from "../products/products.module.css";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ field: "name", direction: "asc" });

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
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
        console.log("Making API request to:", `${API_BASE_URL}/api/users`);

        const response = await fetch(`${API_BASE_URL}/api/users`, {
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
        console.log("Users data received:", data);
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  // Update filtered users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = users.filter(
        (user) =>
          String(user.name || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(user.email || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(user.role || "")
            .toLowerCase()
            .includes(searchLower)
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, users]);

  // Sort functionality
  const requestSort = (field) => {
    let direction = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ field, direction });

    // Apply sorting
    const sortedUsers = [...filteredUsers].sort((a, b) => {
      if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
      if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(sortedUsers);
  };

  // CSV Download functionality
  const downloadCSV = () => {
    // Define the columns for CSV
    const headers = ["ID", "Name", "Email", "Role", "Section", "Shift", "Status", "Created At"];

    // Map users data to CSV rows
    const csvRows = filteredUsers.map((user) => [
      user.id,
      user.name,
      user.email,
      user.role || "User",
      user.assigned_section || "ALL",
      user.role === "billing_counter" && user.shift ? user.shift.name : "N/A",
      user.email_verified_at ? "Active" : "Inactive",
      new Date(user.created_at).toLocaleDateString(),
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
    link.setAttribute("download", `users-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This user will be deactivated. You can reactivate them later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, deactivate!",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = userData.token || getAuthToken();

      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Authentication Error",
          text: "Authentication token missing. Please log in again.",
        });
        router.push("/login");
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/users/${id}`, {
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

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "User has been deactivated successfully",
      });

      // Refresh user list
      const updatedUsers = await fetch(`${getApiBaseUrl()}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());

      setUsers(updatedUsers);
      setFilteredUsers(
        updatedUsers.filter(
          (user) =>
            searchTerm.trim() === "" ||
            String(user.name || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            String(user.email || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        )
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to deactivate user",
      });
      console.error("Error deactivating user:", err);
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const token = userData.token || getAuthToken();

      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Authentication Error",
          text: "Authentication token missing. Please log in again.",
        });
        router.push("/login");
        return;
      }

      const { value: password } = await Swal.fire({
        title: "Enter new password",
        input: "password",
        inputLabel: "New Password",
        inputPlaceholder: "Enter new password",
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return "You need to enter a password!";
          }
          if (value.length < 8) {
            return "Password must be at least 8 characters long";
          }
        },
      });

      if (!password) return;

      const response = await fetch(`${getApiBaseUrl()}/api/users/${id}/reset-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Password has been reset successfully",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to reset password",
      });
      console.error("Error resetting password:", err);
    }
  };

  // CSS for role badges
  const roleStyles = `
    .roleBadge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 9999px;
      text-transform: capitalize;
    }
    .roleAdmin {
      background-color: #7c3aed;
      color: white;
    }
    .roleUser {
      background-color: #0ea5e9;
      color: white;
    }
    .roleStaff {
      background-color: #10b981;
      color: white;
    }
    .shiftBadge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 9999px;
      background-color: #f59e0b;
      color: white;
    }
    .noShift {
      color: #dc2626;
      font-size: 0.75rem;
      font-style: italic;
    }
    .notApplicable {
      color: #9ca3af;
      font-size: 0.75rem;
    }
  `;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>!</div>
          <h2>Error Loading Users</h2>
          <p>{error}</p>
          <div className={styles.errorDetails}>
            <p>
              <strong>API URL:</strong> {getApiBaseUrl()}/api/users
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
      <style>{roleStyles}</style>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>User Management</h1>
          <p>Manage user accounts and access control</p>
        </div>
        <Link href="/dashboard/users/add" className={styles.addButton}>
          <Plus size={16} />
          <span>New User</span>
        </Link>
      </div>

      {users.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <UserCog size={48} strokeWidth={1} />
            </div>
            <h2 className={styles.emptyTitle}>No users found</h2>
            <p className={styles.emptyText}>You haven't created any additional users yet</p>
            <Link href="/dashboard/users/add" className={styles.addButton}>
              <Plus size={16} />
              <span>Create your first user</span>
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
                Total: <span>{filteredUsers.length}</span> users
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
                  placeholder="Search users..."
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
                  <th onClick={() => requestSort("name")} style={{ cursor: "pointer" }} className={styles.sortableHeader}>
                    <div className={styles.headerContent}>
                      Name
                      <span className={styles.sortArrow}>{sortConfig.field === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}</span>
                    </div>
                  </th>
                  <th onClick={() => requestSort("email")} style={{ cursor: "pointer" }} className={styles.sortableHeader}>
                    <div className={styles.headerContent}>
                      Email
                      <span className={styles.sortArrow}>{sortConfig.field === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}</span>
                    </div>
                  </th>
                  <th onClick={() => requestSort("role")} style={{ cursor: "pointer" }} className={styles.sortableHeader}>
                    <div className={styles.headerContent}>
                      Role
                      <span className={styles.sortArrow}>{sortConfig.field === "role" && (sortConfig.direction === "asc" ? "↑" : "↓")}</span>
                    </div>
                  </th>
                  <th onClick={() => requestSort("assigned_section")} style={{ cursor: "pointer" }} className={styles.sortableHeader}>
                    <div className={styles.headerContent}>
                      Section
                      <span className={styles.sortArrow}>
                        {sortConfig.field === "assigned_section" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </span>
                    </div>
                  </th>
                  <th onClick={() => requestSort("shift_id")} style={{ cursor: "pointer" }} className={styles.sortableHeader}>
                    <div className={styles.headerContent}>
                      Shift
                      <span className={styles.sortArrow}>{sortConfig.field === "shift_id" && (sortConfig.direction === "asc" ? "↑" : "↓")}</span>
                    </div>
                  </th>
                  <th onClick={() => requestSort("created_at")} style={{ cursor: "pointer" }} className={styles.sortableHeader}>
                    <div className={styles.headerContent}>
                      Created At
                      <span className={styles.sortArrow}>{sortConfig.field === "created_at" && (sortConfig.direction === "asc" ? "↑" : "↓")}</span>
                    </div>
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={styles.noResults}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                          {/* if there is any _ in the role, remove it */}
                          {user.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.sectionBadge} ${styles[user.assigned_section.toLowerCase()]}`}>
                          {/* if there is any _ in the assigned_section, remove it */}
                          {user.assigned_section.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        {user.role === "billing_counter" ? (
                          user.shift ? (
                            <span className={styles.shiftBadge}>{user.shift.name}</span>
                          ) : (
                            <span className={styles.noShift}>No shift assigned</span>
                          )
                        ) : (
                          <span className={styles.notApplicable}>N/A</span>
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>{user.email_verified_at ? "Active" : "Inactive"}</td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actions}>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className={styles.resetButton}
                            aria-label={`Reset password for ${user.name}`}
                            style={{
                              backgroundColor: "#0284c7",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              width: "35px",
                              height: "35px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              // marginRight: "4px",
                            }}
                          >
                            <Key size={16} />
                          </button>
                          <Link href={`/dashboard/users/edit/${user.id}`} className={styles.editButton} aria-label={`Edit ${user.name}`}>
                            <Pencil size={16} />
                          </Link>
                          <button onClick={() => handleDelete(user.id)} className={styles.deleteButton} aria-label={`Delete ${user.name}`}>
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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

export default function ProtectedUsersPage() {
  return (
    <RouteGuard allowedRoles={["admin"]}>
      <UsersPage />
    </RouteGuard>
  );
}
